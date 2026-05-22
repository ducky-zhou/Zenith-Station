from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Comment, Post, User
from app.schemas.comment import CommentCreate, CommentRead


router = APIRouter(tags=["comments"])


@router.get("/posts/{post_id}/comments", response_model=list[CommentRead])
def list_comments(post_id: int, db: Session = Depends(get_db)):
    if db.get(Post, post_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    stmt = (
        select(Comment)
        .options(joinedload(Comment.user))
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.desc())
    )
    return db.scalars(stmt).all()


@router.post("/posts/{post_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    payload: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.get(Post, post_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    comment = Comment(post_id=post_id, user_id=current_user.id, content=payload.content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return db.scalar(select(Comment).options(joinedload(Comment.user)).where(Comment.id == comment.id))


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete this comment")
    db.delete(comment)
    db.commit()
    return None
