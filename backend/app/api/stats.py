from sqlalchemy import func, select
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends

from app.api.deps import require_admin
from app.db.session import get_db
from app.models import Comment, Event, Favorite, Like, Post, User
from app.schemas.stats import PostStat, StatMetric, StatsRead


router = APIRouter(prefix="/stats", tags=["stats"])


def post_counts(db: Session, posts: list[Post]) -> list[PostStat]:
    post_ids = [post.id for post in posts]
    if not post_ids:
        return []

    def grouped_count(model: type[Comment] | type[Favorite] | type[Like]) -> dict[int, int]:
        rows = db.execute(
            select(model.post_id, func.count(model.id))
            .where(model.post_id.in_(post_ids))
            .group_by(model.post_id)
        ).all()
        return {post_id: count for post_id, count in rows}

    likes = grouped_count(Like)
    favorites = grouped_count(Favorite)
    comments = grouped_count(Comment)
    views = post_views(db, post_ids)

    return [
        PostStat(
            id=post.id,
            title=post.title,
            views=views.get(post.id, 0),
            likes_count=likes.get(post.id, 0),
            favorites_count=favorites.get(post.id, 0),
            comments_count=comments.get(post.id, 0),
        )
        for post in posts
    ]


def post_views(db: Session, post_ids: list[int]) -> dict[int, int]:
    if not post_ids:
        return {}
    path_map = {f"/posts/{post_id}": post_id for post_id in post_ids}
    rows = db.execute(
        select(Event.path, func.count(Event.id))
        .where(Event.event == "page_view", Event.path.in_(path_map.keys()))
        .group_by(Event.path)
    ).all()
    return {path_map[path]: count for path, count in rows}


def top_posts_by_model(db: Session, model: type[Comment] | type[Favorite] | type[Like]) -> list[Post]:
    return list(
        db.scalars(
            select(Post)
            .join(model, model.post_id == Post.id)
            .where(Post.status == "published")
            .group_by(Post.id)
            .order_by(func.count(model.id).desc(), Post.created_at.desc())
            .limit(8)
        ).all()
    )


@router.get("", response_model=StatsRead)
def read_stats(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_posts = db.scalar(select(func.count(Post.id))) or 0
    total_users = db.scalar(select(func.count(User.id))) or 0
    total_comments = db.scalar(select(func.count(Comment.id))) or 0
    total_page_views = db.scalar(select(func.count(Event.id)).where(Event.event == "page_view")) or 0

    view_rows = db.execute(
        select(Event.path, func.count(Event.id))
        .where(Event.event == "page_view", Event.path.like("/posts/%"))
        .group_by(Event.path)
        .order_by(func.count(Event.id).desc())
        .limit(8)
    ).all()
    viewed_ids: list[int] = []
    for path, _ in view_rows:
        try:
            viewed_ids.append(int(path.rsplit("/", 1)[-1]))
        except ValueError:
            continue
    viewed_posts = list(db.scalars(select(Post).where(Post.id.in_(viewed_ids))).all())
    viewed_posts.sort(key=lambda post: viewed_ids.index(post.id))

    return StatsRead(
        metrics=[
            StatMetric(label="访问量", value=total_page_views),
            StatMetric(label="文章", value=total_posts),
            StatMetric(label="用户", value=total_users),
            StatMetric(label="评论", value=total_comments),
        ],
        top_viewed_posts=post_counts(db, viewed_posts),
        top_liked_posts=post_counts(db, top_posts_by_model(db, Like)),
        top_commented_posts=post_counts(db, top_posts_by_model(db, Comment)),
        top_favorited_posts=post_counts(db, top_posts_by_model(db, Favorite)),
    )
