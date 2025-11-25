# Phase 10 Components Usage Guide

## Quick Reference

### 1. Loading Skeletons

```jsx
import {
  ProfileCardSkeleton,
  JobCardSkeleton,
  EventCardSkeleton,
  TableSkeleton,
  DashboardWidgetSkeleton,
  ListItemSkeleton,
  FormSkeleton,
  FullPageSkeleton
} from '@/components/loading/SkeletonLoaders';

// Usage
function MyComponent() {
  const [loading, setLoading] = useState(true);
  
  if (loading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  return <ActualContent />;
}
```

### 2. Empty States

```jsx
import {
  NoSearchResults,
  NoJobs,
  NoEvents,
  NoNotifications,
  NoPosts,
  NoApplications,
  NoMentors,
  GenericEmpty
} from '@/components/empty-states/EmptyStates';

// Usage - No Jobs
{jobs.length === 0 && <NoJobs isOwn={true} />}

// Usage - No Search Results
{filteredData.length === 0 && (
  <NoSearchResults 
    query={searchQuery} 
    onClear={handleClearFilters} 
  />
)}

// Usage - Generic Empty State
<GenericEmpty
  icon={FileX}
  title="No documents found"
  description="Upload your first document to get started"
  action={<Button>Upload Document</Button>}
/>
```

### 3. Error Handling

```jsx
// App.js (Already implemented)
import ErrorBoundary from '@/components/error/ErrorBoundary';

<ErrorBoundary>
  <YourApp />
</ErrorBoundary>

// Error Pages
import NotFound from '@/pages/error/NotFound';
import ServerError from '@/pages/error/ServerError';

// Routes
<Route path="/404" element={<NotFound />} />
<Route path="/500" element={<ServerError />} />
<Route path="*" element={<NotFound />} />
```

### 4. Animations

```jsx
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/animations/PageTransition';
import { FadeIn } from '@/components/animations/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerChildren';

// Page Transition
<PageTransition>
  <YourPageContent />
</PageTransition>

// Fade In
<FadeIn delay={0.2} duration={0.5}>
  <Content />
</FadeIn>

// Stagger Children (for lists/grids)
<StaggerContainer className="grid gap-4">
  {items.map(item => (
    <StaggerItem key={item.id}>
      <ItemCard {...item} />
    </StaggerItem>
  ))}
</StaggerContainer>

// Custom Motion
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.05 }}
  transition={{ duration: 0.3 }}
>
  <Content />
</motion.div>
```

### 5. UI Enhancement Components

```jsx
// Loading Button
import { LoadingButton } from '@/components/ui/loading-button';

<LoadingButton
  loading={isSubmitting}
  loadingText="Saving..."
  onClick={handleSave}
>
  Save Changes
</LoadingButton>

// Confirmation Dialog
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useConfirmation } from '@/hooks/useConfirmation';

function MyComponent() {
  const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirmation();
  
  const handleDelete = () => {
    confirm({
      title: 'Delete Item',
      description: 'This action cannot be undone. Are you sure?',
      onConfirm: () => {
        // Perform delete
        console.log('Deleted!');
      },
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });
  };
  
  return (
    <>
      <Button onClick={handleDelete}>Delete</Button>
      <ConfirmationDialog
        open={isOpen}
        onOpenChange={(open) => !open && handleCancel()}
        {...config}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}

// Offline Indicator (Already added to App.js)
import { OfflineIndicator } from '@/components/ui/offline-indicator';

<OfflineIndicator />

// Breadcrumb Navigation
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';

<BreadcrumbNav
  items={[
    { label: 'Jobs', href: '/jobs' },
    { label: 'Software Engineer', href: '/jobs/123' },
    { label: 'Applications' } // Last item has no href
  ]}
/>

// Success Animation
import { SuccessAnimation } from '@/components/ui/success-animation';

<SuccessAnimation
  show={showSuccess}
  message="Profile updated successfully!"
/>
```

### 6. Custom Hooks

```jsx
// useDebounce - Delay API calls
import { useDebounce } from '@/hooks/useDebounce';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  useEffect(() => {
    if (debouncedSearch) {
      // Make API call with debouncedSearch
      fetchResults(debouncedSearch);
    }
  }, [debouncedSearch]);
  
  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  );
}

// useMediaQuery - Responsive hooks
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';

function ResponsiveComponent() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  
  return (
    <div>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
    </div>
  );
}

// useConfirmation - Confirmation dialogs
// (See UI Enhancement Components section above)
```

## Accessibility (data-testid)

All components include `data-testid` attributes for testing:

```jsx
// Buttons
<Button data-testid="submit-btn">Submit</Button>
<Button data-testid="cancel-btn">Cancel</Button>

// Links
<Link to="/jobs" data-testid="jobs-link">Jobs</Link>

// Forms
<form data-testid="login-form">
  <input data-testid="email-input" />
  <input data-testid="password-input" />
</form>

// Cards
<Card data-testid="job-card-123">
  {/* content */}
</Card>

// Empty States
<NoJobs data-testid="no-jobs-empty-state" />

// Error Messages
<Alert data-testid="error-message">Error occurred</Alert>
```

## Performance Best Practices

### 1. Lazy Loading (Already implemented in App.js)
```jsx
import { lazy, Suspense } from 'react';

const Jobs = lazy(() => import('@/page/jobs/Jobs'));

<Suspense fallback={<FullPageSkeleton />}>
  <Routes>
    <Route path="/jobs" element={<Jobs />} />
  </Routes>
</Suspense>
```

### 2. Debounced Search
```jsx
const debouncedSearch = useDebounce(searchTerm, 500);
// Reduces API calls from every keystroke to once every 500ms
```

### 3. Memoization
```jsx
import { useMemo, useCallback } from 'react';

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

### 4. Image Lazy Loading
```jsx
<img
  src={imageUrl}
  alt="Description"
  loading="lazy" // Native lazy loading
/>
```

## Mobile Responsiveness

### Responsive Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Responsive Text
```jsx
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
  Heading
</h1>

<p className="text-sm sm:text-base md:text-lg">
  Paragraph text
</p>
```

### Responsive Spacing
```jsx
<div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
  Content with responsive padding
</div>

<div className="space-y-4 sm:space-y-6 lg:space-y-8">
  Content with responsive spacing
</div>
```

### Mobile Menu
```jsx
// Hamburger menu on mobile, full nav on desktop
<nav>
  <div className="hidden md:flex">
    {/* Desktop navigation */}
  </div>
  <button className="md:hidden">
    {/* Mobile menu toggle */}
  </button>
</nav>
```

## CSS Utilities (Added to App.css)

### Shimmer Effect
```jsx
<div className="shimmer h-8 w-full rounded" />
```

### Smooth Transitions
```jsx
<div className="smooth-transition hover:scale-105" />
```

### Card Hover Effect
```jsx
<div className="hover-lift cursor-pointer" />
```

### Loading State
```jsx
<div className="loading-state">
  Content is disabled during loading
</div>
```

## Complete Example: Jobs Page with Phase 10 Features

```jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { JobCardSkeleton } from '@/components/loading/SkeletonLoaders';
import { NoJobs, NoSearchResults } from '@/components/empty-states/EmptyStates';
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerChildren';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/useMediaQuery';
import MainLayout from '@/components/layout/MainLayout';

function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    fetchJobs(debouncedSearch);
  }, [debouncedSearch]);
  
  const fetchJobs = async (search) => {
    setLoading(true);
    // Fetch jobs...
    setLoading(false);
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <BreadcrumbNav items={[{ label: 'Jobs' }]} />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" data-testid="jobs-title">
            Job Opportunities
          </h1>
          <p className="text-gray-600">
            Discover your next career opportunity
          </p>
        </motion.div>
        
        <div className="mb-6">
          <input
            type="search"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            data-testid="job-search-input"
          />
        </div>
        
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          searchTerm ? (
            <NoSearchResults 
              query={searchTerm} 
              onClear={() => setSearchTerm('')}
            />
          ) : (
            <NoJobs isOwn={false} />
          )
        ) : (
          <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map(job => (
              <StaggerItem key={job.id}>
                <motion.div whileHover={{ y: -4 }}>
                  <JobCard job={job} />
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </MainLayout>
  );
}

export default JobsPage;
```

## Testing with data-testid

```javascript
// Cypress/Playwright tests
cy.get('[data-testid="submit-btn"]').click();
cy.get('[data-testid="email-input"]').type('test@example.com');
cy.get('[data-testid="jobs-title"]').should('be.visible');
cy.get('[data-testid="no-jobs-empty-state"]').should('exist');
```

## Summary

Phase 10 provides:
- ✅ 8 types of loading skeletons
- ✅ 8 types of empty states
- ✅ Global error boundary + error pages
- ✅ 3 animation components + framer-motion
- ✅ 5 UI enhancement components
- ✅ 3 custom hooks
- ✅ Full accessibility support
- ✅ Mobile responsive utilities
- ✅ Performance optimizations
- ✅ Testing-ready with data-testid

Use this guide as a reference when building or enhancing pages!
