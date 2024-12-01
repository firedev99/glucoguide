from fastapi import HTTPException
from fastapi.responses import JSONResponse

scopes = {
  "user": [
    "patient:read_profile", 
    "patient:update_profile",
    "patient:update_password"
  ],
  "doctor": [
    "patient:read_profile", 
    "patient:update_profile",
    "doctor:read_profile", 
    "doctor:update_profile"
  ],
  "staff": [
    "staff:read", 
    "staff:write"
  ],
  "admin": [
    "patient:read", 
    "patient:write", 
    "doctor:read", 
    "doctor:write", 
    "staff:read", 
    "staff:write", 
    "admin:read", 
    "admin:write"
  ]
}

class Custom:
  @staticmethod
  def snake_to_title(snake_str: str):
    return ' '.join(word.capitalize() for word in snake_str.split('_'))
  

class ResponseHandler:
  @staticmethod
  def invalid_token():
    raise HTTPException(
      status_code=401, 
      detail=f'invalid token!', 
      headers={"WWW-Authenticate": "Bearer"}
    )
  
  @staticmethod
  def not_found_error(warning=""):
    raise HTTPException(
      status_code=404,
      detail=f'{warning}'
    )
  
  @staticmethod
  def unauthorized(message: str):
    raise HTTPException(
      status_code=401,
      detail=f"{message}"
    )
  
  @staticmethod
  def no_permission(message: str):
    raise HTTPException(
      status_code=403,
      detail=f"{message}"
    )
  

  @staticmethod
  def fetch_successful(msg, data):
    return JSONResponse(
      status_code=200,
      content={
        "status": "successful",
        "message": msg,
        "data": data
      }
    )
  

