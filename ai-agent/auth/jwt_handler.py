"""
Decodes JWTs issued by the Node.js backend.

Node.js signs tokens with:
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

The payload shape differs between hotel and police:

  Hotel token payload:
    { id: "<hotelId>", type: "hotel", name: "...", ... }

  Police token payload:
    { id: "<policeId>", role: "admin_police"|"sub_police", name: "...",
      badgeNumber: "...", rank: "...", ... }

We decode using the SAME JWT_SECRET — no changes to Node.js needed.
"""

from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from config.settings import get_settings

settings = get_settings()
_bearer = HTTPBearer()


def _decode(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
        )


# ── Hotel auth dependency ─────────────────────────────────────────────────────

class HotelUser:
    """Extracted from a hotel JWT."""
    def __init__(self, hotel_id: str, name: str, raw: dict):
        self.hotel_id = hotel_id
        self.name = name
        self.raw = raw


async def hotel_auth(
    creds: HTTPAuthorizationCredentials = Security(_bearer),
) -> HotelUser:
    payload = _decode(creds.credentials)

    # Reject police tokens — they have a 'role' field
    role = payload.get("role", "")
    if role in ("admin_police", "sub_police"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires a hotel token",
        )

    # Accept any non-police token that has an id
    hotel_id = (
        payload.get("id")
        or payload.get("_id")
        or payload.get("hotelId")
    )
    if not hotel_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="hotel_id missing from token",
        )

    return HotelUser(
        hotel_id=str(hotel_id),
        name=payload.get("name", "Hotel"),
        raw=payload,
    )


# ── Police auth dependency ────────────────────────────────────────────────────

class PoliceUser:
    """Extracted from a police JWT."""
    def __init__(self, user_id: str, name: str, role: str, badge: str, rank: str, raw: dict):
        self.user_id = user_id
        self.name = name
        self.role = role            # "admin_police" | "sub_police"
        self.badge = badge
        self.rank = rank
        self.raw = raw

    @property
    def is_admin(self) -> bool:
        return self.role == "admin_police"


async def police_auth(
    creds: HTTPAuthorizationCredentials = Security(_bearer),
) -> PoliceUser:
    payload = _decode(creds.credentials)

    # Your Node.js backend uses "policeRole" for admin_police/sub_police
    # and "role": "police" as a generic type marker
    police_role = (
        payload.get("policeRole")   # "admin_police" or "sub_police"
        or payload.get("role", "")  # fallback
    )

    # Reject if it's clearly a hotel token
    if not police_role or (
        "police" not in police_role.lower()
        and police_role not in ("admin_police", "sub_police")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires a police token",
        )

    # Your backend uses "policeId" not "id"
    user_id = (
        payload.get("policeId")
        or payload.get("id")
        or payload.get("_id")
    )
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="user_id missing from token",
        )

    return PoliceUser(
        user_id=str(user_id),
        name=payload.get("name", "Officer"),
        role=police_role,           # use policeRole value for is_admin check
        badge=payload.get("badgeNumber", ""),
        rank=payload.get("rank", ""),
        raw=payload,
    )