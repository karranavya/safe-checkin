from datetime import datetime, timezone, timedelta
from bson import ObjectId

IST = timezone(timedelta(hours=5, minutes=30))


def to_ist(dt: datetime | None) -> str:
    """Format a datetime as readable IST string."""
    if dt is None:
        return "N/A"
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST).strftime("%d %b %Y, %I:%M %p IST")


def mask_aadhaar(aadhaar: str | None) -> str:
    """Always show only last 4 digits. XXXX-XXXX-1234."""
    if not aadhaar:
        return "N/A"
    digits = str(aadhaar).replace(" ", "").replace("-", "")
    return f"XXXX-XXXX-{digits[-4:]}"


def get_date_filter(period: str | None) -> datetime | None:
    """Return the start datetime for a period string."""
    now = datetime.now(tz=timezone.utc)
    if period == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    if period == "this_week":
        return now - timedelta(days=7)
    if period == "this_month":
        return now - timedelta(days=30)
    return None


def safe_str(obj_id) -> str:
    if obj_id is None:
        return ""
    return str(obj_id)


def str_to_object_id(id_str: str) -> ObjectId | None:
    try:
        return ObjectId(id_str)
    except Exception:
        return None