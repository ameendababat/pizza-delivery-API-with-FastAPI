from fastapi import status
from fastapi.exceptions import HTTPException
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash, check_password_hash
from models.user import User
from schemas.auth import SignupRequest, LoginModel
from services.auth_service import create_access_token, create_refresh_token, decode_token


def register_user(db: Session, user_data: SignupRequest):
    db_email = db.query(User).filter(User.email == user_data.email).first()
    if db_email is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )

    db_username = db.query(User).filter(User.username == user_data.username).first()
    if db_username is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password=generate_password_hash(user_data.password),
        is_active=user_data.is_active if user_data.is_active is not None else True,
        is_staff=user_data.is_staff if user_data.is_staff is not None else False,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully", "user": new_user}


def login_user(db: Session, login_data: LoginModel):
    db_user = db.query(User).filter(User.username == login_data.username).first()
    if db_user and check_password_hash(db_user.password, login_data.password):
        extra = {"is_staff": db_user.is_staff}
        access_token = create_access_token(subject=db_user.username, extra_claims=extra)
        refresh_token = create_refresh_token(subject=db_user.username)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password",
    )


def refresh_user_token(refresh_token: str):
    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    username = payload.get("sub")
    new_access_token = create_access_token(subject=username)
    return {"access_token": new_access_token, "token_type": "bearer"}
