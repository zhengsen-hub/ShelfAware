import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { BookOpen, Clock, Star, Heart, Search, Filter, Loader2 } from 'lucide-react';
import { apiService, Book } from '../services/api';
import { useNavigate } from 'react-router';

export function Bookshelf() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const fetchedBooks = await apiService.getBooks();
        setBooks(fetchedBooks);
        setError(null);
      } catch (err) {
        setError('Failed to load books. Please try again.');
        console.error('Error fetching books:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Convert API books to component format
  const booksWithProgress = books.map((book) => ({
    ...book,
    id: book.book_id,
    author: 'Unknown Author', // API doesn't have author field
    cover: book.cover_image_url || 'https://via.placeholder.com/400x600?text=No+Cover',
    genre: [], // API doesn't have genre field
    averageRating: 0, // API doesn't have rating field
    totalReviews: 0, // API doesn't have review count
    progress: undefined, // No progress tracking in current API
  }));

  const filteredBooks = booksWithProgress.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase());
    // Note: Genre and status filtering not available with current API
    return matchesSearch;
  });

  const readingBooks = filteredBooks; // All books for now
  const completedBooks: typeof filteredBooks = [];
  const wantToReadBooks: typeof filteredBooks = [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading books...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const BookCard = ({ book }: { book: typeof booksWithProgress[0] }) => (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/book/${book.id}`)}
    >
      <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg">
        <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
        {book.progress && book.progress.status === 'reading' && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/75 p-2">
            <div className="flex justify-between items-center text-white text-sm mb-1">
              <span>{book.progress.progress}%</span>
              <Clock className="size-3" />
            </div>
            <Progress value={book.progress.progress} className="h-1" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-1">{book.title}</h3>
        {book.subtitle && (
          <p className="text-sm text-gray-600 mb-2">{book.subtitle}</p>
        )}
        {book.abstract && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{book.abstract}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {book.page_count && <span>{book.page_count} pages</span>}
          {book.published_date && <span>{new Date(book.published_date).getFullYear()}</span>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Bookshelf</h1>
        <p className="text-gray-600">Discover and review amazing books</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
            <Input
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Books Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {filteredBooks.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try adjusting your search terms.' : 'Books will appear here once added to the system.'}
          </p>
        </div>
      )}
    </div>
  );
}
