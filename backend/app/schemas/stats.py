from pydantic import BaseModel


class StatMetric(BaseModel):
    label: str
    value: int


class PostStat(BaseModel):
    id: int
    title: str
    views: int = 0
    likes_count: int = 0
    favorites_count: int = 0
    comments_count: int = 0


class StatsRead(BaseModel):
    metrics: list[StatMetric]
    top_viewed_posts: list[PostStat]
    top_liked_posts: list[PostStat]
    top_commented_posts: list[PostStat]
    top_favorited_posts: list[PostStat]
