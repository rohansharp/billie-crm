"""Configuration settings for the event processor."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Redis configuration
    redis_url: str = "redis://localhost:6379"
    inbox_stream: str = "inbox:billie-servicing"
    consumer_group: str = "billie-servicing-processor"
    dlq_stream: str = "dlq:billie-servicing"

    # MongoDB configuration
    mongodb_url: str = "mongodb://localhost:27017"
    db_name: str = "billie-servicing"

    # Processing configuration
    max_retries: int = 3
    dedup_ttl_seconds: int = 86400  # 24 hours
    batch_size: int = 10
    block_timeout_ms: int = 1000

    # Logging
    log_level: str = "INFO"

    class Config:
        env_prefix = ""
        case_sensitive = False


settings = Settings()

