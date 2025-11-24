import { X, MapPin, Briefcase, Calendar, CheckCircle2, Mail, Linkedin, Github, Twitter, Globe, Download, MessageSquare, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';

const ProfileModal = ({ profile, open, onClose }) => {
  const navigate = useNavigate();

  if (!profile) return null;

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  const handleViewFullProfile = () => {
    onClose();
    navigate(`/profile/${profile.user_id}`);
  };

  const socialLinks = profile.social_links || {};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="sr-only">Alumni Profile</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-80px)] pr-4">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-28 w-28">
                  <AvatarImage src={profile.photo_url} alt={profile.name} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                {profile.is_verified && (
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                  <p className="text-lg text-gray-600 mt-1">{profile.headline}</p>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
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

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" onClick={handleViewFullProfile}>
                    View Full Profile
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  {profile.cv_url && (
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Download CV
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Bio */}
            {profile.bio && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {profile.experience_timeline && profile.experience_timeline.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Experience</h3>
                <div className="space-y-4">
                  {profile.experience_timeline.map((exp, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{exp.role}</h4>
                        <p className="text-sm text-gray-600">{exp.company}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          {' - '}
                          {exp.end_date
                            ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            : 'Present'
                          }
                        </p>
                        {exp.description && (
                          <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education_details && profile.education_details.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Education</h3>
                <div className="space-y-3">
                  {profile.education_details.map((edu, idx) => (
                    <div key={idx}>
                      <h4 className="font-medium text-gray-900">{edu.degree} in {edu.field}</h4>
                      <p className="text-sm text-gray-600">{edu.institution}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {edu.start_year} - {edu.end_year}
                      </p>
                      {edu.achievements && (
                        <p className="text-sm text-gray-600 mt-1">{edu.achievements}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {Object.keys(socialLinks).length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Connect</h3>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.linkedin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(socialLinks.linkedin, '_blank')}
                    >
                      <Linkedin className="h-4 w-4 mr-1" />
                      LinkedIn
                    </Button>
                  )}
                  {socialLinks.github && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(socialLinks.github, '_blank')}
                    >
                      <Github className="h-4 w-4 mr-1" />
                      GitHub
                    </Button>
                  )}
                  {socialLinks.twitter && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(socialLinks.twitter, '_blank')}
                    >
                      <Twitter className="h-4 w-4 mr-1" />
                      Twitter
                    </Button>
                  )}
                  {socialLinks.website && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(socialLinks.website, '_blank')}
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      Website
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;