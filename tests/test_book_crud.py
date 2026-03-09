import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, date
from sqlalchemy.orm import Session

from app.models.book import Book
from app.schemas.book import BookCreate, BookUpdate, BookRead
from app.services.book_service import BookService


class TestBookService(unittest.TestCase):
    """Unit tests for BookService CRUD operations."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.mock_db = MagicMock(spec=Session)
        self.book_service = BookService(self.mock_db)

        # Sample book data
        self.sample_book_data = {
            "book_id": "test-book-123",
            "title": "Test Book",
            "subtitle": "A Test Subtitle",
            "cover_image_url": "https://example.com/cover.jpg",
            "abstract": "This is a test book abstract.",
            "CommunitySynopsis": "This is a test community synopsis.",
            "page_count": 300,
            "published_date": date(2023, 1, 1),
            "created_at": datetime.utcnow()
        }

        self.sample_book = Book(**self.sample_book_data)

    def test_get_books_no_limit(self):
        """Test get_books without limit."""
        # Arrange
        expected_books = [self.sample_book]
        self.mock_db.query.return_value.all.return_value = expected_books

        # Act
        result = self.book_service.get_books()

        # Assert
        self.mock_db.query.assert_called_once_with(Book)
        self.mock_db.query.return_value.all.assert_called_once()
        self.assertEqual(result, expected_books)

    def test_get_books_with_limit(self):
        """Test get_books with limit."""
        # Arrange
        limit = 10
        expected_books = [self.sample_book]
        mock_query = self.mock_db.query.return_value
        mock_query.limit.return_value.all.return_value = expected_books

        # Act
        result = self.book_service.get_books(limit=limit)

        # Assert
        self.mock_db.query.assert_called_once_with(Book)
        mock_query.limit.assert_called_once_with(limit)
        mock_query.limit.return_value.all.assert_called_once()
        self.assertEqual(result, expected_books)

    def test_get_book_found(self):
        """Test get_book when book exists."""
        # Arrange
        book_id = "test-book-123"
        self.mock_db.query.return_value.filter.return_value.first.return_value = self.sample_book

        # Act
        result = self.book_service.get_book(book_id)

        # Assert
        self.mock_db.query.assert_called_once_with(Book)
        self.mock_db.query.return_value.filter.assert_called_once()
        self.assertEqual(result, self.sample_book)

    def test_get_book_not_found(self):
        """Test get_book when book doesn't exist."""
        # Arrange
        book_id = "nonexistent-book"
        self.mock_db.query.return_value.filter.return_value.first.return_value = None

        # Act
        result = self.book_service.get_book(book_id)

        # Assert
        self.assertIsNone(result)

    def test_add_book_success(self):
        """Test add_book successful creation."""
        # Arrange
        book_create_data = BookCreate(
            title="New Test Book",
            subtitle="New Subtitle",
            cover_image_url="https://example.com/new-cover.jpg",
            abstract="New abstract",
            page_count=250,
            published_date=date(2024, 1, 1)
        )

        new_book = Book(**book_create_data.model_dump())
        new_book.book_id = "generated-id-123"

        self.mock_db.add = MagicMock()
        self.mock_db.commit = MagicMock()
        self.mock_db.refresh = MagicMock()

        # Mock the Book constructor to return our new book
        with patch('app.services.book_service.Book') as mock_book_class:
            mock_book_class.return_value = new_book

            # Act
            result = self.book_service.add_book(book_create_data)

            # Assert
            mock_book_class.assert_called_once_with(**book_create_data.model_dump())
            self.mock_db.add.assert_called_once_with(new_book)
            self.mock_db.commit.assert_called_once()
            self.mock_db.refresh.assert_called_once_with(new_book)
            self.assertEqual(result, new_book)

    def test_update_book_success(self):
        """Test update_book successful update."""
        # Arrange
        book_id = "test-book-123"
        update_data = BookUpdate(
            title="Updated Title",
            page_count=350
        )

        # Mock existing book
        self.mock_db.query.return_value.filter.return_value.first.return_value = self.sample_book
        self.mock_db.commit = MagicMock()
        self.mock_db.refresh = MagicMock()

        # Act
        result = self.book_service.update_book(book_id, update_data)

        # Assert
        self.assertEqual(self.sample_book.title, "Updated Title")
        self.assertEqual(self.sample_book.page_count, 350)
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once_with(self.sample_book)
        self.assertEqual(result, self.sample_book)

    def test_update_book_not_found(self):
        """Test update_book when book doesn't exist."""
        # Arrange
        book_id = "nonexistent-book"
        update_data = BookUpdate(title="Updated Title")

        self.mock_db.query.return_value.filter.return_value.first.return_value = None

        # Act
        result = self.book_service.update_book(book_id, update_data)

        # Assert
        self.assertIsNone(result)
        self.mock_db.commit.assert_not_called()
        self.mock_db.refresh.assert_not_called()

    def test_update_book_partial_update(self):
        """Test update_book with partial data (only some fields)."""
        # Arrange
        book_id = "test-book-123"
        update_data = BookUpdate(title="Updated Title")  # Only title

        self.mock_db.query.return_value.filter.return_value.first.return_value = self.sample_book
        self.mock_db.commit = MagicMock()
        self.mock_db.refresh = MagicMock()

        # Act
        result = self.book_service.update_book(book_id, update_data)

        # Assert
        self.assertEqual(self.sample_book.title, "Updated Title")
        # Other fields should remain unchanged
        self.assertEqual(self.sample_book.subtitle, "A Test Subtitle")
        self.assertEqual(self.sample_book.page_count, 300)
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once_with(self.sample_book)

    def test_delete_book_success(self):
        """Test delete_book successful deletion."""
        # Arrange
        book_id = "test-book-123"

        self.mock_db.query.return_value.filter.return_value.first.return_value = self.sample_book
        self.mock_db.delete = MagicMock()
        self.mock_db.commit = MagicMock()

        # Act
        result = self.book_service.delete_book(book_id)

        # Assert
        self.assertTrue(result)
        self.mock_db.delete.assert_called_once_with(self.sample_book)
        self.mock_db.commit.assert_called_once()

    def test_delete_book_not_found(self):
        """Test delete_book when book doesn't exist."""
        # Arrange
        book_id = "nonexistent-book"

        self.mock_db.query.return_value.filter.return_value.first.return_value = None

        # Act
        result = self.book_service.delete_book(book_id)

        # Assert
        self.assertFalse(result)
        self.mock_db.delete.assert_not_called()
        self.mock_db.commit.assert_not_called()


class TestBookSchemas(unittest.TestCase):
    """Unit tests for Book Pydantic schemas."""

    def test_book_create_valid(self):
        """Test BookCreate schema with valid data."""
        book_data = {
            "title": "Test Book",
            "subtitle": "Test Subtitle",
            "cover_image_url": "https://example.com/cover.jpg",
            "abstract": "Test abstract",
            "page_count": 300,
            "published_date": "2023-01-01",
            "CommunitySynopsis": "Test synopsis"
        }

        book = BookCreate(**book_data)
        self.assertEqual(book.title, "Test Book")
        self.assertEqual(book.subtitle, "Test Subtitle")
        self.assertEqual(book.page_count, 300)

    def test_book_create_minimal(self):
        """Test BookCreate schema with minimal required data."""
        book_data = {"title": "Test Book"}

        book = BookCreate(**book_data)
        self.assertEqual(book.title, "Test Book")
        self.assertIsNone(book.subtitle)
        self.assertIsNone(book.cover_image_url)
        self.assertIsNone(book.abstract)
        self.assertIsNone(book.page_count)
        self.assertIsNone(book.published_date)
        self.assertIsNone(book.CommunitySynopsis)

    def test_book_update_all_fields(self):
        """Test BookUpdate schema with all fields."""
        update_data = {
            "title": "Updated Title",
            "subtitle": "Updated Subtitle",
            "cover_image_url": "https://example.com/new-cover.jpg",
            "abstract": "Updated abstract",
            "page_count": 350,
            "published_date": "2024-01-01",
            "CommunitySynopsis": "Updated synopsis"
        }

        book_update = BookUpdate(**update_data)
        self.assertEqual(book_update.title, "Updated Title")
        self.assertEqual(book_update.page_count, 350)

    def test_book_update_partial(self):
        """Test BookUpdate schema with partial data."""
        update_data = {"title": "Updated Title"}

        book_update = BookUpdate(**update_data)
        self.assertEqual(book_update.title, "Updated Title")
        self.assertIsNone(book_update.subtitle)
        self.assertIsNone(book_update.page_count)

    def test_book_read_from_attributes(self):
        """Test BookRead schema can be created from SQLAlchemy model."""
        # Create a mock book with attributes
        class MockBook:
            def __init__(self):
                self.book_id = "test-123"
                self.title = "Test Book"
                self.subtitle = "Test Subtitle"
                self.cover_image_url = "https://example.com/cover.jpg"
                self.abstract = "Test abstract"
                self.CommunitySynopsis = "Test synopsis"
                self.page_count = 300
                self.published_date = date(2023, 1, 1)
                self.created_at = datetime.utcnow()

        mock_book = MockBook()

        # This should work with from_attributes=True
        book_read = BookRead.model_validate(mock_book)
        self.assertEqual(book_read.book_id, "test-123")
        self.assertEqual(book_read.title, "Test Book")
        self.assertEqual(book_read.page_count, 300)


if __name__ == '__main__':
    unittest.main()