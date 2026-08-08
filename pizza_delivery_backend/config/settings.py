from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DB_ECHO: bool = True
    ALLOWED_ORIGINS: str = "*"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "root"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "pizza-delivery-db"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
