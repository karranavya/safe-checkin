"""
routers/police_chat.py

POST /police/chat — handles chat messages from the police dashboard.
Builds the correct system prompt and tool set based on whether the
requesting officer is admin_police or sub_police, then delegates to
run_agent() for the ReAct tool-calling loop.

NOTE: This is a RECONSTRUCTION based on the known shape of police_auth()
and PoliceUser (user_id, name, role, badge, rank). If your real file looks
meaningfully different, the only two lines that matter for the jurisdiction
fix are the police_id=... and police_role=... arguments passed to run_agent()
— add those to your existing file instead of replacing it wholesale.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth.jwt_handler import police_auth, PoliceUser
from agent.agent_loop import run_agent
from agent.prompts import sub_police_system_prompt, admin_police_system_prompt
from agent.tool_schemas import SUB_POLICE_TOOLS, ADMIN_POLICE_TOOLS

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.post("/chat")
async def police_chat(
    request: ChatRequest,
    user: PoliceUser = Depends(police_auth),
):
    if not request.messages:
        raise HTTPException(status_code=400, detail="messages cannot be empty")

    is_admin = user.role == "admin_police"

    if is_admin:
        system_prompt = admin_police_system_prompt(
            name=user.name, badge=user.badge, rank=user.rank
        )
        tools = ADMIN_POLICE_TOOLS
    else:
        system_prompt = sub_police_system_prompt(
            name=user.name, badge=user.badge, rank=user.rank
        )
        tools = SUB_POLICE_TOOLS

    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    try:
        reply = await run_agent(
            messages=messages,
            system_prompt=system_prompt,
            tools=tools,
            is_police=True,
            is_admin=is_admin,
            police_id=user.user_id,    # ⭐ NEW — enables jurisdiction scoping
            police_role=user.role,     # ⭐ NEW — "admin_police" or "sub_police"
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Agent error: {exc}")

    return {"reply": reply}