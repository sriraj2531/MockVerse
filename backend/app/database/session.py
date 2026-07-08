from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

# Create the asynchronous database engine matching the asyncpg driver protocol
# echo=False prevents logging massive text pools to stdout in production execution loops
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True # Automatically test stale connections before reusing them
)

# Instantiate a specialized async session maker factory wrapper
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False # Prevents SQLAlchemy from doing lazy network fetches after data commits
)

# Base class for declarative relational mapping models mapping configurations
Base = declarative_base()

async def get_async_db_session():
    """
    Dependency Injection Hook to yield an independent database transactional context.
    Ensures sessions close automatically when requests finish.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit() # Optimistically commit open transactions
        except Exception:
            await session.rollback() # Rollback dirty state frames if errors occur
            raise