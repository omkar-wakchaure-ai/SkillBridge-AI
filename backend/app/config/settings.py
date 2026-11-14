from pydantic_settings import BaseSettings, SettingsConfigDict

PRODUCTION_FRONTEND_ORIGIN = "https://skill-bridge-ai-zx9m.vercel.app"
PRODUCTION_FRONTEND_ORIGINS = (
    PRODUCTION_FRONTEND_ORIGIN,
    "https://skill-bridge-ai-sandy.vercel.app",
)


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
        f"{','.join(PRODUCTION_FRONTEND_ORIGINS)}"
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
        for production_origin in PRODUCTION_FRONTEND_ORIGINS:
            if production_origin not in origins:
                origins.append(production_origin)
        return origins


settings = Settings()
