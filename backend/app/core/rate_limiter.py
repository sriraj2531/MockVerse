from fastapi import Request, HTTPException, status
from app.database.redis_cache import redis_pool_client

async def rate_limit_dependency(request: Request):
    """
    FastAPI dependency to enforce rate-limiting using Redis.
    Limits each client IP to 60 requests per minute.
    """
    client_ip = request.client.host if request.client else "unknown_ip"
    key = f"rate_limit:{client_ip}"
    try:
        current_count = await redis_pool_client.get(key)
        if current_count and int(current_count) >= 60:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Rate limit exceeded (max 60 requests per minute)."
            )
        
        async with redis_pool_client.pipeline(transaction=True) as pipe:
            await pipe.incr(key)
            if not current_count:
                await pipe.expire(key, 60)
            await pipe.execute()
    except HTTPException:
        raise
    except Exception as e:
        # Fail-open in case Redis is down
        print(f"Rate Limiter Redis connection failure: {e}")
