import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import SecurityGameQuestion, SecurityGameScore, User
from app.schemas.game import SecurityGameResult, SecurityGameResultItem, SecurityGameScoreRead, SecurityGameSubmit, SecurityQuestionRead


router = APIRouter(prefix="/security-games", tags=["security-games"])


@router.get("", response_model=list[str])
def list_games(db: Session = Depends(get_db)):
    names = db.scalars(select(SecurityGameQuestion.game_name).distinct().order_by(SecurityGameQuestion.game_name)).all()
    return list(names)


@router.get("/{game_name}/questions", response_model=list[SecurityQuestionRead])
def get_questions(game_name: str, db: Session = Depends(get_db)):
    questions = db.scalars(
        select(SecurityGameQuestion)
        .where(SecurityGameQuestion.game_name == game_name)
        .order_by(SecurityGameQuestion.id)
    ).all()
    if not questions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    return [
        SecurityQuestionRead(
            id=item.id,
            game_name=item.game_name,
            question=item.question,
            options=json.loads(item.options_json),
            difficulty=item.difficulty,
            category=item.category,
        )
        for item in questions
    ]


@router.post("/{game_name}/submit", response_model=SecurityGameResult)
def submit_game(
    game_name: str,
    payload: SecurityGameSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.answers:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No answers submitted")
    answer_map = {item.question_id: item.answer for item in payload.answers}
    if len(answer_map) != len(payload.answers):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate answers submitted")

    questions = db.scalars(
        select(SecurityGameQuestion)
        .where(SecurityGameQuestion.game_name == game_name)
        .order_by(SecurityGameQuestion.id)
    ).all()
    if not questions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

    question_ids = {question.id for question in questions}
    submitted_ids = set(answer_map)
    if submitted_ids != question_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="All questions must be answered")

    details: list[SecurityGameResultItem] = []
    correct_count = 0
    for question in questions:
        user_answer = answer_map[question.id]
        correct = user_answer == question.answer
        if correct:
            correct_count += 1
        details.append(
            SecurityGameResultItem(
                question_id=question.id,
                correct=correct,
                correct_answer=question.answer,
                explanation=question.explanation,
            )
        )
    total_count = len(questions)
    score = round((correct_count / total_count) * 100)
    score_row = SecurityGameScore(
        user_id=current_user.id,
        game_name=game_name,
        score=score,
        correct_count=correct_count,
        total_count=total_count,
        duration_seconds=payload.duration_seconds,
    )
    db.add(score_row)
    db.commit()
    return SecurityGameResult(
        game_name=game_name,
        score=score,
        correct_count=correct_count,
        total_count=total_count,
        details=details,
    )


@router.get("/{game_name}/leaderboard", response_model=list[SecurityGameScoreRead])
def leaderboard(game_name: str, db: Session = Depends(get_db)):
    rows = db.scalars(
        select(SecurityGameScore)
        .where(SecurityGameScore.game_name == game_name)
        .order_by(SecurityGameScore.score.desc(), SecurityGameScore.duration_seconds.asc(), SecurityGameScore.created_at.asc())
        .limit(20)
    ).all()
    return [
        SecurityGameScoreRead(
            id=row.id,
            username=row.user.username,
            game_name=row.game_name,
            score=row.score,
            correct_count=row.correct_count,
            total_count=row.total_count,
            duration_seconds=row.duration_seconds,
            created_at=row.created_at,
        )
        for row in rows
    ]
