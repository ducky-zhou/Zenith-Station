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
