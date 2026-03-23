import os
from datetime import datetime
from unittest.mock import Mock, patch

import pytest
from fastapi.testclient import TestClient

from app.dependencies.auth import get_current_user
from app.main import app
from app.services.review_service import ReviewService


@pytest.fixture(autouse=True)
def mock_env_vars():
    """Mock environment variables."""
    with patch.dict(
        os.environ,
        {
            "DATABASE_URL": "sqlite:///test.db",
        },
    ):
        yield


@pytest.fixture
def mock_review_service():
    """Mock ReviewService for route testing."""
    with patch("app.routes.review.ReviewService") as MockService:
        mock_instance = Mock(spec=ReviewService)
        MockService.return_value = mock_instance
        yield MockService


@pytest.fixture
def client(mock_review_service):
    """Test client with mocked auth and review service."""

    async def mock_get_current_user():
        return {
            "user_id": "test-user-123",
            "email": "test@example.com",
            "role": "user",
        }

    app.dependency_overrides[get_current_user] = mock_get_current_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ============================================================================
# TESTS: POST /reviews/books/{book_id}
# ============================================================================


class TestCreateReviewEndpoint:
    """Tests for POST /reviews/books/{book_id}."""

    def test_create_review_success(self, client, mock_review_service):
        """Test successfully creating a review."""
        # Arrange
        mock_instance = mock_review_service.return_value
        mock_instance.add_review.return_value = {
            "review_id": "review-789",
            "book_id": "book-456",
            "user_id": "user-123",
            "rating": 5,
            "comment": "Great book!",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

        payload = {"rating": 5, "comment": "Great book!"}

        # Act
        response = client.post("/reviews/books/book-456", json=payload)

        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["rating"] == 5
        assert data["comment"] == "Great book!"
        mock_instance.add_review.assert_called_once()

    def test_create_review_invalid_rating_zero(self, client, mock_review_service):
        """Test creating review with invalid rating."""
        # Arrange
        payload = {"rating": 0, "comment": "Bad"}

        # Act
        response = client.post("/reviews/books/book-456", json=payload)

        # Assert
        assert response.status_code == 422  # Validation error

    def test_create_review_missing_rating(self, client, mock_review_service):
        """Test creating review without required rating."""
        # Arrange
        payload = {"comment": "No rating"}

        # Act
        response = client.post("/reviews/books/book-456", json=payload)

        # Assert
        assert response.status_code == 422

    def test_create_review_book_not_found(self, client, mock_review_service):
        """Test creating review when book doesn't exist."""
        from fastapi import HTTPException

        # Arrange
        mock_instance = mock_review_service.return_value
        mock_instance.add_review.side_effect = HTTPException(
            status_code=404,
            detail="Book not found",
        )

        payload = {"rating": 5, "comment": "Test"}

        # Act
        response = client.post("/reviews/books/nonexistent", json=payload)

        # Assert
        assert response.status_code == 404