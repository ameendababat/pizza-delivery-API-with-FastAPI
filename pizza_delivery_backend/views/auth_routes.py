from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from config.database import get_db
from schemas.auth import SignupRequest, SignupResponse, LoginModel, TokenResponse, RefreshRequest
from controllers.auth_controller import register_user, login_user, refresh_user_token


auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(user: SignupRequest, db: Session = Depends(get_db)):
    return register_user(db, user)


@auth_router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(user: LoginModel, db: Session = Depends(get_db)):
    return login_user(db, user)


@auth_router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: Session = Depends(get_db)):
    return refresh_user_token(db, body.refresh_token)
