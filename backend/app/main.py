import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.test_engine import router as test_engine_router # Ingest router
from app.api.v1.ai_chat import router as ai_chat_router # Ingest chat router
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.database.session import engine, Base
from app.models.db_models import HistoricalAnalyticsLog, HistoricalExamSummary # Ensure models are imported for metadata creation
from app.api.v1.real_time import router as real_time_router



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically create the database if it does not exist
    db_url = make_url(settings.DATABASE_URL)
    db_name = db_url.database
    
    # We connect to the default 'postgres' database to check/create the target database
    default_db_url = db_url.set(database="postgres")
    
    # isolation_level="AUTOCOMMIT" is required since CREATE DATABASE cannot be executed inside a transaction
    temp_engine = create_async_engine(default_db_url, isolation_level="AUTOCOMMIT")
    try:
        async with temp_engine.connect() as conn:
            result = await conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :dbname"),
                {"dbname": db_name}
            )
            exists = result.scalar()
            if not exists:
                await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    except Exception as e:
        # Log or print warning, then let it proceed or raise if critical
        print(f"Database pre-creation check failed: {e}")
    finally:
        await temp_engine.dispose()

    # Asynchronously create tables on startup if they do not exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE mock_test_analytics_ledger ADD COLUMN IF NOT EXISTS session_id VARCHAR(64)"))
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="High-performance low-latency async API engine powering adaptive testing pipelines.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include both functional endpoint sub-systems
app.include_router(test_engine_router, prefix=settings.API_V1_STR)
app.include_router(ai_chat_router, prefix=settings.API_V1_STR)
app.include_router(real_time_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Home & Health Handshake"])
async def home_server_handshake():
    return {
        "status": "operational",
        "message": f"Welcome to the {settings.PROJECT_NAME} service layer."
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)