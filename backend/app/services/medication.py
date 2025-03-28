import json
from redis import Redis

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import defer
from sqlalchemy import select, func, or_

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder

from app.models import Patient, Doctor, Medication
from app.core.security import uuid_to_base64, base64_to_uuid
from app.schemas.medication import (
    UpdateMedication,
    GenerateMedication,
)
from app.core.utils import ResponseHandler, get_age_group
from app.core.dummy import dummy_suggestions, exercises
from app.services.serialization import PatientSerialization


class MedicationService:
    @staticmethod
    async def generate_by_system(
        payload: GenerateMedication,
        session_user: Patient,
        db: AsyncSession,
        redis: Redis,
    ):
        age = get_age_group(payload.age)
        suggestion_data = dummy_suggestions[age]

        suggestions = {
            "primary_goals": "General Purpose",
            "patient_id": session_user.id,
            **suggestion_data,
            "exercises": exercises,
            "expiry": 30,
        }

        new_medication = Medication(**suggestions)

        db.add(new_medication)
        await db.commit()
        await db.refresh(new_medication)

        # restructure the result for general users (e.g, replace ids w base64 strings)
        medication_details = PatientSerialization.suggestion(new_medication)

        # convert the data into json and set the data into redis caching
        redis_key = f"patients:medications:{uuid_to_base64(session_user.id)}"
        medication_json = json.dumps(jsonable_encoder(medication_details))
        redis.set(redis_key, medication_json, 3600)

        return medication_details

    @staticmethod
    async def get_patient_medications(
        session_user: Patient, db: AsyncSession, redis: Redis
    ):
        patient_id = uuid_to_base64(session_user.id)
        redis_key = f"patients:medications:{patient_id}"

        # retrieve medications if data already cached
        if cached_medication_details := redis.get(redis_key):
            return json.loads(cached_medication_details)

        # Get the latest/active Medication record of the consulting patient
        query = (
            select(Medication)
            .where(
                Medication.patient_id == session_user.id,
                # Make sure either medications or exercises exists
                or_(
                    Medication.medications.isnot(None),
                    Medication.exercises.isnot(None),
                ),
            )
            .options(
                defer(
                    Medication.updated_at,
                )
            )
            .order_by(Medication.updated_at.desc())
            .limit(1)  # Restrict it to only get the latest one
        )

        result = await db.execute(query)
        db_patient_medications = result.scalar_one_or_none()

        if not db_patient_medications:
            return []

        # restructure the result for general users (e.g, replace ids w base64 strings)
        medication_details = PatientSerialization.suggestion(db_patient_medications)

        # convert the data into json and set the data into redis caching
        medication_json = json.dumps(jsonable_encoder(medication_details))
        redis.set(redis_key, medication_json, 3600)

        return medication_details

    @staticmethod
    async def appointment_medication_by_id(
        appointment_id: str, db: AsyncSession, redis: Redis
    ):
        appointment_uid = base64_to_uuid(appointment_id)
        redis_key = f"patients:appointments:{appointment_id}:prescription"

        # retrieve medications if data already cached
        if cached_medications := redis.get(redis_key):
            return json.loads(cached_medications)

        query = (
            select(Medication)
            .where(Medication.appointment_id == appointment_uid)
            .options(
                defer(Medication.updated_at),  # exclude updated_at
            )
        )

        result = await db.execute(query)
        db_appointment_medications = result.scalar_one_or_none()

        if not db_appointment_medications:
            return []

        # restructure the result for general users (e.g, replace ids w base64 strings)
        appointment_medication_details = PatientSerialization.suggestion(
            db_appointment_medications
        )

        # convert the data into json and set the data into redis caching
        appointment_medication_json = json.dumps(
            jsonable_encoder(appointment_medication_details)
        )
        redis.set(redis_key, appointment_medication_json, 3600)

        return appointment_medication_details

    @staticmethod
    async def update_patient_medications(
        payload: UpdateMedication,
        session_user: Patient | Doctor,
        patient_id: str | None,
        db: AsyncSession,
        redis: Redis,
    ):
        if patient_id:
            decoded_patient_id = base64_to_uuid(patient_id)
        else:
            decoded_patient_id = session_user.id

        redis_key = f"patients:medications:{patient_id if patient_id else uuid_to_base64(session_user.id)}"

        # Retrieve the latest record
        query = (
            select(Medication)
            .where(Medication.patient_id == decoded_patient_id)
            .order_by(Medication.updated_at.desc())
            .limit(1)
        )  # Restrict it to only get the latest one

        result = await db.execute(query)
        db_medications = result.scalar_one_or_none()

        # Raise custom error if the medication record does not exist
        if not db_medications:
            raise ResponseHandler.not_found_error(
                f"patient medication record not found."
            )

        # Raise custom error if no field was provided
        if payload.is_empty():
            raise HTTPException(
                status_code=400,
                detail=f"no field was provided while updating medications.",
            )

        updated_payload = {"updated_at": func.now(), **payload.none_excluded()}

        # Update the appointment id if the medication is being prescribed by the doctor
        if payload.appointment_id:
            updated_payload["appointment_id"] = base64_to_uuid(payload.appointment_id)

        # Update the key values
        for key, value in updated_payload.items():
            setattr(db_medications, key, value)

        # Commit the change to database and refresh the record
        await db.commit()
        await db.refresh(db_medications)

        # Restructure the result for general users (e.g, replace ids w base64 strings)
        medication_record = PatientSerialization.suggestion(db_medications)

        # Convert the data into json and store it into redis
        medication_record_json = json.dumps(jsonable_encoder(medication_record))
        redis.set(redis_key, medication_record_json, 3600)

        return medication_record

    @staticmethod
    async def delete_patient_medications(
        session_user: Patient, id: str, db: AsyncSession, redis: Redis
    ):
        patient_id = uuid_to_base64(session_user.id)
        appointment_id = base64_to_uuid(id)

        # Query the Medication record
        query = select(Medication).where(Medication.appointment_id == appointment_id)
        result = (await db.execute(query)).scalar_one_or_none()

        # Check if the record exists
        if not result:
            raise ResponseHandler.not_found_error(f"medication record #{id} not found")

        # Delete the
        await db.delete(result)
        await db.commit()

        # Delete the existing redis cache
        medication_key = f"patients:medications:{patient_id}"
        upcoming_key = f"patients:appointments:{patient_id}:upcoming"
        redis.delete(medication_key, upcoming_key)

        return {"message": f"Successfuly deleted medication record #{id}"}

    # @staticmethod
    # async def suggestions_using_ai(
    #     payload: GenerateMedicationAi,
    #     session_user: Patient,
    #     db: AsyncSession,
    #     redis: Redis,
    # ):
    #     try:
    #         # prepare a prompt for OpenAI
    #         prompt = f"""
    #         Provide a dietary recommendation for a {payload.health_metrics.age}-year-old person weighing {payload.health_metrics.weight} kg
    #         with the health condition '{', '.join(payload.health_metrics.health_conditions)}' and dietary preference '{', '.join(payload.dietary_preferences.preferences)}'.
    #         Return the response in a structured JSON format with 'meal_plan' and 'nutritional_info'.
    #         """

    #         #     try:
    #         #         # Construct prompt for Claude
    #         #         prompt = f"""Based on the following information, provide a detailed meal plan and dietary recommendations:

    #         # User Profile:
    #         # - Age: {payload.health_metrics.age}
    #         # - Height: {payload.health_metrics.height}cm
    #         # - Weight: {payload.health_metrics.weight}kg
    #         # - Activity Level: {payload.health_metrics.activity_level}
    #         # - Health Conditions: {', '.join(payload.health_metrics.health_conditions)}

    #         # Dietary Preferences:
    #         # - Restrictions: {', '.join(payload.dietary_preferences.restrictions)}
    #         # - Allergies: {', '.join(payload.dietary_preferences.allergies)}
    #         # - Preferences: {', '.join(payload.dietary_preferences.preferences)}

    #         # Goal: {payload.goal}
    #         # Desired meals per day: {payload.meal_count}

    #         # Please provide:
    #         # 1. A structured meal plan
    #         # 2. Specific dietary recommendations
    #         # 3. Any relevant warnings or considerations

    #         # Format the response as JSON with the following structure:
    #         # {{
    #         #     "meal_plan": {{

    #         #     }},
    #         #     "recommendations": [
    #         #         "recommendation 1",
    #         #         "recommendation 2"
    #         #     ],
    #         #     "warnings": [
    #         #         "warning 1",
    #         #         "warning 2"
    #         #     ]
    #         # }}"""

    #         # get response from claude
    #         response = client.completions.create(
    #             model=""
    #             # model="gpt-3.5-turbo",
    #             # prompt=prompt,
    #             # max_tokens=500,
    #             # temperature=0.7,
    #         )

    #         # response = client.completions.create(
    #         #     # model="gpt-4o",
    #         #     # max_tokens=1024,
    #         #     # temperature=0.7,
    #         #     # system="You are a professional nutrionist and diet expert. Provide evidence-based dietary advice while considering individual needs and restrictions.",
    #         #     # messages=[{"role": "user", "content": prompt}],
    #         # )

    #         # parse response and struture it
    #         generated_text = response.choices[0].text.strip()
    #         # parse openai response to ensure openai returns proper formatted json
    #         diet_suggestions = json.loads(generated_text)

    #         return diet_suggestions

    #     except Exception as e:
    #         print("error", str(e))
    #         raise HTTPException(status_code=500, detail=str(e))
