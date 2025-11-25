import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Profile Card Skeleton
export const ProfileCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-start space-x-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Job Card Skeleton
export const JobCardSkeleton = () => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </CardContent>
  </Card>
);

// Event Card Skeleton
export const EventCardSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="h-48 w-full" />
    <CardContent className="p-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-full rounded-md mt-4" />
      </div>
    </CardContent>
  </Card>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 5 }) => (
  <div className="border rounded-lg overflow-hidden">
    <div className="bg-muted/50 p-4 border-b">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="p-4 border-b last:border-b-0">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-24" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Dashboard Widget Skeleton
export const DashboardWidgetSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-32" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-20 w-full" />
    </CardContent>
  </Card>
);

// List Item Skeleton
export const ListItemSkeleton = () => (
  <div className="flex items-center space-x-4 p-4 border-b">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-8 w-20 rounded-md" />
  </div>
);

// Form Skeleton
export const FormSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    ))}
    <Skeleton className="h-10 w-32 rounded-md mt-6" />
  </div>
);

// Full Page Skeleton
export const FullPageSkeleton = () => (
  <div className="container mx-auto py-8 space-y-6">
    <Skeleton className="h-10 w-64" />
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <ProfileCardSkeleton />
      <ProfileCardSkeleton />
      <ProfileCardSkeleton />
    </div>
  </div>
);
