import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Briefcase, SlidersHorizontal, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import MainNavbar from '@/components/layout/MainNavbar';
import Footer from '@/components/layout/Footer';
import JobCard from '@/components/jobs/JobCard';
import JobSearchBar from '@/components/jobs/JobSearchBar';
import JobFilterSidebar from '@/components/jobs/JobFilterSidebar';
import JobSortDropdown from '@/components/jobs/JobSortDropdown';
import { jobService } from '@/services';

const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Check if user can post jobs (alumni or recruiter)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canPostJobs = ['alumni', 'recruiter'].includes(currentUser.role);

  // Filters state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    companies: searchParams.getAll('company') || [],
    locations: searchParams.getAll('location') || [],
    jobTypes: searchParams.getAll('type') || [],
    skills: searchParams.getAll('skill') || [],
    experienceLevels: searchParams.getAll('experience') || [],
  });

  // Results state
  const [results, setResults] = useState({
    data: [],
    totalPages: 0,
    totalResults: 0,
    currentPage: 1,
    hasMore: false,
  });

  // Load results
  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      let filtered = await jobService.filterJobs(filters);
      filtered = await jobService.sortJobs(filtered, sortBy);
      const paginated = await jobService.paginateResults(filtered, currentPage, pageSize);
      setResults(paginated);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadResults();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadResults]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    filters.companies?.forEach(c => params.append('company', c));
    filters.locations?.forEach(l => params.append('location', l));
    filters.jobTypes?.forEach(t => params.append('type', t));
    filters.skills?.forEach(s => params.append('skill', s));
    filters.experienceLevels?.forEach(e => params.append('experience', e));
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleSearchChange = (value) => {
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      companies: [],
      locations: [],
      jobTypes: [],
      skills: [],
      experienceLevels: [],
    });
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30" data-testid="jobs-page">
      <MainNavbar />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Discover Your Next Opportunity</span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Briefcase className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Job Opportunities</h1>
                </div>
                <p className="text-lg text-gray-600">
                  Discover exciting career opportunities from our alumni network
                </p>
              </div>
              {canPostJobs && (
                <Button 
                  onClick={() => navigate('/jobs/post')}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/50 h-12 px-6"
                  data-testid="post-job-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post Job
                </Button>
              )}
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <JobSearchBar
                value={filters.search}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="md:hidden h-12 px-6 border-2 border-gray-200 hover:border-blue-400 rounded-xl">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <JobFilterSidebar
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      onClearAll={handleClearFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              <JobSortDropdown value={sortBy} onChange={handleSortChange} />
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop Filter Sidebar */}
            <aside className="hidden md:block w-72 flex-shrink-0">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200 shadow-lg sticky top-4">
                <JobFilterSidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearAll={handleClearFilters}
                />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Results Count */}
              <div className="mb-6">
                <p className="text-base font-medium text-gray-700" data-testid="results-count">
                  {loading ? 'Loading...' : `${results.totalResults} job${results.totalResults !== 1 ? 's' : ''} found`}
                </p>
              </div>

              {/* Job Grid */}
              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 animate-pulse h-64" />
                  ))}
                </div>
              ) : results.data.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="jobs-grid">
                    {results.data.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {results.totalPages > 1 && (
                    <div className="mt-10 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                              className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-blue-50'} border-2 border-gray-200 rounded-xl`}
                            />
                          </PaginationItem>
                          
                          {[...Array(results.totalPages)].map((_, i) => {
                            const page = i + 1;
                            if (
                              page === 1 ||
                              page === results.totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    onClick={() => handlePageChange(page)}
                                    isActive={page === currentPage}
                                    className={`cursor-pointer rounded-xl border-2 transition-all ${
                                      page === currentPage
                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-600 shadow-lg'
                                        : 'border-gray-200 hover:border-blue-400'
                                    }`}
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            } else if (
                              page === currentPage - 2 ||
                              page === currentPage + 2
                            ) {
                              return (
                                <PaginationItem key={page}>
                                  <span className="px-4">...</span>
                                </PaginationItem>
                              );
                            }
                            return null;
                          })}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(Math.min(results.totalPages, currentPage + 1))}
                              className={`${currentPage === results.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-blue-50'} border-2 border-gray-200 rounded-xl`}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200" data-testid="no-jobs-message">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No jobs found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search or filters
                  </p>
                  <Button onClick={handleClearFilters} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Manage Jobs Link */}
          {canPostJobs && (
            <div className="mt-10 text-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/jobs/manage')}
                className="h-12 px-8 border-2 border-gray-300 hover:border-blue-400 rounded-xl"
                data-testid="manage-jobs-button"
              >
                Manage My Jobs
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Jobs;