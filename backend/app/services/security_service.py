"""
Establishes the trust boundary between the Express gateway (which owns
authentication/JWT verification) and this FastAPI core service.

The gateway is expected to sit behind a private network / service mesh so
this service is never reachable directly by end users. As defense in depth,
every request must carry the shared secret header set by the gateway.
"""
from dataclasses import dataclass

from fastapi import Header, HTTPException, status

from app.config import get_settings


@dataclass
class CurrentUser:
    user_id: str
    email: str
    role: str


async def get_current_user(
    x_user_id: str | None = Header(default=None),
    x_user_email: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    x_gateway_secret: str | None = Header(default=None),
) -> CurrentUser:
    settings = get_settings()

    if x_gateway_secret != settings.trusted_gateway_header_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Request did not originate from a trusted gateway",
        )

    if not x_user_id or not x_user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing user identity headers",
        )

    return CurrentUser(user_id=x_user_id, email=x_user_email, role=x_user_role or "analyst")
