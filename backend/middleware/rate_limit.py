"""Rate limiting middleware"""
from fastapi import Request, HTTPException, status
from typing import Dict, Tuple
from datetime import datetime, timedelta
import asyncio
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """Simple in-memory rate limiter
    In production, use Redis for distributed rate limiting
    """
    
    def __init__(self):
        # Store: {identifier: [(timestamp, count)]}
        self.requests: Dict[str, list] = defaultdict(list)
        self.lock = asyncio.Lock()
    
    async def check_rate_limit(
        self,
        identifier: str,
        max_requests: int,
        window_seconds: int
    ) -> Tuple[bool, int, int]:
        """Check if request is within rate limit
        Returns: (is_allowed, remaining_requests, retry_after_seconds)
        """
        async with self.lock:
            now = datetime.utcnow()
            window_start = now - timedelta(seconds=window_seconds)
            
            # Clean old requests
            self.requests[identifier] = [
                req_time for req_time in self.requests[identifier]
                if req_time > window_start
            ]
            
            current_count = len(self.requests[identifier])
            
            if current_count >= max_requests:
                # Calculate retry after
                oldest_request = min(self.requests[identifier])
                retry_after = int((oldest_request + timedelta(seconds=window_seconds) - now).total_seconds())
                return False, 0, max(retry_after, 1)
            
            # Add current request
            self.requests[identifier].append(now)
            remaining = max_requests - current_count - 1
            
            return True, remaining, 0
    
    async def cleanup_old_entries(self, max_age_hours: int = 24):
        """Periodic cleanup of old entries"""
        async with self.lock:
            cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
            identifiers_to_remove = []
            
            for identifier, requests in self.requests.items():
                if not requests or max(requests) < cutoff:
                    identifiers_to_remove.append(identifier)
            
            for identifier in identifiers_to_remove:
                del self.requests[identifier]
            
            logger.info(f"Cleaned up {len(identifiers_to_remove)} old rate limit entries")


# Global rate limiter instance
rate_limiter = RateLimiter()


def get_client_identifier(request: Request) -> str:
    """Get client identifier for rate limiting"""
    # Use IP address as identifier
    # In production, consider using user ID for authenticated requests
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0]
    return request.client.host if request.client else "unknown"


async def rate_limit_dependency(
    request: Request,
    max_requests: int = 100,
    window_seconds: int = 60
):
    """FastAPI dependency for rate limiting"""
    identifier = get_client_identifier(request)
    
    is_allowed, remaining, retry_after = await rate_limiter.check_rate_limit(
        identifier, max_requests, window_seconds
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Retry after {retry_after} seconds.",
            headers={
                "X-RateLimit-Limit": str(max_requests),
                "X-RateLimit-Remaining": str(remaining),
                "X-RateLimit-Reset": str(retry_after),
                "Retry-After": str(retry_after)
            }
        )


# Rate limit presets for different endpoint types
async def strict_rate_limit(request: Request):
    """Strict rate limit for sensitive endpoints (auth)"""
    return await rate_limit_dependency(request, max_requests=5, window_seconds=60)


async def moderate_rate_limit(request: Request):
    """Moderate rate limit for regular endpoints"""
    return await rate_limit_dependency(request, max_requests=30, window_seconds=60)


async def relaxed_rate_limit(request: Request):
    """Relaxed rate limit for read-only endpoints"""
    return await rate_limit_dependency(request, max_requests=100, window_seconds=60)
