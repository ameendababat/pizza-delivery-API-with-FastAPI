from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


class UserResponse(BaseModel):
    username: str
    email: str
    is_active: bool

    class Config:
        from_attributes = True


class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    is_staff: Optional[bool] = False
    is_active: Optional[bool] = True

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

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
    

class RefreshRequest(BaseModel):
    refresh_token: str
