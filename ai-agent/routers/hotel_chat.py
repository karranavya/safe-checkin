from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth.jwt_handler import hotel_auth, HotelUser
from agent.agent_loop import run_agent
from agent.prompts import hotel_system_prompt
from agent.tool_schemas import HOTEL_TOOLS

router = APIRouter()


class ChatRequest(BaseModel):
    messages: list[dict]   # [{"role": "user"|"assistant", "content": "..."}]


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def hotel_chat(
    body: ChatRequest,
    user: HotelUser = Depends(hotel_auth),
):
    if not body.messages:
        raise HTTPException(status_code=400, detail="messages cannot be empty")

    reply = await run_agent(
        messages=body.messages,
        system_prompt=hotel_system_prompt(hotel_name=user.name),
        tools=HOTEL_TOOLS,
        hotel_id=user.hotel_id,
        is_police=False,
        is_admin=False,
    )
    return ChatResponse(reply=reply)