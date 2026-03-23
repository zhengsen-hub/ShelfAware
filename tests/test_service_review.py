# Test to create, update, delete, and retrieve reviews.

import pytest
from fastapi import HTTPException, status
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from app.schemas.review import ReviewCreate, ReviewUpdate
from app.services.review_service import ReviewService


class TestAddReview:
    """Tests for ReviewService.add_review()."""

    def test_add_review_success(self, review_service, mock_db):
        """Test successfully adding a review with valid data."""
        # ARRANGE
        mock_db.scalar.side_effect = ["book-456", "user-123"]
        mock_db.commit = lambda: None
        mock_db.refresh = lambda x: None
        review_data = ReviewCreate(rating=5, comment="Excellent book!")

        # ACT
        result = review_service.add_review(
            book_id="book-456",
            user_id="user-123",
            review_data=review_data,
        )

        # ASSERT
        assert result is not None
        assert result.rating == 5
        mock_db.add.assert_called()

    def test_review_create_schema_rating_too_low(self):
        """Test ReviewCreate schema rejects rating < 1."""
        # ARRANGE / ACT / ASSERT
        with pytest.raises(ValidationError) as exc_info:
            ReviewCreate(rating=0, comment="Bad")

        # ASSERT
        errors = exc_info.value.errors()
        assert any(error["loc"][0] == "rating" for error in errors)

    def test_review_create_schema_rating_too_high(self):
        """Test ReviewCreate schema rejects rating > 5."""
        # ARRANGE / ACT / ASSERT
        with pytest.raises(ValidationError) as exc_info:
            ReviewCreate(rating=6, comment="Too good")

        # ASSERT
        errors = exc_info.value.errors()
        assert any("less than or equal to 5" in str(e) for e in errors)

    def test_review_create_schema_negative_rating(self):
        """Test ReviewCreate schema rejects negative rating."""
        # ARRANGE / ACT / ASSERT
        with pytest.raises(ValidationError):
            ReviewCreate(rating=-1, comment="Invalid")

    def test_add_review_minimum_valid_rating(self, review_service, mock_db):
        """Test adding review with minimum valid rating (1)."""
        # ARRANGE
        mock_db.scalar.side_effect = ["book-456", "user-123"]
        mock_db.commit = lambda: None
        mock_db.refresh = lambda x: None
        review_data = ReviewCreate(rating=1, comment="Terrible")

        # ACT
        result = review_service.add_review(
            book_id="book-456",
            user_id="user-123",
            review_data=review_data,
        )

        # ASSERT
        assert result is not None
        assert result.rating == 1

    def test_add_review_maximum_valid_rating(self, review_service, mock_db):
        """Test adding review with maximum valid rating (5)."""
        # ARRANGE
        mock_db.scalar.side_effect = ["book-456", "user-123"]
        mock_db.commit = lambda: None
        mock_db.refresh = lambda x: None
        review_data = ReviewCreate(rating=5, comment="Perfect!")

        # ACT
        result = review_service.add_review(
            book_id="book-456",
            user_id="user-123",
            review_data=review_data,
        )

        # ASSERT
        assert result is not None
        assert result.rating == 5