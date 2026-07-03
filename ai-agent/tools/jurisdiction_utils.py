"""
Shared jurisdiction-scoping utility.

Resolves which hotel _ids fall within the requesting officer's jurisdiction
(their own if admin_police, or their managing admin's if sub_police).
Mirrors the Node.js jurisdictionController's $centerSphere geo-filtering
exactly, so AI agent answers always match what the officer sees on the
jurisdiction map — no separate "AI agent has wider visibility" loophole.
"""
from bson import ObjectId
from db.mongo import police, hotels

EARTH_RADIUS_KM = 6371


async def get_jurisdiction_hotel_ids(
    police_id: str | None,
    police_role: str | None,
) -> list[ObjectId] | None:
    """
    Returns the list of hotel _ids within the officer's jurisdiction.

    Returns None if jurisdiction can't be resolved — e.g. officer identity
    missing, or the admin hasn't set up a jurisdiction yet. Callers should
    treat None as "scoping unavailable" and respond accordingly (usually
    by telling the user their jurisdiction isn't configured), NOT by
    silently falling back to system-wide visibility.
    """
    if not police_id:
        return None

    try:
        if police_role == "admin_police":
            admin_doc = await police().find_one({"_id": ObjectId(police_id)})
        else:
            officer_doc = await police().find_one({"_id": ObjectId(police_id)})
            if not officer_doc or not officer_doc.get("managedBy"):
                return None
            admin_doc = await police().find_one({"_id": officer_doc["managedBy"]})
    except Exception:
        return None

    if not admin_doc:
        return None

    jurisdiction = admin_doc.get("jurisdiction") or {}
    center = (jurisdiction.get("center") or {}).get("coordinates")
    radius_km = jurisdiction.get("radiusKm")

    if not center or (center[0] == 0 and center[1] == 0) or not radius_km:
        return None  # jurisdiction not configured yet

    cursor = hotels().find(
        {
            "location": {
                "$geoWithin": {
                    "$centerSphere": [center, radius_km / EARTH_RADIUS_KM]
                }
            },
            "isActive": True,
        },
        {"_id": 1},
    )

    return [doc["_id"] async for doc in cursor]