import pytest
import asyncio
from sqlalchemy import text
from app.database.session import engine

@pytest.fixture(scope="session")
def asyncio_default_fixture_loop_scope():
    return "session"

@pytest.fixture(scope="session", autouse=True)
async def run_db_migrations():
    # Ensure database columns are fully migrated on test session startup
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE mock_test_analytics_ledger ADD COLUMN IF NOT EXISTS session_id VARCHAR(64)"))
            print("Successfully executed Postgres database migrations.")
    except Exception as e:
        print(f"Postgres startup migration skipped/failed: {e}")

@pytest.fixture(scope="session", autouse=True)
async def cleanup_database_connections(run_db_migrations):
    yield
    # Safely close all connection pools to prevent loop closure exceptions
    try:
        await engine.dispose()
    except Exception as e:
        print(f"Error disposing engine: {e}")
