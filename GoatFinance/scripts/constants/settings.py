#!/usr/bin/env python
"""Settings module for database configuration"""

from scripts.constants.app_configuration import (
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_DATABASE
)

class Settings:
    """Application settings class"""
    
    @property
    def DATABASE_URL(self) -> str:
        """Get the database URL for PostgreSQL"""
        return f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DATABASE}"

# Create a settings instance
settings = Settings()


