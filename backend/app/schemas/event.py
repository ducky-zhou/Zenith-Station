from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    event: str = Field(min_length=1, max_length=80)
    path: str = Field(min_length=1, max_length=500)
    extra: dict = Field(default_factory=dict)


class EventRead(BaseModel):
    ok: bool = True
