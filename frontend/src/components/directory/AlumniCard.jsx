import { MapPin, Briefcase, CheckCircle2, Eye, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const AlumniCard = ({ profile, onViewProfile }) => {
  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  return (
    <Card
      data-testid={`alumni-card-${profile.id}`}
      className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group border-gray-200 overflow-hidden"
      onClick={() => onViewProfile(profile)}
    >
      <CardContent className="p-6 relative">
        {/* Decorative background gradient */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 -z-10"></div>
        
        {/* Avatar and Basic Info */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-2 ring-blue-100">
              <AvatarImage src={profile.photo_url} alt={profile.name} />
              <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            {profile.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
            )}
          </div>

          <div className="space-y-1 w-full">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
              {profile.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-1">
              {profile.headline || profile.current_role}
            </p>
          </div>
        </div>

        {/* Company and Location */}
        <div className="mt-4 space-y-2">
          {profile.current_company && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Briefcase className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{profile.current_company}</span>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{profile.location}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.slice(0, 3).map((skill, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                >
                  {skill}
                </Badge>
              ))}
              {profile.skills.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{profile.skills.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          {profile.batch_year && (
            <p className="text-xs text-gray-500">
              <span className="font-medium">Batch:</span> {profile.batch_year}
            </p>
          )}
          {profile.willing_to_mentor && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              Available to Mentor
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button
            data-testid={`view-profile-${profile.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(profile);
            }}
            className="flex-1"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlumniCard;