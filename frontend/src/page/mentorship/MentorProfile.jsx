import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Users, BookOpen, MessageSquare, Briefcase, MapPin, Award, ExternalLink } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import RequestMentorshipModal from '@/components/mentorship/RequestMentorshipModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { mentorshipService, profileService } from '@/services';

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
    <p className="text-gray-600">Loading mentor profile...</p>
  </div>
);

const ErrorMessage = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="text-red-500 mb-4">
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Mentor Profile</h3>
    <p className="text-gray-600 mb-4 text-center max-w-md">{message}</p>
    {onRetry && (
      <Button onClick={onRetry}>Try Again</Button>
    )}
  </div>
);

const MentorProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMentorData();
  }, [userId]);

  const loadMentorData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get mentor data
      const mentorResult = await mentorshipService.getMentorByUserId(userId);
      if (!mentorResult.success) {
        setError(mentorResult.error || 'Failed to load mentor profile');
        return;
      }

      const mentorData = mentorResult.data;
      setMentor(mentorData);

      // Get reviews from completed sessions
      const requestsResult = await mentorshipService.getAllMentorshipRequests();
      if (requestsResult.success) {
        const requests = requestsResult.data;
        const mentorRequests = requests.filter(r => r.mentor_id === userId && r.status === 'accepted');

        const allReviews = [];
        for (const request of mentorRequests) {
          const sessionsResult = await mentorshipService.getSessionsByRequestId(request.id);
          if (sessionsResult.success) {
            const sessions = sessionsResult.data;
            const completedSessions = sessions.filter(s => s.status === 'completed' && s.feedback && s.rating);

            for (const session of completedSessions) {
              // Get student profile - service should provide enriched data
              allReviews.push({
                ...session,
                studentName: session.student?.name || 'Anonymous',
                studentPhoto: session.student?.photo_url,
              });
            }
          }
        }

        setReviews(allReviews.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date)));
      }
    } catch (err) {
      console.error('Error loading mentor data:', err);
      setError('Failed to load mentor profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorMessage message={error} onRetry={loadMentorData} />
        </div>
      </MainLayout>
    );
  }

  if (!mentor) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">Mentor not found</p>
        </div>
      </MainLayout>
    );
  }

  const availableSlots = mentor.max_mentees - mentor.current_mentees_count;
  const isAvailable = mentor.is_available && availableSlots > 0;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/mentorship/find')}
          className="mb-6"
          data-testid="back-btn"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Mentors
        </Button>

        {/* Profile Header Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={mentor.profile?.photo_url} alt={mentor.profile?.name} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(mentor.profile?.name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="mentor-name">
                  {mentor.profile?.name}
                </h1>
                <p className="text-lg text-gray-600 mb-4">{mentor.profile?.headline}</p>

                {/* Stats */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="font-semibold text-lg">
                      {(typeof mentor.rating === 'number' ? mentor.rating : parseFloat(mentor.rating) || 0).toFixed(2)}
                    </span>
                    <span className="text-gray-600">({mentor.total_reviews || 0} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen className="h-5 w-5" />
                    <span>{mentor.total_sessions || 0} sessions completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-5 w-5" />
                    <span>{mentor.current_mentees_count || 0} / {mentor.max_mentees || 0} mentees</span>
                  </div>
                </div>

                {/* Availability Badge */}
                <div className="mb-4">
                  {isAvailable ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <Users className="h-3 w-3 mr-1" />
                      {availableSlots} slot{availableSlots !== 1 ? 's' : ''} available
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      Currently unavailable
                    </Badge>
                  )}
                </div>

                {/* Request Button */}
                <Button
                  onClick={() => setShowRequestModal(true)}
                  disabled={!isAvailable}
                  size="lg"
                  data-testid="request-mentorship-btn"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Request Mentorship
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            {mentor.profile?.bio && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                  <p className="text-gray-700 whitespace-pre-line">{mentor.profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Mentorship Approach */}
            {mentor.mentorship_approach && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Mentorship Approach</h2>
                  <p className="text-gray-700 whitespace-pre-line">{mentor.mentorship_approach}</p>
                </CardContent>
              </Card>
            )}

            {/* Experience */}
            {mentor.profile?.experience_timeline && mentor.profile.experience_timeline.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Experience</h2>
                  <div className="space-y-4">
                    {mentor.profile.experience_timeline.map((exp, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Briefcase className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{exp.role}</h3>
                          <p className="text-gray-600">{exp.company}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {exp.start_date} - {exp.end_date || 'Present'}
                          </p>
                          {exp.description && (
                            <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews & Feedback */}
            {reviews.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Reviews & Feedback ({reviews.length})
                  </h2>
                  <div className="space-y-4">
                    {reviews.map((review, idx) => (
                      <div key={idx} className="border-b last:border-b-0 pb-4 last:pb-0">
                        <div className="flex items-start gap-3 mb-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.studentPhoto} alt={review.studentName} />
                            <AvatarFallback>{getInitials(review.studentName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900">{review.studentName}</h4>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="font-semibold">{review.rating}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(review.scheduled_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm ml-13">{review.feedback}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Expertise Areas */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-3">Expertise Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {mentor.expertise_areas?.map((area, idx) => (
                    <Badge key={idx} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            {mentor.profile?.skills && mentor.profile.skills.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {mentor.profile.skills.slice(0, 10).map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {mentor.profile.skills.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{mentor.profile.skills.length - 10} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Position */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-3">Current Position</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{mentor.profile?.current_role}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Award className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{mentor.profile?.current_company}</span>
                  </div>
                  {mentor.profile?.location && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{mentor.profile.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            {mentor.profile?.social_links && Object.keys(mentor.profile.social_links).length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Connect</h3>
                  <div className="space-y-2">
                    {Object.entries(mentor.profile.social_links).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="capitalize">{platform}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Request Mentorship Modal */}
      {showRequestModal && (
        <RequestMentorshipModal
          mentor={mentor}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            // Optionally show success message
          }}
        />
      )}
    </MainLayout>
  );
};

export default MentorProfile;
