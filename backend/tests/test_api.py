from fastapi.testclient import TestClient

from app.main import app


def test_health_check():
    with TestClient(app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_posts_are_public():
    with TestClient(app) as client:
        response = client.get("/api/posts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_security_questions_do_not_expose_answers():
    with TestClient(app) as client:
        response = client.get("/api/security-games/phishing-detective/questions")
    assert response.status_code == 200
    assert "answer" not in response.json()[0]


def test_security_game_requires_all_answers():
    with TestClient(app) as client:
        login = client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "ChangeMe123!"},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]

        questions = client.get("/api/security-games/phishing-detective/questions")
        assert questions.status_code == 200
        question_id = questions.json()[0]["id"]

        response = client.post(
            "/api/security-games/phishing-detective/submit",
            headers={"Authorization": f"Bearer {token}"},
            json={"answers": [{"question_id": question_id, "answer": "1"}], "duration_seconds": 10},
        )
    assert response.status_code == 400
    assert response.json()["detail"] == "All questions must be answered"
