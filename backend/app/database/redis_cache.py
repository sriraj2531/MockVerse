import redis.asyncio as aioredis
from app.config import settings

# Initialize an asynchronous Redis client network pool instance context manager
redis_pool_client = aioredis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True # Automatically converts incoming memory bytecode sequences to Python string primitives
)

async def set_leaderboard_cache_score(room_id: str, student_uid: str, current_score: int):
    """
    Increments or stores student scoring benchmarks inside a high-speed Redis Sorted Set (ZSET).
    """
    try:
        # ZADD maps perfectly to lightning-fast real-time scoreboard lookups
        await redis_pool_client.zadd(f"leaderboard:room:{room_id}", {student_uid: current_score})
    except Exception as e:
        print(f"Redis memory caching transaction failed cleanly: {str(e)}")
        
async def fetch_top_room_rankings(room_id: str, limit: int = 10) -> list:
    """
    Queries memory arrays to pull the top scoring users in descending order.
    """
    try:
        # ZREVRANGE fetches highest ranks down to lowest ranks in logarithmic time complexity
        raw_rankings = await redis_pool_client.zrevrange(
            f"leaderboard:room:{room_id}", 0, limit - 1, withscores=True
        )
        return [{"uid": uid, "score": int(score)} for uid, score in raw_rankings]
    except Exception:
        return []