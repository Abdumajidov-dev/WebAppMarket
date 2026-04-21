from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    BOT_TOKEN: str
    API_BASE_URL: str = "http://localhost:5000/api"
    BOT_SECRET: str
    REDIS_URL: str = "redis://localhost:6379"
    WEBHOOK_HOST: str = ""
    WEBHOOK_PATH: str = "/webhook/telegram"
    WEBAPP_HOST: str = "0.0.0.0"
    WEBAPP_PORT: int = 8080
    WEBAPP_URL: str = "http://localhost:3001"


settings = Settings()
