import { MapPin, Briefcase, CheckCircle2, Eye, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const AlumniListItem = ({ profile, onViewProfile }) => {
  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  const getExperienceYears = () => {
    if (!profile.experience_timeline || profile.experience_timeline.length === 0) {
      return null;
    }
    const firstJob = profile.experience_timeline[profile.experience_timeline.length - 1];
    const startYear = new Date(firstJob.start_date).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - startYear;
  };

  const experienceYears = getExperienceYears();

  return (
    <Card
      data-testid={`alumni-list-item-${profile.id}`}
      className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={() => onViewProfile(profile)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.photo_url} alt={profile.name} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
              )}
            </div>
          </div>

          {/* Middle: Info */}
          <div className="flex-1 min-w-0">
            <div className="space-y-3">
              {/* Name and Headline */}
              <div>
                <h3 className="font-semibold text-xl text-gray-900 hover:text-blue-600 transition-colors">
                  {profile.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {profile.headline || profile.current_role}
                </p>
              </div>

              {/* Company, Location, Experience */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                {profile.current_company && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    <span>{profile.current_company}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.batch_year && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>Batch of {profile.batch_year}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {profile.bio}
                </p>
              )}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.slice(0, 8).map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {profile.skills.length > 8 && (
                    <Badge variant="outline" className="text-xs">
                      +{profile.skills.length - 8} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Stats and Actions */}
          <div className="flex-shrink-0 flex flex-col justify-between items-end gap-4">
            {/* Stats */}
            <div className="text-right space-y-1">
              {experienceYears && (
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{experienceYears}+</span> years exp.
                </div>
              )}
              <div className="text-xs text-gray-500">
                Profile {profile.profile_completion_percentage}% complete
              </div>
            </div>

            {/* Action Button */}
            <Button
              data-testid={`view-profile-list-${profile.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile(profile);
              }}
              size="sm"
            >
              <Eye className="h-4 w-4 mr-1" />
              View Profile
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlumniListItem;