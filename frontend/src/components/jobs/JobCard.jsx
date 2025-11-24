import { MapPin, Briefcase, Clock, DollarSign, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const JobCard = ({ job, onApply }) => {
  const navigate = useNavigate();

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

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" data-testid={`job-card-${job.id}`}>
      <CardHeader className="pb-3" onClick={() => navigate(`/jobs/${job.id}`)}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
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
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.skills_required?.slice(0, 4).map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs" data-testid={`skill-${index}`}>
              {skill}
            </Badge>
          ))}
          {job.skills_required?.length > 4 && (
            <Badge variant="secondary" className="text-xs">
              +{job.skills_required.length - 4}
            </Badge>
          )}
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
