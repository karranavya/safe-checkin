"""
search_guests — photo URLs are now pre-formatted as markdown image syntax
inside the tool result itself, so the LLM just copies them through rather
than having to construct the format from scratch (which it does unreliably).
"""
import re
from db.mongo import guests, hotels
from tools.helpers import mask_aadhaar, to_ist, str_to_object_id
from tools.jurisdiction_utils import get_jurisdiction_hotel_ids
from config.settings import get_settings

settings = get_settings()


def _build_photo_markdown(doc: dict) -> str | None:
    """
    Returns ready-to-render markdown image lines, e.g.:
      ![Guest Photo](http://localhost:5000/api/guests/abc123/photo/guestPhoto)
      ![ID Front](http://localhost:5000/api/guests/abc123/photo/idFront)

    Pre-formatting here is more reliable than instructing the LLM to construct
    the syntax itself — smaller models often drop the URL or forget the ![] part.
    """
    photos = doc.get("photos", {})
    if not photos:
        return None

    guest_id = str(doc.get("_id", ""))
    if not guest_id:
        return None

    lines = []
    for field, label in [
        ("guestPhoto", "Guest Photo"),
        ("idFront",    "ID Front"),
        ("idBack",     "ID Back"),
    ]:
        photo_info = photos.get(field) or {}
        has_data = bool(photo_info.get("data"))
        has_path = bool(photo_info.get("path") or photo_info.get("filename"))
        if has_data or has_path:
            url = f"{settings.backend_url}/api/guests/photo/{guest_id}/{field}"
            lines.append(f"![{label}]({url})")

    return "\n".join(lines) if lines else None


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

            if police_id:
                jurisdiction_ids = await get_jurisdiction_hotel_ids(police_id, police_role)
                if jurisdiction_ids is None:
                    return "Your jurisdiction has not been configured yet — no guests to show."
                if hotel_doc["_id"] not in jurisdiction_ids:
                    return f"'{params['hotel_name']}' is outside your jurisdiction."

            query["hotelId"] = hotel_doc["_id"]

        elif police_id:
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

        # ⭐ Pre-formatted markdown — LLM copies this verbatim rather than
        # constructing it, which is far more reliable with smaller models.
        photos_markdown = _build_photo_markdown(doc)
        if photos_markdown:
            row["photos"] = photos_markdown

        if is_police and doc.get("hotelId"):
            hotel_doc = await hotels().find_one(
                {"_id": doc["hotelId"]}, {"name": 1}
            )
            row["hotel"] = hotel_doc.get("name", "Unknown Hotel") if hotel_doc else "Unknown Hotel"

        results.append(row)

    return results if results else "No guests found matching those criteria."