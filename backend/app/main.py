from fastapi import (
    FastAPI,
    HTTPException,
    Request,
)
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.security import origins
from app.core.config import settings

from app.routers import (
    auth,
    chats,
    meals,
    healths,
    patients,
    public,
    websockets,
    medications,
    appointments,
)


from app.routers.admin import (
    patients as patients_admin,
    hospitals as hospitals_admin,
    doctors as doctors_admin,
    users,
)

# from app.routers import doctor
import app.routers.doctor as doctor


from app.workers.celery import celery
from app.workers.tasks import send_email_task


version = "v1"


# Initialize FastAPI Server
app = FastAPI(
    root_path=f"/api/{version}",
    docs_url=f"/docs",
    openapi_url=f"/openapi.json",
    title="Gluco Guide Backend",
    version=version,
    contact={"name": "firedev99", "email": "firethedev@gmail.com"},
)


# Backend Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom exception handler
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(_: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "unsuccessful", "message": exc.detail},
    )


# Root Endpoint
@app.get("/")
async def root():
    return {
        "name": "firedev99",
        "email": "firethedev@gmail.com",
        "about": "Gluco Guide is an integrated health monitoring app for diabetic care, featuring separate dashboards for patients, doctors, and admins. It enables doctor bookings, maps to nearby hospitals, real-time health tracking, and AI-powered recommendations for diet, exercise, and lifestyle, ensuring effective diabetes management and wellness.",
    }


# Celery tasks testing apis
@app.get("/send-email")
async def run_task():
    task = send_email_task.apply_async(
        args=(
            "sauravagun1999@gmail.com",
            "GlucoGuide Email Tasks",
            "Testing SMTP Connection!",
        ),
        countdown=60,
    )
    return {
        "status": "successful",
        "message": f"successfully, sent mail from {settings.owner_email}",
        "tast_id": task.id,
    }


# Query a celery task w task id
@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    task = celery.AsyncResult(task_id)
    return {"task_id": task_id, "status": task.status, "result": task.result}


# General routes (authentication not required)
app.include_router(auth.router, prefix=f"/auth", tags=["Users / Authentication"])
app.include_router(public.router1, prefix=f"/doctors", tags=["General / Doctors"])
app.include_router(public.router2, prefix=f"/hospitals", tags=["General / Hospitals"])


# Patient profile routes (authetication required)
app.include_router(patients.router, prefix=f"/patient", tags=["Patient / Profile"])

# Patient health records routes (authetication required)
app.include_router(
    healths.router,
    prefix=f"/patient/health",
    tags=["Patient / Health Monitoring Records"],
)

# Patient appointments routes (authetication required)
app.include_router(
    appointments.router,
    prefix=f"/patient/appointments",
    tags=["Patient / Appointments"],
)


# Patient appointments routes (authetication required)
app.include_router(
    medications.router,
    prefix=f"/patient/medication",
    tags=["Patient / Medications"],
)

# Meal details (authentication required)
app.include_router(
    meals.router,
    prefix=f"/diet",
    tags=["Diet / Meals"],
)


# The following routes are used by Doctors
app.include_router(doctor.router, prefix="/users/doctor", tags=["User / Doctors"])

# The following routes are used by every users for chats (authentication required)
app.include_router(chats.router, prefix="/chats", tags=["User / Chats"])

# Websocket routes for realtime simulation (authentication required)
app.include_router(websockets.router, prefix="/ws")


# # admin routes (administrational authetication required)
# app.include_router(
#     users.router,
#     prefix=f"/admin/users",
#     tags=["Admin / Users"],
#     dependencies=[Depends(include_admin)],
# )

# app.include_router(
#     patients_admin.router,
#     prefix=f"/admin/users/patients",
#     tags=["Admin / Patients"],
#     dependencies=[Depends(include_admin)],
# )

# app.include_router(
#     doctors_admin.router,
#     prefix=f"/admin/users/doctors",
#     tags=["Admin / Doctors"],
#     dependencies=[Depends(include_admin)],
# )

# app.include_router(
#     hospitals_admin.router,
#     prefix=f"/admin/hospitals",
#     tags=["Admin / Hospitals"],
#     dependencies=[Depends(include_admin)],
# )
