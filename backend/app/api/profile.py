from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models import Profile, User
from app.schemas.profile import ProfileRead, ProfileUpdate


router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileRead)
def get_profile(db: Session = Depends(get_db)):
    profile = db.get(Profile, 1)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.put("", response_model=ProfileRead)
def update_profile(
    payload: ProfileUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    profile = db.get(Profile, 1)
    if profile is None:
        profile = Profile(id=1, name="未命名", bio="")
        db.add(profile)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
