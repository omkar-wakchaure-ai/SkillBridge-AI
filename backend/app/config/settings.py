from pydantic_settings import BaseSettings, SettingsConfigDict

PRODUCTION_FRONTEND_ORIGIN = "https://skill-bridge-ai-zx9m.vercel.app"


class Settings(BaseSettings):
    # Application
    app_name: str = "PathPilot AI"
    app_version: str = "1.0.0"
    debug: bool = True

    # Database
    database_url: str = "sqlite:///./pathpilot.db"

    # JWT
    secret_key: str = "change-this-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # LLM
    llm_provider: str = "mock"
    llm_api_key: str = ""

    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.1-flash-lite"

    # CORS
    cors_origins: str = (
        "http://localhost:3000,http://localhost:5173,"
        "http://127.0.0.1:3000,http://127.0.0.1:5173,"
        f"{PRODUCTION_FRONTEND_ORIGIN}"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        origins = [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]
        if PRODUCTION_FRONTEND_ORIGIN not in origins:
            origins.append(PRODUCTION_FRONTEND_ORIGIN)
        return origins


settings = Settings()
