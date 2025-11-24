import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const AlumniCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex flex-col items-center text-center space-y-3">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2 w-full">
          <Skeleton className="h-5 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-9 w-full" />
      </div>
    </CardContent>
  </Card>
);

export const AlumniListSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex gap-6">
        <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        <div className="flex-shrink-0">
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const SkeletonLoader = ({ view = 'grid', count = 6 }) => {
  if (view === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, idx) => (
          <AlumniListSkeleton key={idx} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <AlumniCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export default SkeletonLoader;