from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.config import get_settings
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


@router.post("/avatar", response_model=ProfileRead)
def upload_profile_avatar(
    file: UploadFile = File(...),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if file.content_type not in {"image/jpeg", "image/png", "image/webp", "image/gif"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image files are allowed")

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        suffix = ".jpg"

    settings = get_settings()
    upload_dir = Path(settings.upload_dir) / "avatars"
    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"profile-{uuid4().hex}{suffix}"
    path = upload_dir / filename

    size = 0
    with path.open("wb") as output:
        while chunk := file.file.read(1024 * 1024):
            size += len(chunk)
            if size > 2 * 1024 * 1024:
                path.unlink(missing_ok=True)
                raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Avatar must be 2MB or smaller")
            output.write(chunk)

    profile = db.get(Profile, 1)
    if profile is None:
        profile = Profile(id=1, name="未命名", bio="")
        db.add(profile)
    profile.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(profile)
    return profile
