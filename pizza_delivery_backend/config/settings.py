from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = 'a0fbb969e05a57f9a8ddbdc21b3602b9e8b34516b90c062de40504413c6c40c'
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
