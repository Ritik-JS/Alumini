import { Star, Users, CheckCircle2, BookOpen, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

const MentorCard = ({ mentor, onRequestMentorship }) => {
  const navigate = useNavigate();

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  // Safely parse rating to ensure it's always a number
  const rating = typeof mentor.rating === 'number' 
    ? mentor.rating 
    : parseFloat(mentor.rating) || 0;

  const availableSlots = mentor.max_mentees - mentor.current_mentees_count;
  const isAvailable = mentor.is_available && availableSlots > 0;

  return (
    <Card
      data-testid={`mentor-card-${mentor.id}`}
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
      onClick={() => navigate(`/mentorship/mentor/${mentor.user_id}`)}
    >
      <CardContent className="p-6">
        {/* Avatar and Basic Info */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={mentor.profile?.photo_url} alt={mentor.profile?.name} />
              <AvatarFallback className="text-lg">
                {getInitials(mentor.profile?.name)}
              </AvatarFallback>
            </Avatar>
            {mentor.profile?.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
            )}
          </div>

          <div className="space-y-1 w-full">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
              {mentor.profile?.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-1">
              {mentor.profile?.headline || mentor.profile?.current_role}
            </p>
          </div>
        </div>

        {/* Rating and Stats */}
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-yellow-600">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-semibold">{rating.toFixed(1)}</span>
            <span className="text-gray-500">({mentor.total_reviews || 0})</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <BookOpen className="h-4 w-4" />
            <span>{mentor.total_sessions || 0} sessions</span>
          </div>
        </div>

        {/* Availability Badge */}
        <div className="mt-3 flex justify-center">
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

        {/* Expertise Areas */}
        {mentor.expertise_areas && mentor.expertise_areas.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {mentor.expertise_areas.slice(0, 3).map((area, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs px-2 py-0.5"
                >
                  {area}
                </Badge>
              ))}
              {mentor.expertise_areas.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{mentor.expertise_areas.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Current Mentees */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Currently mentoring {mentor.current_mentees_count} of {mentor.max_mentees} mentees
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button
            data-testid={`view-mentor-${mentor.id}`}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/mentorship/mentor/${mentor.user_id}`);
            }}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            View Profile
          </Button>
          <Button
            data-testid={`request-mentorship-${mentor.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onRequestMentorship(mentor);
            }}
            className="flex-1"
            size="sm"
            disabled={!isAvailable}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Request
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MentorCard;