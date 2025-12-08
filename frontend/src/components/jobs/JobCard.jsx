import { MapPin, Briefcase, Clock, DollarSign, Eye, Users, Target, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { skillRecommendationService, profileService } from '@/services';
import { useState, useEffect } from 'react';

const JobCard = ({ job, onApply }) => {
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState(null);
  
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  useEffect(() => {
    const calculateMatch = async () => {
      if (!currentUser.id || !job.skills_required || job.skills_required.length === 0) {
        return;
      }

      try {
        // Get user's profile from service layer
        const profileData = await profileService.getProfileByUserId(currentUser.id);
        const userProfile = profileData?.data || profileData;
        
        if (userProfile && userProfile.skills) {
          const match = skillRecommendationService.calculateJobMatch(
            userProfile.skills,
            job.skills_required || []
          );
          setMatchData(match);
        }
      } catch (error) {
        console.error('Error calculating job match:', error);
        // Don't show match data if there's an error
      }
    };

    calculateMatch();
  }, [currentUser.id, job.skills_required]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getJobTypeColor = (type) => {
    const colors = {
      'full-time': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'part-time': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'internship': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'contract': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getMatchScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Low Match';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer relative" data-testid={`job-card-${job.id}`}>
      {/* AI Match Score Badge */}
      {matchData && matchData.matchScore > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <Badge 
            className={`flex items-center gap-1 font-semibold border ${getMatchScoreColor(matchData.matchScore)}`}
            data-testid="match-score-badge"
          >
            <Target className="h-3 w-3" />
            {matchData.matchScore}% Match
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3" onClick={() => navigate(`/jobs/${job.id}`)}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 pr-20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1" data-testid="job-title">
              {job.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1" data-testid="job-company">
              {job.company}
            </p>
          </div>
          <Badge className={getJobTypeColor(job.job_type)} data-testid="job-type">
            {job.job_type}
          </Badge>
        </div>

        <div className="flex flex-col gap-1.5 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" />
            <span>{job.experience_required}</span>
          </div>
          {job.salary_range && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span>{job.salary_range}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3" onClick={() => navigate(`/jobs/${job.id}`)}>
        {/* AI Match Details */}
        {matchData && matchData.matchScore > 0 && (
          <div className="mb-3 p-2 bg-gray-50 rounded-md border border-gray-200" data-testid="skill-overlap-section">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Skill Match</span>
              <span className="text-xs text-gray-600">{matchData.matchPercentage}% of required skills</span>
            </div>
            <Progress value={matchData.matchPercentage} className="h-1.5 mb-2" />
            
            <div className="flex items-center gap-2 text-xs">
              {matchData.matching.length > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{matchData.matching.length} match</span>
                </div>
              )}
              {matchData.missing.length > 0 && (
                <div className="flex items-center gap-1 text-orange-600">
                  <XCircle className="h-3 w-3" />
                  <span>{matchData.missing.length} to learn</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.skills_required?.map((skill, index) => {
            const isMatching = matchData?.matching.includes(skill);
            const isMissing = matchData?.missing.includes(skill);
            
            return (
              <Badge 
                key={index} 
                variant={isMatching ? "default" : "secondary"}
                className={`text-xs ${isMatching ? 'bg-green-100 text-green-800 border-green-300' : isMissing ? 'bg-orange-100 text-orange-700 border-orange-300' : ''}`}
                data-testid={`skill-${index}`}
              >
                {skill}
              </Badge>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{job.views_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{job.applications_count || 0} applied</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDate(job.created_at)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/jobs/${job.id}`);
          }}
          data-testid="view-details-btn"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JobCard;