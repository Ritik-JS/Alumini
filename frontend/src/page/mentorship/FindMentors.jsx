import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, Sparkles } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import MentorCard from '@/components/mentorship/MentorCard';
import RequestMentorshipModal from '@/components/mentorship/RequestMentorshipModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { mentorshipService } from '@/services';
import { toast } from 'sonner';

const FindMentors = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    expertise: [],
    minRating: 0,
    availableOnly: false,
  });
  const [sortBy, setSortBy] = useState('rating');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [expertiseAreas, setExpertiseAreas] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [paginatedResults, setPaginatedResults] = useState({ data: [], totalPages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpertiseAreas();
  }, []);

  useEffect(() => {
    loadMentors();
  }, [searchQuery, filters, sortBy, currentPage]);

  const loadExpertiseAreas = async () => {
    try {
      const response = await mentorshipService.getUniqueExpertiseAreas();
      if (response.success) {
        setExpertiseAreas(response.data);
      }
    } catch (error) {
      console.error('Error loading expertise areas:', error);
    }
  };

  const loadMentors = async () => {
    setLoading(true);
    try {
      const response = await mentorshipService.filterMentors({
        ...filters,
        search: searchQuery,
        sortBy,
        page: currentPage,
        pageSize: 12
      });
      
      if (response.success) {
        setFilteredMentors(response.data.mentors || []);
        setPaginatedResults({
          data: response.data.mentors || [],
          totalPages: response.data.totalPages || 1
        });
      } else {
        toast.error('Failed to load mentors');
      }
    } catch (error) {
      toast.error('Error loading mentors');
    } finally {
      setLoading(false);
    }
  };

  const handleExpertiseToggle = (expertise) => {
    setFilters(prev => ({
      ...prev,
      expertise: prev.expertise.includes(expertise)
        ? prev.expertise.filter(e => e !== expertise)
        : [...prev.expertise, expertise],
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      expertise: [],
      minRating: 0,
      availableOnly: false,
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleRequestMentorship = (mentor) => {
    setSelectedMentor(mentor);
    setShowRequestModal(true);
  };

  const hasActiveFilters = filters.expertise.length > 0 || filters.minRating > 0 || filters.availableOnly || searchQuery;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-medium text-violet-900">Find Your Perfect Mentor</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-3" data-testid="page-title">
              Find Mentors
            </h1>
            <p className="text-lg text-gray-600">
              Connect with experienced alumni who can guide your career journey
            </p>
          </div>

          {/* Search and Sort */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, expertise, or role..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-12 h-12 border-2 border-gray-200 focus:border-violet-400 rounded-xl shadow-sm bg-white"
                  data-testid="search-input"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 bg-white shadow-sm font-medium text-gray-700"
                data-testid="sort-select"
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="availability">Most Available</option>
                <option value="name">Name (A-Z)</option>
              </select>

              {/* Filter Toggle */}
              <Button
                variant={showFilters ? 'default' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
                className={`h-12 px-6 rounded-xl border-2 shadow-sm ${showFilters ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600' : 'border-gray-200 hover:border-violet-400'}`}
                data-testid="filter-toggle-btn"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge className="ml-2 bg-white text-violet-600 hover:bg-white">
                    {filters.expertise.length + (filters.minRating > 0 ? 1 : 0) + (filters.availableOnly ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mb-6 p-6 bg-white/80 backdrop-blur-sm border-2 border-violet-200 rounded-2xl shadow-lg" data-testid="filter-panel">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                    data-testid="clear-filters-btn"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Expertise Filter */}
              <div className="mb-6">
                <Label className="mb-3 block text-base font-semibold text-gray-700">Expertise Areas</Label>
                <div className="flex flex-wrap gap-2">
                  {expertiseAreas.map((expertise) => (
                    <Badge
                      key={expertise}
                      variant={filters.expertise.includes(expertise) ? 'default' : 'outline'}
                      className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                        filters.expertise.includes(expertise)
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 shadow-md'
                          : 'border-2 border-gray-300 hover:border-violet-400 text-gray-700'
                      }`}
                      onClick={() => handleExpertiseToggle(expertise)}
                      data-testid={`expertise-filter-${expertise.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      {expertise}
                      {filters.expertise.includes(expertise) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <Label className="mb-3 block text-base font-semibold text-gray-700">Minimum Rating</Label>
                <div className="flex gap-3">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <Button
                      key={rating}
                      variant={filters.minRating === rating ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, minRating: rating }));
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        filters.minRating === rating
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
                          : 'border-2 border-gray-300 hover:border-violet-400'
                      }`}
                      data-testid={`rating-filter-${rating}`}
                    >
                      {rating === 0 ? 'Any' : `${rating}+ ⭐`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Availability Filter */}
              <div>
                <Label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.availableOnly}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, availableOnly: e.target.checked }));
                      setCurrentPage(1);
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    data-testid="available-only-checkbox"
                  />
                  <span className="text-base font-medium text-gray-700">Show only available mentors</span>
                </Label>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mb-6 flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-600">Active filters:</span>
              {filters.expertise.map((exp) => (
                <Badge key={exp} className="gap-2 px-3 py-1 bg-violet-100 text-violet-700 border border-violet-300">
                  {exp}
                  <button
                    onClick={() => handleExpertiseToggle(exp)}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.minRating > 0 && (
                <Badge className="gap-2 px-3 py-1 bg-violet-100 text-violet-700 border border-violet-300">
                  {filters.minRating}+ Rating
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, minRating: 0 }))}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.availableOnly && (
                <Badge className="gap-2 px-3 py-1 bg-violet-100 text-violet-700 border border-violet-300">
                  Available Only
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, availableOnly: false }))}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-base font-medium text-gray-700" data-testid="results-count">
              Showing {paginatedResults.data.length} of {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Mentor Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : paginatedResults.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedResults.data.map((mentor) => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  onRequestMentorship={handleRequestMentorship}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border-2 border-violet-200" data-testid="no-results">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-white" />
              </div>
              <p className="text-xl font-semibold text-gray-900 mb-2">No mentors found</p>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filters
              </p>
              {hasActiveFilters && (
                <Button onClick={handleClearFilters} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          {/* Pagination */}
          {paginatedResults.totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-6 border-2 border-gray-300 hover:border-violet-400 rounded-xl"
                data-testid="prev-page-btn"
              >
                Previous
              </Button>
              {Array.from({ length: paginatedResults.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 rounded-xl transition-all ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                      : 'border-2 border-gray-300 hover:border-violet-400'
                  }`}
                  data-testid={`page-${page}-btn`}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(paginatedResults.totalPages, prev + 1))}
                disabled={currentPage === paginatedResults.totalPages}
                className="px-6 border-2 border-gray-300 hover:border-violet-400 rounded-xl"
                data-testid="next-page-btn"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Request Mentorship Modal */}
      {showRequestModal && selectedMentor && (
        <RequestMentorshipModal
          mentor={selectedMentor}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedMentor(null);
          }}
          onSuccess={() => {
            // Optionally refresh data or show success message
          }}
        />
      )}
    </MainLayout>
  );
};

export default FindMentors;