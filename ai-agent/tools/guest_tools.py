"""
search_guests — jurisdiction-scoped for police callers, with the same
explicit-hotel-name loophole fix as search_alerts. Hotel-side calls
(hotel_id provided, is_police=False) are unaffected.
"""
import re
from db.mongo import guests, hotels
from tools.helpers import mask_aadhaar, to_ist, str_to_object_id
from tools.jurisdiction_utils import get_jurisdiction_hotel_ids
from config.settings import get_settings

settings = get_settings()


def _build_photo_urls(doc: dict) -> dict | None:
    photos = doc.get("photos", {})
    if not photos:
        return None

    urls = {}
    labels = {
        "guestPhoto": "Guest Photo",
        "idFront":    "ID Front",
        "idBack":     "ID Back",
    }

    for field, label in labels.items():
        info = photos.get(field, {})
        if not info:
            continue
        raw_path = info.get("path") or info.get("filename") or ""
        if not raw_path:
            continue
        raw_path = raw_path.replace("\\", "/")
        if not raw_path.startswith("uploads"):
            raw_path = f"uploads/{raw_path}"
        urls[label] = f"{settings.backend_url}/{raw_path}"

    return urls if urls else None


async def search_guests(
    params: dict,
    hotel_id: str | None = None,
    is_police: bool = False,
    police_id: str | None = None,
    police_role: str | None = None,
) -> list[dict] | str:

    query: dict = {}

    if hotel_id:
        oid = str_to_object_id(hotel_id)
        query["hotelId"] = oid if oid else hotel_id

    if is_police:
        if params.get("hotel_name"):
            hotel_doc = await hotels().find_one(
                {"name": {"$regex": params["hotel_name"], "$options": "i"}}
            )
            if not hotel_doc:
                return f"No hotel found matching '{params['hotel_name']}'."

            # ⭐ Jurisdiction check even for an explicit named lookup
            if police_id:
                jurisdiction_ids = await get_jurisdiction_hotel_ids(police_id, police_role)
                if jurisdiction_ids is None:
                    return "Your jurisdiction has not been configured yet — no guests to show."
                if hotel_doc["_id"] not in jurisdiction_ids:
                    return f"'{params['hotel_name']}' is outside your jurisdiction."

            query["hotelId"] = hotel_doc["_id"]

        elif police_id:
            # ⭐ No specific hotel named — default-scope to jurisdiction
            jurisdiction_ids = await get_jurisdiction_hotel_ids(police_id, police_role)
            if jurisdiction_ids is None:
                return "Your jurisdiction has not been configured yet — no guests to show."
            query["hotelId"] = {"$in": jurisdiction_ids}

    if params.get("name"):
        query["name"] = {"$regex": params["name"], "$options": "i"}

    if params.get("nationality"):
        query["nationality"] = {"$regex": params["nationality"], "$options": "i"}

    if params.get("room"):
        query["roomNumber"] = str(params["room"])

    if params.get("aadhaar_last4"):
        last4 = re.escape(params["aadhaar_last4"])
        query["guests.idNumber"] = {"$regex": f"{last4}$"}

    status = params.get("status", "all")
    if status and status != "all":
        query["status"] = "checked-in" if status == "active" else status

    if params.get("checkin_today"):
        from datetime import datetime, timezone
        today = datetime.now(tz=timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        query["checkInTime"] = {"$gte": today}

    limit = min(int(params.get("limit", 10)), 20)
    cursor = guests().find(query).sort("checkInTime", -1).limit(limit)
    results = []

    async for doc in cursor:
        aadhaar_display = "N/A"
        for g in doc.get("guests", []):
            if g.get("isPrimary") or True:
                if g.get("idNumber"):
                    aadhaar_display = mask_aadhaar(g["idNumber"])
                break

        row = {
            "name":         doc.get("name", "Unknown"),
            "room":         doc.get("roomNumber", "N/A"),
            "status":       doc.get("status", "N/A"),
            "checked_in":   to_ist(doc.get("checkInTime")),
            "checked_out":  to_ist(doc.get("checkOutDate"))
                            if doc.get("checkOutDate") else "Still checked in",
            "nationality":  doc.get("nationality", "N/A"),
            "phone":        doc.get("phone", "N/A"),
            "purpose":      doc.get("purpose", "N/A"),
            "total_guests": doc.get("guestCount", 1),
            "booking_mode": doc.get("bookingMode", "N/A"),
            "aadhaar":      aadhaar_display,
        }

        photo_urls = _build_photo_urls(doc)
        if photo_urls:
            row["photo_urls"] = photo_urls

        if is_police and doc.get("hotelId"):
            hotel_doc = await hotels().find_one(
                {"_id": doc["hotelId"]}, {"name": 1}
            )
            row["hotel"] = hotel_doc.get("name", "Unknown Hotel") if hotel_doc else "Unknown Hotel"

        results.append(row)

    return results if results else "No guests found in your jurisdiction matching those criteria."