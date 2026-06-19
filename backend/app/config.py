from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized app config, populated from environment variables / .env file."""

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""          # anon or service-role key (env var: SUPABASE_KEY)

    FRONTEND_ORIGIN: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
