from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Favorite, Like, Post, User
from app.schemas.post import PostRead
from app.api.posts import with_counts


router = APIRouter(tags=["interactions"])


def ensure_post(post_id: int, db: Session) -> Post:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post


@router.post("/posts/{post_id}/like")
def like_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_post(post_id, db)
    exists = db.scalar(select(Like).where(Like.post_id == post_id, Like.user_id == current_user.id))
    if exists is None:
        db.add(Like(post_id=post_id, user_id=current_user.id))
        db.commit()
    return {"liked": True}


@router.delete("/posts/{post_id}/like")
def unlike_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    like = db.scalar(select(Like).where(Like.post_id == post_id, Like.user_id == current_user.id))
    if like:
        db.delete(like)
        db.commit()
    return {"liked": False}


@router.get("/posts/{post_id}/like-status")
def like_status(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_post(post_id, db)
    liked = db.scalar(select(Like).where(Like.post_id == post_id, Like.user_id == current_user.id)) is not None
    favorited = db.scalar(select(Favorite).where(Favorite.post_id == post_id, Favorite.user_id == current_user.id)) is not None
    return {"liked": liked, "favorited": favorited}


@router.post("/posts/{post_id}/favorite")
def favorite_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_post(post_id, db)
    exists = db.scalar(select(Favorite).where(Favorite.post_id == post_id, Favorite.user_id == current_user.id))
    if exists is None:
        db.add(Favorite(post_id=post_id, user_id=current_user.id))
        db.commit()
    return {"favorited": True}


@router.delete("/posts/{post_id}/favorite")
def unfavorite_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    favorite = db.scalar(select(Favorite).where(Favorite.post_id == post_id, Favorite.user_id == current_user.id))
    if favorite:
        db.delete(favorite)
        db.commit()
    return {"favorited": False}


@router.get("/me/favorites", response_model=list[PostRead])
def my_favorites(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(Post).join(Favorite).where(Favorite.user_id == current_user.id).order_by(Favorite.created_at.desc())
    return [with_counts(post, db) for post in db.scalars(stmt).all()]
