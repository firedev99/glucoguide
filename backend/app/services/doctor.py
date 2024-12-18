from sqlalchemy import func
from fastapi import Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session, joinedload, defer
from redis import Redis
import json

from app.db import get_db as db
from app.core.utils import ResponseHandler
from app.models import User, Doctor, Hospital
from app.core.security import decrypt, generate_hash
from app.core.security import uuid_to_base64, base64_to_uuid
from app.schemas.doctor import DoctorCreateAdmin, DoctorUpdateAdmin, DoctorResponse


class DoctorService:
    # create a new doctor account /admin
    @staticmethod
    async def new_doctor_account_admin(
        details: DoctorCreateAdmin, hospital_id: str, db: Session = Depends(db)
    ):
        hospital = db.query(Hospital).where(Hospital.id == hospital_id).first()

        if not hospital:
            raise ResponseHandler.not_found_error(f"hospital not found - {hospital_id}")

        exits = db.query(Doctor).where(Doctor.email == details.email).first()

        # check if the doctor account already exists
        if exits:
            raise HTTPException(
                status_code=409,
                detail=f"an account with this email already exists - {details.email}",
            )

        decrypted_password = await decrypt(
            details.password
        )  # decrypt the password from the client

        # generate hashed password
        hashed_password = generate_hash(decrypted_password)
        details.password = hashed_password

        details.emails = [details.email, *hospital.emails]
        details.contact_numbers = [*details.contact_numbers, *hospital.contact_numbers]

        payload = {
            "created_by": "admin",
            "hospital_id": hospital.id,
            "role": "doctor",
            **details.model_dump(),
        }

        # create a new user w the hashed password
        new_doctor = Doctor(**payload)

        db.add(new_doctor)
        db.commit()
        db.refresh(new_doctor)

        return {
            "status": "successful",
            "message": f"successfully created a new doctor account - {new_doctor.id}",
        }

    # retrieve all doctor accounts  /admin
    @staticmethod
    async def retrieve_all_doctors_admin(
        db: Session,
        offset: int = 0,
        # this way it adds a layer of constraint, asking the parameter either be 100 or less than 100
        limit: int = Query(default=100, le=100),
    ):
        doctors = (
            db.query(Doctor)
            .offset(offset)
            .limit(limit)
            .options(
                defer(Doctor.password),
                joinedload(Doctor.hospital).load_only(
                    Hospital.id, Hospital.name, Hospital.city, Hospital.address
                ),
            )
            .all()
        )

        return {
            "status": "successful",
            "message": "successfully fetched all doctors!",
            "data": doctors,
        }

    # retrieve all doctor accounts  /general
    @staticmethod
    async def retrieve_all_doctors_general(
        db: Session,
        redis: Redis,
        page: int,
        limit: int,
        hospitals: list[str] | None,
        locations: list[str] | None,
        experience: int | None,
    ):
        page = max(1, page)
        offset = (page - 1) * limit
        redis_key = f"doctors:page:{page}"

        # get the total size of the doctor database
        total_count = db.query(Doctor).count()

        # retrive doctor informations from redis if found
        if (
            (cached_doctors_info := redis.get(redis_key))
            and (hospitals is None)
            and (locations is None)
            and (experience is None)
        ):
            result = json.loads(cached_doctors_info)
            return ResponseHandler.fetch_successful(
                f"successfully retrived doctor informations #page-{page} from cache",
                result,
                total_count,
            )

        # retrive the doctors information from database
        query = (
            db.query(Doctor)
            .join(Hospital)
            .options(
                defer(Doctor.password),
                defer(Doctor.created_at),
                defer(Doctor.updated_at),
                joinedload(Doctor.hospital).load_only(
                    Hospital.name, Hospital.city, Hospital.address
                ),
            )
        )

        # handle filtering params
        if hospitals:
            query = query.filter(Hospital.name.in_(hospitals))
        if locations:
            query = query.filter(Hospital.city.in_(locations))
        if experience:
            query = query.filter(Doctor.experience >= experience)

        doctors = query.offset(offset).limit(limit).all()

        # restructure the result for general users (replace id w base64 string)
        doctors_info_data = jsonable_encoder(
            [
                {
                    "id": uuid_to_base64(doctor.id),
                    "hospital": {
                        "id": uuid_to_base64(doctor.hospital.id),
                        "name": doctor.hospital.name,
                        "city": doctor.hospital.city,
                        "address": doctor.hospital.address,
                    },
                    **{
                        key: val
                        for key, val in doctor.__dict__.items()
                        if key != "id" and key != "hospital_id" and key != "hospital"
                    },
                }
                for doctor in doctors
            ]
        )

        # set the doctors information into redis
        if not hospitals and not locations and not experience:
            doctors_info_json = json.dumps(doctors_info_data)
            redis.set(redis_key, doctors_info_json, 3600)

        # reassign the total size of the doctor database for filtering
        if hospitals or locations:
            total_count = query.count()

        return ResponseHandler.fetch_successful(
            f"successfully retrived doctor informations #page-{page}",
            doctors_info_data,
            total_count,
        )

    # retrieve doctor accounts by hospital id /general
    @staticmethod
    async def retrieve_doctors_by_hospital_general(
        id: str, page: int, limit: int, db: Session, redis: Redis
    ):
        hospital_id = base64_to_uuid(id)  # covert base64 string to uuid
        redis_key = f"doctor:info:hospital:{hospital_id}"
        page = max(1, page)
        offset = (page - 1) * limit

        # get the total size of the doctor database
        total_count = db.query(Doctor).count()

        # retrive doctors information from redis if found
        if cached_doctors_info := redis.get(redis_key):
            result = json.loads(cached_doctors_info)
            return ResponseHandler.fetch_successful(
                f"successfully retrived doctors information of hospital #{hospital_id} #page-{page} from cache",
                result,
                total_count,
            )

        # retrive the doctors information from database
        doctors = (
            db.query(Doctor)
            .where(Doctor.hospital_id == hospital_id)
            .join(Hospital)
            .options(
                defer(Doctor.password),
                defer(Doctor.created_at),
                defer(Doctor.updated_at),
                joinedload(Doctor.hospital).load_only(
                    Hospital.name, Hospital.city, Hospital.address
                ),
            )
            .offset(offset)
            .limit(limit)
            .all()
        )

        # restructure the result for general users (replace id w base64 string)
        doctors_info_data = jsonable_encoder(
            [
                {
                    "id": uuid_to_base64(doctor.id),
                    "hospital": {
                        "id": uuid_to_base64(doctor.hospital.id),
                        "name": doctor.hospital.name,
                        "city": doctor.hospital.city,
                        "address": doctor.hospital.address,
                    },
                    **{
                        key: val
                        for key, val in doctor.__dict__.items()
                        if key != "id" and key != "hospital_id" and key != "hospital"
                    },
                }
                for doctor in doctors
            ]
        )

        # set the doctors information into redis
        doctors_info_json = json.dumps(doctors_info_data)
        redis.set(redis_key, doctors_info_json, 3600)

        return ResponseHandler.fetch_successful(
            f"successfully retrived doctors information of hospital #{hospital_id} #page-{page}",
            doctors_info_data,
            total_count,
        )

    # retrieve doctor account information using doctor id  /general
    @staticmethod
    async def get_doctor_information(id: str, db: Session, redis: Redis):
        doctor_id = base64_to_uuid(id)  # covert base64 string to uuid
        redis_key = f"doctor:info:{doctor_id}"  # set keys dynamically

        # retrive doctors information from redis if found
        if cached_doctor_info := redis.get(redis_key):
            result = json.loads(cached_doctor_info)
            return ResponseHandler.fetch_successful(
                f"successfully retrived doctor information #{doctor_id} from cache",
                result,
            )

        # query the doctor data w specific informations
        doctor = (
            db.query(Doctor)
            .where(Doctor.id == doctor_id)
            .options(
                defer(Doctor.password),
                joinedload(Doctor.hospital).load_only(
                    Hospital.name, Hospital.city, Hospital.address
                ),
            )
            .first()
        )

        # handle not found
        if not doctor:
            raise ResponseHandler.not_found_error(f"doctor not found #{doctor_id}")

        # restructure the doctor profile informations
        profile_data = {
            "id": id,
            "name": doctor.name,
            "gender": doctor.gender,
            "img_src": doctor.img_src,
            "address": doctor.address,
            "description": doctor.description,
            "available_times": doctor.available_times,
            "experience": doctor.experience,
            "emails": doctor.emails,
            "contact_numbers": doctor.contact_numbers,
            "hospital": {
                "id": uuid_to_base64(doctor.hospital.id),
                "name": doctor.hospital.name,
                "city": doctor.hospital.city,
                "address": doctor.hospital.address,
            },
        }

        # update the doctor information into redis caching
        profile_json = json.dumps(profile_data)
        redis.set(redis_key, profile_json, 3600)

        return ResponseHandler.fetch_successful(
            f"successfully retrived doctor information #{doctor_id}",
            profile_data,
        )

    # get doctor information using doctor id /admin
    @staticmethod
    async def get_doctor_information_admin(doctor_id: str, db: Session):
        doctor = (
            db.query(Doctor)
            .where(Doctor.id == doctor_id)
            .options(
                defer(Doctor.password),
                joinedload(Doctor.hospital).load_only(
                    Hospital.id, Hospital.name, Hospital.city, Hospital.address
                ),
            )
            .first()
        )

        if not doctor:
            raise ResponseHandler.not_found_error(f"doctor not found - {doctor_id}")

        return {
            "status": "successful",
            "message": f"successfully retrieved doctor information - {doctor.id}",
            "data": doctor,
        }

    # update doctor information using doctor id /admin
    @staticmethod
    async def update_doctor_information_admin(
        doctor_id: str, details: DoctorUpdateAdmin, db: Session
    ):
        doctor = db.query(Doctor).where(Doctor.id == doctor_id).first()

        # check if the doctor exists
        if not doctor:
            raise ResponseHandler.not_found_error(f"doctor not found - {doctor_id}")

        if details.is_empty():
            raise HTTPException(
                status_code=400,
                detail=f"updating doctor failed, no field was provided - {doctor.id}",
            )

        # check if the password is given or not
        if details.password:
            decrypted_new_pass = await decrypt(details.password)
            new_hashed_pass = generate_hash(decrypted_new_pass)
            details.password = new_hashed_pass

        # update the patient information
        payload = {"updated_at": func.now(), **details.none_excluded()}
        user_payload = {
            key: val for key, val in payload.items() if key in User.__table__.columns
        }
        doctor_payload = {
            key: val for key, val in payload.items() if key in Doctor.__table__.columns
        }

        if user_payload:
            db.query(User).where(User.id == doctor.id).update(user_payload)

        if doctor_payload:
            db.query(Doctor).where(Doctor.id == doctor.id).update(doctor_payload)

        db.commit()
        db.refresh(doctor)

        doctor_informations = (
            db.query(Doctor)
            .where(Doctor.id == doctor_id)
            .options(
                defer(Doctor.password),
                joinedload(Doctor.hospital).load_only(
                    Hospital.id, Hospital.name, Hospital.city, Hospital.address
                ),
            )
            .first()
        )

        return {
            "status": "successful",
            "message": f"successfully updated doctor information - {doctor.id}",
            "data": doctor_informations,
        }

    # retrieve doctor accounts by hospital id /admin
    @staticmethod
    async def retrieve_doctors_by_hospital_admin(
        hospital_id: str,
        db: Session,
        offset: int = 0,
        limit: int = Query(default=25, le=100),
    ):
        doctors = (
            db.query(Doctor)
            .where(Doctor.hospital_id == hospital_id)
            .offset(offset)
            .limit(limit)
            .options(
                defer(Doctor.password),
                joinedload(Doctor.hospital).load_only(
                    Hospital.id, Hospital.name, Hospital.city, Hospital.address
                ),
            )
            .all()
        )

        return {
            "status": "successful",
            "message": f"successfully fetched all doctors from hospital - {hospital_id}",
            "data": doctors,
        }
