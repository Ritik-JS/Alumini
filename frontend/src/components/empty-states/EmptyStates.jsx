import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Briefcase,
  Calendar,
  Bell,
  MessageSquare,
  Users,
  FileX,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyStateWrapper = ({ children }) => (
  <Card className="border-dashed">
    <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {children}
    </CardContent>
  </Card>
);

export const NoSearchResults = ({ query, onClear }) => (
  <EmptyStateWrapper>
    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      <Search className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold mb-2" data-testid="no-results-title">
      No results found
    </h3>
    <p className="text-gray-500 mb-4 max-w-md">
      {query
        ? `We couldn't find any results for "${query}". Try adjusting your search.`
        : 'No results match your current filters.'}
    </p>
    {onClear && (
      <Button variant="outline" onClick={onClear} data-testid="clear-filters-btn">
        Clear Filters
      </Button>
    )}
  </EmptyStateWrapper>
);

export const NoJobs = ({ isOwn = false }) => (
  <EmptyStateWrapper>
    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
      <Briefcase className="h-8 w-8 text-blue-600" />
    </div>
    <h3 className="text-lg font-semibold mb-2" data-testid="no-jobs-title">
      {isOwn ? 'No jobs posted yet' : 'No jobs available'}
    </h3>
    <p className="text-gray-500 mb-4 max-w-md">
      {isOwn
        ? 'You haven\'t posted any jobs yet. Start by creating your first job posting.'
        : 'There are no job openings available at the moment. Check back later!'}
    </p>
    {isOwn && (
      <Button asChild data-testid="post-job-btn">
        <Link to="/jobs/post">Post a Job</Link>
      </Button>
    )}
  </EmptyStateWrapper>
);

export const NoEvents = ({ canCreate = false }) => (
  <EmptyStateWrapper>
    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
      <Calendar className="h-8 w-8 text-purple-600" />
    </div>
    <h3 className="text-lg font-semibold mb-2" data-testid="no-events-title">
      No events scheduled
    </h3>
    <p className="text-gray-500 mb-4 max-w-md">
      {canCreate
        ? 'Create your first event to bring the alumni community together.'
        : 'There are no upcoming events at the moment. Check back soon!'}
    </p>
    {canCreate && (
      <Button asChild data-testid="create-event-btn">
        <Link to="/events/create">Create Event</Link>
      </Button>
    )}
  </EmptyStateWrapper>
);

export const NoNotifications = () => (
  <EmptyStateWrapper>
    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
      <Bell className="h-8 w-8 text-green-600" />
    </div>
    <h3 className="text-lg font-semibold mb-2" data-testid="no-notifications-title">
      No notifications
    </h3>
    <p className="text-gray-500 max-w-md">
      You're all caught up! We'll notify you when there's something new.
    </p>
  </EmptyStateWrapper>
);

export const NoPosts = ({ canCreate = true }) => (
  <EmptyStateWrapper>
    <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
      <MessageSquare className="h-8 w-8 text-orange-600" />
    </div>
    <h3 className="text-lg font-semibold mb-2" data-testid="no-posts-title">
      No posts yet
    </h3>
    <p className="text-gray-500 mb-4 max-w-md">
      {canCreate
        ? 'Be the first to start a conversation! Share your thoughts with the community.'
        : 'There are no posts in the forum yet.'}
    </p>
  </EmptyStateWrapper>
);

export const NoApplications = () => (
  <EmptyStateWrapper>
    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
      <FileX className="h-8 w-8 text-indigo-600" />
    </div>
    <h3 className="text-lg font-semibold mb-2" data-testid="no-applications-title">
      No applications yet
    </h3>
    <p className="text-gray-500 mb-4 max-w-md">
      You haven't applied to any jobs yet. Browse available positions and apply!
    </p>
    <Button asChild data-testid="browse-jobs-btn">
      <Link to="/jobs">Browse Jobs</Link>
    </Button>
  </EmptyStateWrapper>
);

export const NoMentors = () => (
  <EmptyStateWrapper>
    <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4">
      <Users className="h-8 w-8 text-teal-600" />
    </div>
    <h3 className="text-lg font-semibold mb-2" data-testid="no-mentors-title">
      No mentors found
    </h3>
    <p className="text-gray-500 mb-4 max-w-md">
      We couldn't find any mentors matching your criteria. Try adjusting your filters.
    </p>
  </EmptyStateWrapper>
);

export const GenericEmpty = ({ icon: Icon = AlertCircle, title, description, action }) => (
  <EmptyStateWrapper>
    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      <Icon className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    {description && <p className="text-gray-500 mb-4 max-w-md">{description}</p>}
    {action && action}
  </EmptyStateWrapper>
);
