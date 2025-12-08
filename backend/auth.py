import os
import time
from functools import lru_cache
from typing import Dict, Optional

import httpx
from fastapi import HTTPException, Request, status
from jose import jwk, jwt
from jose.utils import base64url_decode

DEMO_USER_ID = os.getenv("DEMO_USER_ID")
ALLOW_DEV_AUTH = os.getenv("ALLOW_DEV_AUTH", "false").lower() in ("1", "true", "yes")

JWT_AUDIENCE = os.getenv("JWT_AUDIENCE")
JWT_ISSUER = os.getenv("JWT_ISSUER")
USER_POOL_ID = os.getenv("USER_POOL_ID")
USER_POOL_CLIENT_ID = os.getenv("USER_POOL_CLIENT_ID")
REGION = os.getenv("AWS_REGION") or os.getenv("REGION")


class AuthError(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_401_UNAUTHORIZED):
        super().__init__(status_code=status_code, detail=detail)


def _issuer() -> str:
    if JWT_ISSUER:
        return JWT_ISSUER.rstrip("/")
    if USER_POOL_ID and REGION:
        return f"https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}"
    raise AuthError("Auth issuer is not configured")


def _jwks_url() -> str:
    return f"{_issuer()}/.well-known/jwks.json"


@lru_cache(maxsize=1)
def _load_jwks() -> Dict[str, Dict[str, str]]:
    try:
        resp = httpx.get(_jwks_url(), timeout=5)
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise AuthError("Unable to download JWKS") from exc
    data = resp.json()
    keys: Dict[str, Dict[str, str]] = {}
    for key in data.get("keys", []):
        kid = key.get("kid")
        if kid:
            keys[kid] = key
    return keys


def _get_key_for_token(token: str) -> Dict[str, str]:
    headers = jwt.get_unverified_header(token)
    kid: Optional[str] = headers.get("kid")
    if not kid:
        raise AuthError("Token missing kid header")
    keys = _load_jwks()
    key = keys.get(kid)
    if not key:
        # Refresh cache once; if still missing, reject.
        _load_jwks.cache_clear()
        keys = _load_jwks()
        key = keys.get(kid)
    if not key:
        raise AuthError("Unable to find matching JWK for token")
    return key


def _verify_jwt(token: str) -> str:
    if not JWT_AUDIENCE:
        raise AuthError("Auth audience is not configured")
    key_data = _get_key_for_token(token)
    public_key = jwk.construct(key_data)

    if token.count(".") != 2:
        raise AuthError("Invalid token format")

    message, encoded_sig = token.rsplit(".", 1)
    decoded_sig = base64url_decode(encoded_sig.encode("utf-8"))
    if not public_key.verify(message.encode("utf-8"), decoded_sig):
        raise AuthError("Invalid token signature")

    claims = jwt.get_unverified_claims(token)
    now = int(time.time())
    if claims.get("exp") and now > int(claims["exp"]):
        raise AuthError("Token has expired")
    if claims.get("iss") != _issuer():
        raise AuthError("Invalid token issuer")
    token_use = claims.get("token_use")
    allowed_audiences = {JWT_AUDIENCE}
    if USER_POOL_ID:
        allowed_audiences.add(USER_POOL_ID)
    if USER_POOL_CLIENT_ID:
        allowed_audiences.add(USER_POOL_CLIENT_ID)

    if token_use == "access":
        client_id = claims.get("client_id")
        if not client_id or client_id not in allowed_audiences:
            raise AuthError("Invalid token audience")
    else:
        aud = claims.get("aud")
        valid_aud = False
        if isinstance(aud, list):
            valid_aud = any(a in allowed_audiences for a in aud)
        else:
            valid_aud = aud in allowed_audiences
        if not valid_aud:
            raise AuthError("Invalid token audience")

    sub = claims.get("sub")
    if not sub:
        raise AuthError("Token missing subject")
    return sub


def get_user_id(request: Request) -> str:
    auth_header = request.headers.get("authorization") or request.headers.get(
        "Authorization"
    )
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.removeprefix("Bearer ").strip()
        return _verify_jwt(token)

    header_user = request.headers.get("x-user-id") or request.headers.get("X-User-Id")
    if header_user and ALLOW_DEV_AUTH:
        return header_user

    # Dev-only fallback to simplify local usage without Cognito.
    if DEMO_USER_ID and ALLOW_DEV_AUTH:
        return DEMO_USER_ID

    raise AuthError("Authorization token is required")
