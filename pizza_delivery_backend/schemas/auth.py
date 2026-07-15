from pydantic import BaseModel
from typing import Optional


class UserResponse(BaseModel):
    username: str
    email: str
    is_active: bool

    class Config:
        from_attributes = True


class SignupRequest(BaseModel):
    username: str
    email: str
    password: str
    is_staff: Optional[bool] = False
    is_active: Optional[bool] = True

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "username": "userName",
                "email": "name@gmail.com",
                "password": "123456",
                "is_staff": False,
                "is_active": True,
            }
        }


class SignupResponse(BaseModel):
    message: str
    user: UserResponse


class LoginModel(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "Bearer"
