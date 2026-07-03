from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config.settings import get_settings

settings = get_settings()

# Single client instance shared across the app
_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db():
    """Call this on FastAPI startup."""
    global _client, _db
    _client = AsyncIOMotorClient(settings.mongodb_uri)
    _db = _client[settings.mongodb_db_name]

    # Verify connection
    await _client.admin.command("ping")
    print(f"[MongoDB] Connected to '{settings.mongodb_db_name}'")


async def close_db():
    """Call this on FastAPI shutdown."""
    global _client
    if _client:
        _client.close()
        print("[MongoDB] Connection closed")


def get_db() -> AsyncIOMotorDatabase:
    """Return the database instance. Must call connect_db() first."""
    if _db is None:
        raise RuntimeError("Database not initialised. Call connect_db() on startup.")
    return _db


# ── Convenience collection accessors ─────────────────────────────────────────
# Collection names match exactly what Mongoose creates in Node.js.
# Mongoose lowercases + pluralises model names by default, e.g.
#   Guest model  → "guests"
#   Alert model  → "alerts"
#   Hotel model  → "hotels"
#   Police model → "polices"   (Mongoose default for "Police")
#   ActivityLog  → "activitylogs"

def guests():
    return get_db()["guests"]

def alerts():
    return get_db()["alerts"]

def hotels():
    return get_db()["hotels"]

def police():
    # Mongoose default: model name "Police" → collection "polices"
    return get_db()["polices"]

def activity_logs():
    return get_db()["activitylogs"]