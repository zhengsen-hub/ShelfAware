import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Star, BookOpen, Award, TrendingUp, Calendar, Heart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { mockUser, mockReadingProgress, mockReviews, mockBooks, mockMoodHistory } from '../data/mockData';
import { apiService } from '../services/api';
import { toast } from 'sonner';

interface ProfileProps {
  accessToken: string | null;
  userEmail: string | null;
}

export function Profile({ accessToken, userEmail }: ProfileProps) {
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    profile_photo_url: '',
    bio: '',
    location: '',
    favorite_genres_json: '',
  });

  useEffect(() => {
    const loadMyProfile = async () => {
      if (!accessToken) {
        setIsProfileLoading(false);
        return;
      }

      try {
        const profile = await apiService.getMyProfile(accessToken);
        setProfileForm({
          display_name: profile.display_name || '',
          profile_photo_url: profile.profile_photo_url || '',
          bio: profile.bio || '',
          location: profile.location || '',
          favorite_genres_json: profile.favorite_genres_json || '',
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Could not load user profile');
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadMyProfile();
  }, [accessToken]);

  const userInitials = useMemo(() => {
    const source = profileForm.display_name || userEmail || mockUser.name;
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U';
  }, [profileForm.display_name, userEmail]);

  const handleProfileFieldChange = (field: keyof typeof profileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!accessToken) {
      toast.error('Please sign in to update your profile');
      return;
    }

    if (!profileForm.display_name.trim()) {
      toast.error('Display name is required');
      return;
    }

    try {
      setIsSavingProfile(true);
      const updated = await apiService.updateMyProfile(accessToken, {
        display_name: profileForm.display_name.trim(),
        profile_photo_url: profileForm.profile_photo_url.trim(),
        bio: profileForm.bio.trim(),
        location: profileForm.location.trim(),
        favorite_genres_json: profileForm.favorite_genres_json.trim(),
      });

      setProfileForm({
        display_name: updated.display_name || '',
        profile_photo_url: updated.profile_photo_url || '',
        bio: updated.bio || '',
        location: updated.location || '',
        favorite_genres_json: updated.favorite_genres_json || '',
      });

      toast.success('Profile updated');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const totalBooks = mockReadingProgress.length;
  const completedBooks = mockReadingProgress.filter((p) => p.status === 'completed').length;
  const currentlyReading = mockReadingProgress.filter((p) => p.status === 'reading').length;

  // Calculate reading statistics
  const genreData = mockBooks.reduce((acc, book) => {
    const progress = mockReadingProgress.find((p) => p.bookId === book.id);
    if (progress) {
      book.genre.forEach((genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const genreChartData = Object.entries(genreData).map(([genre, count]) => ({
    genre,
    count,
  }));

  // Mood history chart data
  const moodChartData = mockMoodHistory.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: entry.mood,
  }));

  // Average rating given
  const avgRatingGiven =
    mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>

      {/* User Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:space-x-6">
            <Avatar className="size-24">
              {profileForm.profile_photo_url ? (
                <img
                  src={profileForm.profile_photo_url}
                  alt={profileForm.display_name || 'Profile photo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">
                {isProfileLoading ? 'Loading profile...' : profileForm.display_name || 'Set your display name'}
              </h2>
              <p className="text-gray-600 mb-3">{userEmail || mockUser.email}</p>
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <Star className="size-5 text-yellow-500 mr-2 fill-current" />
                  <span className="font-semibold">{mockUser.reputation.toFixed(1)}</span>
                  <span className="text-sm text-gray-600 ml-1">Reputation</span>
                </div>
                <div className="flex items-center">
                  <Award className="size-5 text-purple-500 mr-2" />
                  <span className="font-semibold">{mockReviews.length}</span>
                  <span className="text-sm text-gray-600 ml-1">Reviews</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="size-5 text-blue-500 mr-2" />
                  <span className="font-semibold">{totalBooks}</span>
                  <span className="text-sm text-gray-600 ml-1">Books</span>
                </div>
              </div>

              <div className="mt-5 grid md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Display Name</label>
                  <Input
                    value={profileForm.display_name}
                    placeholder="Enter display name"
                    onChange={(e) => handleProfileFieldChange('display_name', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <Input
                    value={profileForm.location}
                    placeholder="Enter location"
                    onChange={(e) => handleProfileFieldChange('location', e.target.value)}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Profile Photo URL</label>
                  <Input
                    value={profileForm.profile_photo_url}
                    placeholder="https://..."
                    onChange={(e) => handleProfileFieldChange('profile_photo_url', e.target.value)}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Bio</label>
                  <Textarea
                    value={profileForm.bio}
                    placeholder="Tell others what you like to read"
                    onChange={(e) => handleProfileFieldChange('bio', e.target.value)}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Favorite Genres (JSON)</label>
                  <Input
                    value={profileForm.favorite_genres_json}
                    placeholder='["Fantasy", "Mystery"]'
                    onChange={(e) => handleProfileFieldChange('favorite_genres_json', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button onClick={handleSaveProfile} disabled={isSavingProfile || isProfileLoading}>
                  {isSavingProfile ? 'Saving...' : 'Save Profile Details'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reading Statistics */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="size-5 mr-2 text-blue-500" />
              Currently Reading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{currentlyReading}</div>
            <p className="text-sm text-gray-600 mt-1">books in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="size-5 mr-2 text-yellow-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{completedBooks}</div>
            <p className="text-sm text-gray-600 mt-1">books finished</p>
            <Progress value={(completedBooks / totalBooks) * 100} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="size-5 mr-2 text-green-500" />
              Avg Rating Given
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{avgRatingGiven.toFixed(1)}</div>
            <div className="flex mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-4 ${
                    i < Math.round(avgRatingGiven)
                      ? 'text-yellow-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="genres" className="w-full">
        <TabsList>
          <TabsTrigger value="genres">Reading by Genre</TabsTrigger>
          <TabsTrigger value="mood">Mood History</TabsTrigger>
          <TabsTrigger value="reviews">My Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="genres" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Books by Genre</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={genreChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="genre" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mood" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Mood Tracking History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMoodHistory.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                    <div className="flex items-center">
                      <Calendar className="size-4 text-gray-400 mr-3" />
                      <div>
                        <div className="font-semibold">{entry.mood}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(entry.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {entry.emotions.map((emotion) => (
                        <Badge key={emotion} variant="secondary" className="text-xs">
                          {emotion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Reviews ({mockReviews.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockReviews.map((review) => {
                const book = mockBooks.find((b) => b.id === review.bookId);
                return (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{book?.title}</h4>
                        <div className="flex items-center mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-4 ${
                                i < review.rating
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {review.emotion.map((emotion) => (
                        <Badge key={emotion} variant="outline" className="text-xs">
                          <Heart className="size-3 mr-1" />
                          {emotion}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-gray-700">{review.content}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
