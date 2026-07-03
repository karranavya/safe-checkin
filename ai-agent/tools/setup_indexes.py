"""
One-time setup script — run this ONCE before starting the server.

What it does:
  1. Creates text indexes on alerts.description + alerts.reason
     so text_search tool works with $text queries
  2. Creates supporting indexes on guests collection for fast filtering
  3. Prints a summary of all indexes created

Run with:
  python tools/setup_indexes.py
"""
import asyncio
import sys
import os

# Allow running from the ai-agent root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import get_settings

settings = get_settings()


async def setup():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]

    print(f"\n[Setup] Connected to: {settings.mongodb_db_name}\n")

    # ── Alerts collection ─────────────────────────────────────────────────────
    alerts = db["alerts"]

    # Text index for keyword search across description + reason
    await alerts.create_index(
        [("description", "text"), ("reason", "text")],
        name="alerts_text_search",
        weights={"description": 2, "reason": 1},
    )
    print("[alerts] ✓ Text index on description + reason")

    # Compound index for common police filters
    await alerts.create_index(
        [("status", 1), ("createdAt", -1)],
        name="alerts_status_date",
    )
    print("[alerts] ✓ Compound index on status + createdAt")

    await alerts.create_index(
        [("hotelId", 1), ("status", 1), ("createdAt", -1)],
        name="alerts_hotel_status_date",
    )
    print("[alerts] ✓ Compound index on hotelId + status + createdAt")

    # ── Guests collection ─────────────────────────────────────────────────────
    guests = db["guests"]

    await guests.create_index(
        [("hotelId", 1), ("status", 1), ("checkInTime", -1)],
        name="guests_hotel_status_date",
    )
    print("[guests] ✓ Compound index on hotelId + status + checkInTime")

    await guests.create_index(
        [("guestName", "text"), ("nationality", "text")],
        name="guests_text_search",
    )
    print("[guests] ✓ Text index on guestName + nationality")

    await guests.create_index([("aadhaar", 1)], name="guests_aadhaar")
    print("[guests] ✓ Index on aadhaar")

    await guests.create_index([("roomNumber", 1), ("hotelId", 1)], name="guests_room_hotel")
    print("[guests] ✓ Compound index on roomNumber + hotelId")

    # ── Activity logs collection ──────────────────────────────────────────────
    logs = db["activitylogs"]

    await logs.create_index(
        [("createdAt", -1)],
        name="logs_date",
    )
    print("[activitylogs] ✓ Index on createdAt")

    await logs.create_index(
        [("description", "text"), ("actionType", "text")],
        name="logs_text_search",
    )
    print("[activitylogs] ✓ Text index on description + actionType")

    print("\n[Setup] All indexes created successfully.\n")
    client.close()


if __name__ == "__main__":
    asyncio.run(setup())