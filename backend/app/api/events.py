import json

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_optional_user
from app.db.session import get_db
from app.models import Event, User
from app.schemas.event import EventCreate, EventRead


router = APIRouter(prefix="/track", tags=["tracking"])


@router.post("", response_model=EventRead)
def track_event(
    payload: EventCreate,
    request: Request,
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    event = Event(
        user_id=current_user.id if current_user else None,
        event=payload.event,
        path=payload.path,
        extra_json=json.dumps(payload.extra, ensure_ascii=False),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(event)
    db.commit()
    return EventRead()
