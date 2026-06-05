from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_optional_user, require_admin
from app.db.session import get_db
from app.models import Comment, Favorite, Like, Post, User
from app.schemas.post import PostCreate, PostDetail, PostRead, PostUpdate


router = APIRouter(prefix="/posts", tags=["posts"])


def count_by_post(db: Session, model: type[Comment] | type[Favorite] | type[Like], post_ids: list[int]) -> dict[int, int]:
    if not post_ids:
        return {}
    rows = db.execute(
        select(model.post_id, func.count(model.id))
        .where(model.post_id.in_(post_ids))
        .group_by(model.post_id)
    ).all()
    return {post_id: count for post_id, count in rows}


def with_counts_many(posts: list[Post], db: Session) -> list[PostRead]:
    post_ids = [post.id for post in posts]
    likes = count_by_post(db, Like, post_ids)
    favorites = count_by_post(db, Favorite, post_ids)
    comments = count_by_post(db, Comment, post_ids)
    result: list[PostRead] = []
    for post in posts:
        data = PostRead.model_validate(post)
        data.likes_count = likes.get(post.id, 0)
        data.favorites_count = favorites.get(post.id, 0)
        data.comments_count = comments.get(post.id, 0)
        result.append(data)
    return result


def with_counts(post: Post, db: Session) -> PostRead:
    return with_counts_many([post], db)[0]


@router.get("", response_model=list[PostRead])
def list_posts(
    q: str | None = Query(default=None, max_length=100),
    include_drafts: bool = False,
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    stmt = select(Post).order_by(Post.created_at.desc())
    if include_drafts and (current_user is None or current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin permission required")
    if not include_drafts:
        stmt = stmt.where(Post.status == "published")
    if q:
        like_q = f"%{q}%"
        stmt = stmt.where(or_(Post.title.like(like_q), Post.summary.like(like_q), Post.content.like(like_q)))
    return with_counts_many(list(db.scalars(stmt).all()), db)


@router.get("/{post_id}", response_model=PostDetail)
def get_post(
    post_id: int,
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    post = db.scalar(select(Post).options(joinedload(Post.author)).where(Post.id == post_id))
    if post is None or (post.status != "published" and (current_user is None or current_user.role != "admin")):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    detail = PostDetail.model_validate(post)
    detail.likes_count = db.scalar(select(func.count(Like.id)).where(Like.post_id == post.id)) or 0
    detail.favorites_count = db.scalar(select(func.count(Favorite.id)).where(Favorite.post_id == post.id)) or 0
    detail.comments_count = db.scalar(select(func.count(Comment.id)).where(Comment.post_id == post.id)) or 0
    return detail


@router.post("", response_model=PostRead, status_code=status.HTTP_201_CREATED)
def create_post(payload: PostCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    post = Post(**payload.model_dump(), author_id=admin.id)
    db.add(post)
    db.commit()
    db.refresh(post)
    return with_counts(post, db)


@router.put("/{post_id}", response_model=PostRead)
def update_post(
    post_id: int,
    payload: PostUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    db.commit()
    db.refresh(post)
    return with_counts(post, db)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    db.delete(post)
    db.commit()
    return None
