from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from config.database import get_db
from dependencies import get_current_user
from models.user import User
from schemas.auth import SignupRequest, SignupResponse, LoginModel, TokenResponse
from controllers.auth_controller import register_user, login_user, refresh_user_token

auth_router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer()


@auth_router.get("/")
async def hello(current_user: User = Depends(get_current_user)):
    return {"message": "hello world - pizza delivery"}


@auth_router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(user: SignupRequest, db: Session = Depends(get_db)):
    return register_user(db, user)


@auth_router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(user: LoginModel, db: Session = Depends(get_db)):
    return login_user(db, user)


@auth_router.get("/refresh", response_model=TokenResponse)
async def refresh_token(
    credentials=Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    return refresh_user_token(credentials.credentials)
