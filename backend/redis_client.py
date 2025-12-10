"""
Redis Client Configuration
Caching and real-time data management for AlumUnity
"""
import redis.asyncio as aioredis
import json
import os
from typing import Optional, Any
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)

# Global Redis client instance
redis_client: Optional[aioredis.Redis] = None


class RedisConfig:
    """Redis configuration constants"""
    
    # Connection Settings
    HOST = os.getenv('REDIS_HOST', 'localhost')
    PORT = int(os.getenv('REDIS_PORT', 6379))
    DB = int(os.getenv('REDIS_DB', 0))
    PASSWORD = os.getenv('REDIS_PASSWORD', None)
    
    # TTL Settings (in seconds)
    TTL_SESSION = 86400  # 24 hours
    TTL_API_CACHE_SHORT = 300  # 5 minutes
    TTL_API_CACHE_MEDIUM = 600  # 10 minutes
    TTL_API_CACHE_LONG = 1800  # 30 minutes
    TTL_AI_PREDICTIONS = 86400  # 24 hours
    TTL_SKILL_EMBEDDINGS = 604800  # 7 days
    
    # Key Prefixes
    PREFIX_SESSION = 'session'
    PREFIX_API_CACHE = 'api:cache'
    PREFIX_AI_EMBEDDINGS = 'ai:embeddings'
    PREFIX_AI_PREDICTIONS = 'ai:predictions'
    PREFIX_RATE_LIMIT = 'rate_limit'
    PREFIX_QUEUE = 'queue'
    PREFIX_NOTIFICATION = 'notification'
    PREFIX_LEADERBOARD = 'leaderboard'


async def get_redis_client() -> aioredis.Redis:
    """Get or create Redis client"""
    global redis_client
    if redis_client is None:
        try:
            # Check if REDIS_URL is provided (for cloud services like Upstash)
            redis_url = os.getenv('REDIS_URL')
            
            if redis_url:
                # Use the full Redis URL (supports rediss:// for TLS)
                redis_client = await aioredis.from_url(
                    redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    max_connections=10,
                    ssl_cert_reqs=None  # Required for some cloud Redis providers
                )
                logger.info(f"✅ Connecting to Redis using URL: {redis_url.split('@')[1] if '@' in redis_url else redis_url}")
            else:
                # Fallback to individual connection parameters
                redis_client = await aioredis.from_url(
                    f"redis://{RedisConfig.HOST}:{RedisConfig.PORT}/{RedisConfig.DB}",
                    password=RedisConfig.PASSWORD,
                    encoding="utf-8",
                    decode_responses=True,
                    max_connections=10
                )
                logger.info(f"✅ Connecting to Redis at {RedisConfig.HOST}:{RedisConfig.PORT}")
            
            # Test connection
            await redis_client.ping()
            logger.info("✅ Redis connection established successfully")
        except Exception as e:
            logger.error(f"❌ Redis connection failed: {str(e)}")
            raise
    return redis_client


async def close_redis_client():
    """Close Redis connection"""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None
        logger.info("Redis connection closed")


class RedisCache:
    """Redis caching utilities"""
    
    @staticmethod
    def _make_key(prefix: str, identifier: str) -> str:
        """Create a namespaced Redis key"""
        return f"{prefix}:{identifier}"
    
    @staticmethod
    async def set(
        key: str, 
        value: Any, 
        ttl: Optional[int] = None,
        prefix: str = ""
    ) -> bool:
        """Set a value in Redis with optional TTL"""
        try:
            client = await get_redis_client()
            full_key = RedisCache._make_key(prefix, key) if prefix else key
            
            # Serialize value to JSON if not string
            if not isinstance(value, str):
                value = json.dumps(value)
            
            if ttl:
                await client.setex(full_key, ttl, value)
            else:
                await client.set(full_key, value)
            
            return True
        except Exception as e:
            logger.error(f"Redis SET error: {str(e)}")
            return False
    
    @staticmethod
    async def get(key: str, prefix: str = "") -> Optional[Any]:
        """Get a value from Redis"""
        try:
            client = await get_redis_client()
            full_key = RedisCache._make_key(prefix, key) if prefix else key
            
            value = await client.get(full_key)
            
            if value is None:
                return None
            
            # Try to deserialize JSON
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        except Exception as e:
            logger.error(f"Redis GET error: {str(e)}")
            return None
    
    @staticmethod
    async def delete(key: str, prefix: str = "") -> bool:
        """Delete a key from Redis"""
        try:
            client = await get_redis_client()
            full_key = RedisCache._make_key(prefix, key) if prefix else key
            await client.delete(full_key)
            return True
        except Exception as e:
            logger.error(f"Redis DELETE error: {str(e)}")
            return False
    
    @staticmethod
    async def exists(key: str, prefix: str = "") -> bool:
        """Check if key exists in Redis"""
        try:
            client = await get_redis_client()
            full_key = RedisCache._make_key(prefix, key) if prefix else key
            return await client.exists(full_key) > 0
        except Exception as e:
            logger.error(f"Redis EXISTS error: {str(e)}")
            return False
    
    @staticmethod
    async def increment(key: str, prefix: str = "", amount: int = 1) -> Optional[int]:
        """Increment a counter in Redis"""
        try:
            client = await get_redis_client()
            full_key = RedisCache._make_key(prefix, key) if prefix else key
            return await client.incrby(full_key, amount)
        except Exception as e:
            logger.error(f"Redis INCREMENT error: {str(e)}")
            return None
    
    @staticmethod
    async def set_with_expiry(
        key: str, 
        value: Any, 
        seconds: int,
        prefix: str = ""
    ) -> bool:
        """Set value with expiry time"""
        return await RedisCache.set(key, value, ttl=seconds, prefix=prefix)


class RedisLeaderboard:
    """Redis sorted set utilities for leaderboards"""
    
    @staticmethod
    async def add_score(
        leaderboard_name: str, 
        member: str, 
        score: float
    ) -> bool:
        """Add or update a member's score in leaderboard"""
        try:
            client = await get_redis_client()
            key = RedisCache._make_key(RedisConfig.PREFIX_LEADERBOARD, leaderboard_name)
            await client.zadd(key, {member: score})
            return True
        except Exception as e:
            logger.error(f"Leaderboard ADD error: {str(e)}")
            return False
    
    @staticmethod
    async def get_top(leaderboard_name: str, limit: int = 10) -> list:
        """Get top N members from leaderboard"""
        try:
            client = await get_redis_client()
            key = RedisCache._make_key(RedisConfig.PREFIX_LEADERBOARD, leaderboard_name)
            # Get top scores in descending order
            results = await client.zrevrange(key, 0, limit - 1, withscores=True)
            return [
                {"member": member, "score": score}
                for member, score in results
            ]
        except Exception as e:
            logger.error(f"Leaderboard GET_TOP error: {str(e)}")
            return []
    
    @staticmethod
    async def get_rank(leaderboard_name: str, member: str) -> Optional[int]:
        """Get member's rank in leaderboard (1-based)"""
        try:
            client = await get_redis_client()
            key = RedisCache._make_key(RedisConfig.PREFIX_LEADERBOARD, leaderboard_name)
            rank = await client.zrevrank(key, member)
            return rank + 1 if rank is not None else None
        except Exception as e:
            logger.error(f"Leaderboard GET_RANK error: {str(e)}")
            return None


class RedisQueue:
    """Redis list utilities for queues"""
    
    @staticmethod
    async def push(queue_name: str, item: Any) -> bool:
        """Push item to queue (FIFO)"""
        try:
            client = await get_redis_client()
            key = RedisCache._make_key(RedisConfig.PREFIX_QUEUE, queue_name)
            
            if not isinstance(item, str):
                item = json.dumps(item)
            
            await client.rpush(key, item)
            return True
        except Exception as e:
            logger.error(f"Queue PUSH error: {str(e)}")
            return False
    
    @staticmethod
    async def pop(queue_name: str) -> Optional[Any]:
        """Pop item from queue (FIFO)"""
        try:
            client = await get_redis_client()
            key = RedisCache._make_key(RedisConfig.PREFIX_QUEUE, queue_name)
            
            value = await client.lpop(key)
            
            if value is None:
                return None
            
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        except Exception as e:
            logger.error(f"Queue POP error: {str(e)}")
            return None
    
    @staticmethod
    async def length(queue_name: str) -> int:
        """Get queue length"""
        try:
            client = await get_redis_client()
            key = RedisCache._make_key(RedisConfig.PREFIX_QUEUE, queue_name)
            return await client.llen(key)
        except Exception as e:
            logger.error(f"Queue LENGTH error: {str(e)}")
            return 0


# API Response Caching Decorator
def cache_response(ttl: int = RedisConfig.TTL_API_CACHE_MEDIUM, prefix: str = "api:cache"):
    """Decorator to cache API responses"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached = await RedisCache.get(cache_key, prefix=prefix)
            if cached is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return cached
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await RedisCache.set(cache_key, result, ttl=ttl, prefix=prefix)
            logger.debug(f"Cache MISS: {cache_key}")
            
            return result
        return wrapper
    return decorator
