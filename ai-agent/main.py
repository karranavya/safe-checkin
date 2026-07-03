from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from config.settings import get_settings
from db.mongo import connect_db, close_db
from auth.jwt_handler import hotel_auth, police_auth, HotelUser, PoliceUser
from routers import hotel_chat, police_chat

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    print(f"[SafeAI] Running on http://localhost:{settings.port}")
    yield
    await close_db()


app = FastAPI(
    title="SafeAI — Safe CheckIn AI Agent",
    version="1.0.0",
    description="Python AI microservice for Safe CheckIn",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "SafeAI"}


# ── Auth test endpoints (remove before production) ────────────────────────────
@app.get("/test/hotel-auth")
async def test_hotel_auth(user: HotelUser = Depends(hotel_auth)):
    return {"success": True, "hotel_id": user.hotel_id, "name": user.name, "payload": user.raw}


@app.get("/test/police-auth")
async def test_police_auth(user: PoliceUser = Depends(police_auth)):
    return {"success": True, "user_id": user.user_id, "name": user.name, "role": user.role, "is_admin": user.is_admin}


# ── Chat routers ──────────────────────────────────────────────────────────────
app.include_router(hotel_chat.router,  prefix="/hotel",  tags=["Hotel Chat"])
app.include_router(police_chat.router, prefix="/police", tags=["Police Chat"])