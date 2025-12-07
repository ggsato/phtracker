import base64
import json
import os
from typing import Optional

from fastapi import HTTPException, Request, status


DEMO_USER_ID = os.getenv("DEMO_USER_ID", "demo-user")


def _decode_jwt_sub(token: str) -> Optional[str]:
  # Best-effort JWT payload decode without signature verification; suitable for dev/local use.
    parts = token.split(".")
    if len(parts) < 2:
        return None
    payload_b64 = parts[1]
    padding = "=" * (-len(payload_b64) % 4)
    try:
        decoded = base64.urlsafe_b64decode(payload_b64 + padding)
        payload = json.loads(decoded.decode("utf-8"))
        return payload.get("sub")
    except Exception:
        return None


def get_user_id(request: Request) -> str:
    header_user = request.headers.get("x-user-id") or request.headers.get("X-User-Id")
    if header_user:
        return header_user

    auth_header = request.headers.get("authorization") or request.headers.get(
        "Authorization"
    )
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.removeprefix("Bearer ").strip()
        sub = _decode_jwt_sub(token)
        if sub:
            return sub

    # In production you should enforce verified JWTs. This fallback is for local/dev use.
    if DEMO_USER_ID:
        return DEMO_USER_ID

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unable to resolve user id from token",
    )
