import time
from typing import Any

class QueryCache:
    """
    Simple in-memory cache with TTL (time-to-live).
    Stats and guest lists are cached for 60 seconds.
    Exact duplicate questions are cached for 30 seconds.
    """
    def __init__(self):
        self._store: dict[str, tuple[Any, float]] = {}

    def get(self, key: str) -> Any | None:
        if key in self._store:
            value, expires_at = self._store[key]
            if time.time() < expires_at:
                return value
            del self._store[key]
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 60):
        self._store[key] = (value, time.time() + ttl_seconds)

    def make_key(self, hotel_id: str | None, role: str, message: str) -> str:
        # Normalise the message — lowercase, strip spaces
        clean = message.lower().strip()
        return f"{role}:{hotel_id}:{clean}"

    def clear_expired(self):
        now = time.time()
        expired = [k for k, (_, exp) in self._store.items() if now > exp]
        for k in expired:
            del self._store[k]

# Single shared instance
cache = QueryCache()