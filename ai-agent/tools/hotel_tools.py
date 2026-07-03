"""
search_hotels — now jurisdiction-scoped for police callers.
Hotel-side calls (police_id=None) are unaffected.
"""
from db.mongo import hotels
from tools.helpers import to_ist
from tools.jurisdiction_utils import get_jurisdiction_hotel_ids


async def search_hotels(
    params: dict,
    police_id: str | None = None,
    police_role: str | None = None,
) -> list[dict] | str:
    query: dict = {}

    if params.get("name"):
        query["name"] = {"$regex": params["name"], "$options": "i"}

    if params.get("include_inactive") is not True:
        query["isActive"] = True

    # ⭐ Jurisdiction scoping — applies to every police caller, admin or sub
    if police_id:
        hotel_ids = await get_jurisdiction_hotel_ids(police_id, police_role)
        if hotel_ids is None:
            return "Your jurisdiction has not been configured yet — no hotels to show."
        query["_id"] = {"$in": hotel_ids}

    cursor = hotels().find(query).sort("registrationDate", -1).limit(50)
    results = []

    async for doc in cursor:
        address = doc.get("address", {})
        results.append({
            "name":            doc.get("name", "Unknown"),
            "type":            doc.get("accommodationType", "N/A"),
            "owner":           doc.get("ownerName", "N/A"),
            "phone":           doc.get("ownerPhone", "N/A"),
            "city":            address.get("city", "N/A"),
            "state":           address.get("state", "N/A"),
            "rooms":           doc.get("numberOfRooms", 0),
            "verification":    doc.get("verificationStatus", "pending"),
            "active":          doc.get("isActive", False),
            "registered_on":   to_ist(doc.get("registrationDate")),
        })

    return results if results else "No hotels found in your jurisdiction matching those criteria."