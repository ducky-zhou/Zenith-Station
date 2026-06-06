from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.config import get_settings
from app.db.session import get_db
from app.models import Post, User
from app.schemas.ai import (
    AiDigestRequest,
    AiDraftRequest,
    AiPostSummaryRequest,
    AiSecurityQuestionRequest,
    AiStatusRead,
    AiSummaryRequest,
    AiTextRead,
)
from app.services import deepseek


router = APIRouter(prefix="/ai", tags=["ai"])
SUMMARY_CACHE: dict[str, str] = {}


@router.get("/enabled", response_model=AiStatusRead)
def ai_enabled():
    settings = get_settings()
    return AiStatusRead(enabled=deepseek.deepseek_enabled(), model=settings.deepseek_model)


@router.post("/summarize", response_model=AiTextRead)
async def summarize_text(payload: AiSummaryRequest, _: User = Depends(require_admin)):
    settings = get_settings()
    text = await deepseek.summarize_text(payload.text, payload.style)
    return AiTextRead(model=settings.deepseek_model, text=text)


@router.post("/summarize-post", response_model=AiTextRead)
async def summarize_post(
    payload: AiPostSummaryRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    post = db.scalar(select(Post).where(Post.id == payload.post_id))
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    settings = get_settings()
    text = await deepseek.summarize_text(f"# {post.title}\n\n{post.summary}\n\n{post.content}", payload.style)
    return AiTextRead(model=settings.deepseek_model, text=text)


@router.get("/posts/{post_id}/summary", response_model=AiTextRead)
async def public_post_summary(post_id: int, db: Session = Depends(get_db)):
    post = db.scalar(select(Post).where(Post.id == post_id, Post.status == "published"))
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    settings = get_settings()
    cache_key = f"{post.id}:{post.updated_at.isoformat()}:{settings.deepseek_model}"
    if cache_key not in SUMMARY_CACHE:
        content = f"# {post.title}\n\n{post.summary}\n\n{post.content[:12000]}"
        SUMMARY_CACHE[cache_key] = await deepseek.summarize_text(content, "blog sidebar concise")
    return AiTextRead(model=settings.deepseek_model, text=SUMMARY_CACHE[cache_key])


@router.post("/draft-post", response_model=AiTextRead)
async def draft_post(payload: AiDraftRequest, _: User = Depends(require_admin)):
    settings = get_settings()
    text = await deepseek.draft_post(payload.title, payload.keywords, payload.tone)
    return AiTextRead(model=settings.deepseek_model, text=text)


@router.post("/security-question", response_model=AiTextRead)
async def security_question(payload: AiSecurityQuestionRequest, _: User = Depends(require_admin)):
    settings = get_settings()
    text = await deepseek.generate_security_question(payload.topic, payload.difficulty)
    return AiTextRead(model=settings.deepseek_model, text=text)


@router.post("/digest/{kind}", response_model=AiTextRead)
async def digest(kind: str, payload: AiDigestRequest, _: User = Depends(require_admin)):
    allowed = {"daily-news", "github-trending", "papers", "llm-security"}
    if kind not in allowed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Digest type not found")
    settings = get_settings()
    text = await deepseek.generate_digest(kind, payload.source_text, payload.focus)
    return AiTextRead(model=settings.deepseek_model, text=text)
