import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Filter, SlidersHorizontal } from 'lucide-react';
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
import SearchBar from '@/components/directory/SearchBar';
import FilterSidebar from '@/components/directory/FilterSidebar';
import ActiveFilters from '@/components/directory/ActiveFilters';
import AlumniCard from '@/components/directory/AlumniCard';
import AlumniListItem from '@/components/directory/AlumniListItem';
import ViewToggle from '@/components/directory/ViewToggle';
import SortDropdown from '@/components/directory/SortDropdown';
import SkeletonLoader from '@/components/directory/SkeletonLoader';
import ProfileModal from '@/components/directory/ProfileModal';
import { directoryService } from '@/services';

const AlumniDirectory = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const pageSize = 12;

  // Filters state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    companies: searchParams.getAll('company') || [],
    skills: searchParams.getAll('skill') || [],
    locations: searchParams.getAll('location') || [],
    roles: searchParams.getAll('role') || [],
    verifiedOnly: searchParams.get('verified') === 'true',
    yearRange: null,
  });

  // Results state
  const [results, setResults] = useState({
    data: [],
    totalPages: 0,
    totalResults: 0,
    currentPage: 1,
    hasMore: false,
  });

  // Load results from backend API
  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        name: filters.search,
        company: filters.companies.join(','),
        skills: filters.skills.join(','),
        location: filters.locations.join(','),
        job_role: filters.roles.join(','),
        verified_only: filters.verifiedOnly,
        page: currentPage,
        limit: pageSize
      };
      
      const response = await directoryService.searchProfiles(params);
      
      if (response.success && response.data) {
        // Backend returns paginated data
        setResults({
          data: response.data.profiles || [],
          totalPages: response.data.total_pages || 0,
          totalResults: response.data.total || 0,
          currentPage: response.data.page || 1,
          hasMore: (response.data.page * pageSize) < response.data.total
        });
      } else {
        // Fallback to empty results
        setResults({
          data: [],
          totalPages: 0,
          totalResults: 0,
          currentPage: 1,
          hasMore: false
        });
      }
    } catch (error) {
      console.error('Error loading results:', error);
      // Fallback to empty results on error
      setResults({
        data: [],
        totalPages: 0,
        totalResults: 0,
        currentPage: 1,
        hasMore: false
      });
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, currentPage]);

  // Initial load and reload on dependencies change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadResults();
    }, 100);
    return () => clearTimeout(timer);
  }, [loadResults]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    filters.companies?.forEach(c => params.append('company', c));
    filters.skills?.forEach(s => params.append('skill', s));
    filters.locations?.forEach(l => params.append('location', l));
    filters.roles?.forEach(r => params.append('role', r));
    if (filters.verifiedOnly) params.set('verified', 'true');
    
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Handle search
  const handleSearch = (query) => {
    setFilters(prev => ({ ...prev, search: query }));
    setCurrentPage(1);
    if (query) {
      directoryService.saveSearchHistory(query);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      companies: [],
      skills: [],
      locations: [],
      roles: [],
      verifiedOnly: false,
      yearRange: null,
    });
    setCurrentPage(1);
  };

  // Remove single filter
  const handleRemoveFilter = (type, value) => {
    if (type === 'verifiedOnly') {
      setFilters(prev => ({ ...prev, verifiedOnly: false }));
    } else if (type === 'yearRange') {
      setFilters(prev => ({ ...prev, yearRange: null }));
    } else {
      setFilters(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item !== value),
      }));
    }
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  // Handle view profile
  const handleViewProfile = (profile) => {
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <MainNavbar />

      <main className="flex-1">
        {/* Enhanced Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 mb-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Alumni Directory</h1>
                <p className="text-blue-100 mt-1">
                  Connect with {results.totalResults || 0} talented alumni from various industries and locations
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-4 pb-12">

          {/* Search Bar with Stats */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <SearchBar
                value={filters.search}
                onChange={(query) => setFilters(prev => ({ ...prev, search: query }))}
                onSearch={handleSearch}
              />
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.totalResults || 0}</div>
                  <div className="text-sm text-gray-600">Total Alumni</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {results.data.filter(p => p.willing_to_mentor).length}
                  </div>
                  <div className="text-sm text-gray-600">Available Mentors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {results.data.filter(p => p.is_verified).length}
                  </div>
                  <div className="text-sm text-gray-600">Verified Profiles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {[...new Set(results.data.map(p => p.current_company))].filter(Boolean).length}
                  </div>
                  <div className="text-sm text-gray-600">Companies</div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.companies?.length > 0 ||
            filters.skills?.length > 0 ||
            filters.locations?.length > 0 ||
            filters.roles?.length > 0 ||
            filters.verifiedOnly ||
            filters.yearRange) && (
            <div className="mb-6">
              <ActiveFilters
                filters={filters}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearFilters}
              />
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Filter Sidebar */}
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              <div className="sticky top-4">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                />
              </div>
            </aside>

            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button data-testid="mobile-filter-button" variant="outline" className="w-full">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {(filters.companies?.length || 0) +
                      (filters.skills?.length || 0) +
                      (filters.locations?.length || 0) +
                      (filters.roles?.length || 0) +
                      (filters.verifiedOnly ? 1 : 0) +
                      (filters.yearRange ? 1 : 0) >
                      0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        {(filters.companies?.length || 0) +
                          (filters.skills?.length || 0) +
                          (filters.locations?.length || 0) +
                          (filters.roles?.length || 0) +
                          (filters.verifiedOnly ? 1 : 0) +
                          (filters.yearRange ? 1 : 0)}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      onClearFilters={handleClearFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Controls Bar */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-sm font-medium text-gray-700">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        Loading alumni...
                      </span>
                    ) : (
                      <span data-testid="results-count" className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Showing <strong className="text-blue-600">{results.data.length}</strong> of{' '}
                        <strong className="text-gray-900">{results.totalResults}</strong> alumni
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <SortDropdown value={sortBy} onChange={handleSortChange} />
                    <div className="h-6 w-px bg-gray-300"></div>
                    <ViewToggle view={view} onViewChange={setView} />
                  </div>
                </div>
              </div>

              {/* Results */}
              {loading ? (
                <SkeletonLoader view={view} count={6} />
              ) : results.data.length === 0 ? (
                // Empty State
                <div
                  data-testid="empty-state"
                  className="text-center py-16 px-4 bg-white rounded-lg border-2 border-dashed border-gray-300"
                >
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No alumni found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters or search query
                  </p>
                  <Button onClick={handleClearFilters}>Clear All Filters</Button>
                </div>
              ) : (
                <>
                  {/* Grid View */}
                  {view === 'grid' && (
                    <div
                      data-testid="alumni-grid"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                    >
                      {results.data.map(profile => (
                        <AlumniCard
                          key={profile.id}
                          profile={profile}
                          onViewProfile={handleViewProfile}
                        />
                      ))}
                    </div>
                  )}

                  {/* List View */}
                  {view === 'list' && (
                    <div data-testid="alumni-list" className="space-y-4">
                      {results.data.map(profile => (
                        <AlumniListItem
                          key={profile.id}
                          profile={profile}
                          onViewProfile={handleViewProfile}
                        />
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {results.totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                currentPage > 1 && handlePageChange(currentPage - 1)
                              }
                              className={
                                currentPage === 1
                                  ? 'pointer-events-none opacity-50'
                                  : 'cursor-pointer'
                              }
                            />
                          </PaginationItem>

                          {Array.from({ length: results.totalPages }, (_, i) => i + 1).map(
                            page => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => handlePageChange(page)}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          )}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                currentPage < results.totalPages &&
                                handlePageChange(currentPage + 1)
                              }
                              className={
                                currentPage === results.totalPages
                                  ? 'pointer-events-none opacity-50'
                                  : 'cursor-pointer'
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Profile Modal */}
      <ProfileModal
        profile={selectedProfile}
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default AlumniDirectory;
