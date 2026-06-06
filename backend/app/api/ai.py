from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.config import get_settings
from app.db.session import get_db
from app.models import Post, User
from app.schemas.ai import (
    AiDraftRequest,
    AiPostSummaryRequest,
    AiSecurityQuestionRequest,
    AiStatusRead,
    AiSummaryRequest,
    AiTextRead,
)
from app.services import deepseek


router = APIRouter(prefix="/ai", tags=["ai"])


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
