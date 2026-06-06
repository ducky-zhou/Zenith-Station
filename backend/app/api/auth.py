import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas.auth import TokenRead, UserCreate, UserLogin, UserRead


router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def frontend_base_url(request: Request) -> str:
    configured = settings.frontend_base_url.rstrip("/")
    if configured and "localhost" not in configured and "127.0.0.1" not in configured:
        return configured
    host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    proto = request.headers.get("x-forwarded-proto") or request.url.scheme
    if host:
        return f"{proto}://{host}"
    return configured or "http://localhost"


@router.post("/register", response_model=TokenRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    exists = db.scalar(select(User).where(or_(User.email == payload.email, User.username == payload.username)))
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email or username already exists")

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id), {"role": user.role})
    return TokenRead(access_token=token, user=UserRead.model_validate(user))


@router.post("/login", response_model=TokenRead)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(str(user.id), {"role": user.role})
    return TokenRead(access_token=token, user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/github/enabled")
def github_enabled():
    return {"enabled": bool(settings.github_client_id and settings.github_client_secret)}


@router.get("/github/start")
def github_start(request: Request):
    if not settings.github_client_id or not settings.github_client_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="GitHub login is not configured")
    state = secrets.token_urlsafe(24)
    redirect_uri = settings.github_redirect_uri or str(request.url_for("github_callback"))
    params = urlencode(
        {
            "client_id": settings.github_client_id,
            "redirect_uri": redirect_uri,
            "scope": "read:user user:email",
            "state": state,
        }
    )
    response = RedirectResponse(f"https://github.com/login/oauth/authorize?{params}")
    response.set_cookie("github_oauth_state", state, httponly=True, samesite="lax", max_age=600)
    return response


@router.get("/github/callback", name="github_callback")
async def github_callback(
    request: Request,
    code: str,
    state: str,
    db: Session = Depends(get_db),
):
    expected_state = request.cookies.get("github_oauth_state")
    if not expected_state or not secrets.compare_digest(expected_state, state):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state")

    redirect_uri = settings.github_redirect_uri or str(request.url_for("github_callback"))
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
            )
            token_data = token_response.json()
            github_token = token_data.get("access_token")
            if not github_token:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="GitHub authorization failed")

            headers = {"Authorization": f"Bearer {github_token}", "Accept": "application/vnd.github+json"}
            user_response = await client.get("https://api.github.com/user", headers=headers)
            user_response.raise_for_status()
            github_user = user_response.json()
            email = github_user.get("email")
            if not email:
                emails_response = await client.get("https://api.github.com/user/emails", headers=headers)
                emails_response.raise_for_status()
                emails = emails_response.json()
                primary = next((item for item in emails if item.get("primary") and item.get("verified")), None)
                email = primary.get("email") if primary else None
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="GitHub authorization service is unavailable") from exc

    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="GitHub account has no verified email")

    username_base = (github_user.get("login") or email.split("@", 1)[0])[:45]
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        username = username_base
        suffix = 1
        while db.scalar(select(User).where(User.username == username)) is not None:
            suffix += 1
            username = f"{username_base[:40]}-{suffix}"
        user = User(
            username=username,
            email=email,
            avatar_url=github_user.get("avatar_url"),
            password_hash=hash_password(secrets.token_urlsafe(32)),
            role="user",
        )
        db.add(user)
    elif github_user.get("avatar_url") and not user.avatar_url:
        user.avatar_url = github_user.get("avatar_url")
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id), {"role": user.role})
    response = RedirectResponse(f"{frontend_base_url(request)}/oauth/callback?token={token}")
    response.delete_cookie("github_oauth_state")
    return response
