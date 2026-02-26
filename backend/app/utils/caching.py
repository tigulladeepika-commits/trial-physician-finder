import functools
import asyncio

def cache_response(expire=300):
    """
    Simple async decorator cache (can extend to Redis)
    """
    def decorator(func):
        cache = {}

        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            key = str(args) + str(kwargs)
            if key in cache:
                return cache[key]
            result = await func(*args, **kwargs)
            cache[key] = result
            # Expire cache
            asyncio.create_task(expire_cache(cache, key, expire))
            return result

        return wrapper

    async def expire_cache(cache, key, ttl):
        await asyncio.sleep(ttl)
        if key in cache:
            del cache[key]

    return decorator