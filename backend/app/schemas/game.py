from datetime import datetime

from pydantic import BaseModel, Field


class SecurityQuestionRead(BaseModel):
    id: int
    game_name: str
    question: str
    options: list[str]
    difficulty: str
    category: str


class SecurityGameAnswer(BaseModel):
    question_id: int
    answer: str = Field(min_length=1, max_length=20)


class SecurityGameSubmit(BaseModel):
    answers: list[SecurityGameAnswer]
    duration_seconds: int = Field(default=0, ge=0, le=3600)


class SecurityGameResultItem(BaseModel):
    question_id: int
    correct: bool
    correct_answer: str
    explanation: str


class SecurityGameResult(BaseModel):
    game_name: str
    score: int
    correct_count: int
    total_count: int
    details: list[SecurityGameResultItem]


class SecurityGameScoreRead(BaseModel):
    id: int
    username: str
    game_name: str
    score: int
    correct_count: int
    total_count: int
    duration_seconds: int
    created_at: datetime
