import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { directoryService } from '@/services';

const FilterSection = ({ title, isOpen, onToggle, children }) => (
  <div className="border-b border-gray-200 pb-4">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-2 text-left"
    >
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {isOpen ? (
        <ChevronUp className="h-4 w-4 text-gray-500" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-500" />
      )}
    </button>
    {isOpen && <div className="mt-3 space-y-2">{children}</div>}
  </div>
);

const FilterSidebar = ({ filters, onFilterChange, onClearFilters }) => {
  const [openSections, setOpenSections] = useState({
    company: true,
    skills: true,
    location: true,
    batch: true,
    role: true,
    verified: true
  });

  // State for filter options fetched from async service calls
  const [companies, setCompanies] = useState([]);
  const [skills, setSkills] = useState([]);
  const [locations, setLocations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [batchYearRange, setBatchYearRange] = useState([2015, 2024]);
  const [loading, setLoading] = useState(true);

  // Fetch filter options on component mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoading(true);
      try {
        const [companiesData, skillsData, locationsData, rolesData, yearRange] = 
          await Promise.all([
            directoryService.getUniqueCompanies(),
            directoryService.getUniqueSkills(),
            directoryService.getUniqueLocations(),
            directoryService.getUniqueRoles(),
            directoryService.getBatchYearRange()
          ]);
        
        setCompanies(companiesData || []);
        setSkills(skillsData || []);
        setLocations(locationsData || []);
        setRoles(rolesData || []);
        setBatchYearRange(yearRange || [2015, 2024]);
      } catch (error) {
        console.error('Error loading filter options:', error);
        // Set defaults on error
        setCompanies([]);
        setSkills([]);
        setLocations([]);
        setRoles([]);
        setBatchYearRange([2015, 2024]);
      } finally {
        setLoading(false);
      }
    };
    
    loadFilterOptions();
  }, []); // Load once on mount

  const [minYear, maxYear] = batchYearRange;

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCompanyChange = (company, checked) => {
    const updated = checked
      ? [...(filters.companies || []), company]
      : (filters.companies || []).filter(c => c !== company);
    onFilterChange({ companies: updated });
  };

  const handleSkillChange = (skill, checked) => {
    const updated = checked
      ? [...(filters.skills || []), skill]
      : (filters.skills || []).filter(s => s !== skill);
    onFilterChange({ skills: updated });
  };

  const handleLocationChange = (location, checked) => {
    const updated = checked
      ? [...(filters.locations || []), location]
      : (filters.locations || []).filter(l => l !== location);
    onFilterChange({ locations: updated });
  };

  const handleRoleChange = (role, checked) => {
    const updated = checked
      ? [...(filters.roles || []), role]
      : (filters.roles || []).filter(r => r !== role);
    onFilterChange({ roles: updated });
  };

  const handleYearRangeChange = (values) => {
    onFilterChange({ yearRange: values });
  };

  const handleVerifiedToggle = (checked) => {
    onFilterChange({ verifiedOnly: checked });
  };

  const activeFiltersCount = (
    (filters.companies?.length || 0) +
    (filters.skills?.length || 0) +
    (filters.locations?.length || 0) +
    (filters.roles?.length || 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.yearRange ? 1 : 0)
  );

  // Show loading state while fetching filter options
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        {activeFiltersCount > 0 && (
          <Button
            data-testid="clear-filters-button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-blue-600 hover:text-blue-700"
          >
            Clear All ({activeFiltersCount})
          </Button>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-240px)]">
        <div className="space-y-4 pr-4">
          {/* Verified Only Toggle */}
          <FilterSection
            title="Verified Only"
            isOpen={openSections.verified}
            onToggle={() => toggleSection('verified')}
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="verified-toggle" className="text-sm font-normal">
                Show only verified alumni
              </Label>
              <Switch
                id="verified-toggle"
                data-testid="verified-toggle"
                checked={filters.verifiedOnly || false}
                onCheckedChange={handleVerifiedToggle}
              />
            </div>
          </FilterSection>

          {/* Company Filter */}
          <FilterSection
            title="Company"
            isOpen={openSections.company}
            onToggle={() => toggleSection('company')}
          >
            {companies.length === 0 ? (
              <p className="text-sm text-gray-500">No companies available</p>
            ) : (
              companies.map(company => (
                <div key={company} className="flex items-center space-x-2">
                  <Checkbox
                    id={`company-${company}`}
                    data-testid={`company-checkbox-${company}`}
                    checked={(filters.companies || []).includes(company)}
                    onCheckedChange={(checked) => handleCompanyChange(company, checked)}
                  />
                  <label
                    htmlFor={`company-${company}`}
                    className="text-sm text-gray-700 cursor-pointer flex-1"
                  >
                    {company}
                  </label>
                </div>
              ))
            )}
          </FilterSection>

          {/* Skills Filter */}
          <FilterSection
            title="Skills"
            isOpen={openSections.skills}
            onToggle={() => toggleSection('skills')}
          >
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {skills.length === 0 ? (
                <p className="text-sm text-gray-500">No skills available</p>
              ) : (
                skills.slice(0, 15).map(skill => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={`skill-${skill}`}
                      data-testid={`skill-checkbox-${skill}`}
                      checked={(filters.skills || []).includes(skill)}
                      onCheckedChange={(checked) => handleSkillChange(skill, checked)}
                    />
                    <label
                      htmlFor={`skill-${skill}`}
                      className="text-sm text-gray-700 cursor-pointer flex-1"
                    >
                      {skill}
                    </label>
                  </div>
                ))
              )}
            </div>
          </FilterSection>

          {/* Location Filter */}
          <FilterSection
            title="Location"
            isOpen={openSections.location}
            onToggle={() => toggleSection('location')}
          >
            {locations.length === 0 ? (
              <p className="text-sm text-gray-500">No locations available</p>
            ) : (
              locations.map(location => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox
                    id={`location-${location}`}
                    data-testid={`location-checkbox-${location}`}
                    checked={(filters.locations || []).includes(location)}
                    onCheckedChange={(checked) => handleLocationChange(location, checked)}
                  />
                  <label
                    htmlFor={`location-${location}`}
                    className="text-sm text-gray-700 cursor-pointer flex-1"
                  >
                    {location}
                  </label>
                </div>
              ))
            )}
          </FilterSection>

          {/* Batch Year Range */}
          <FilterSection
            title="Batch Year"
            isOpen={openSections.batch}
            onToggle={() => toggleSection('batch')}
          >
            <div className="space-y-4">
              <Slider
                data-testid="batch-year-slider"
                min={minYear}
                max={maxYear}
                step={1}
                value={filters.yearRange || [minYear, maxYear]}
                onValueChange={handleYearRangeChange}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{filters.yearRange?.[0] || minYear}</span>
                <span>{filters.yearRange?.[1] || maxYear}</span>
              </div>
            </div>
          </FilterSection>

          {/* Role Filter */}
          <FilterSection
            title="Job Role"
            isOpen={openSections.role}
            onToggle={() => toggleSection('role')}
          >
            {roles.length === 0 ? (
              <p className="text-sm text-gray-500">No roles available</p>
            ) : (
              roles.map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role}`}
                    data-testid={`role-checkbox-${role}`}
                    checked={(filters.roles || []).includes(role)}
                    onCheckedChange={(checked) => handleRoleChange(role, checked)}
                  />
                  <label
                    htmlFor={`role-${role}`}
                    className="text-sm text-gray-700 cursor-pointer flex-1"
                  >
                    {role}
                  </label>
                </div>
              ))
            )}
          </FilterSection>
        </div>
      </ScrollArea>
    </div>
  );
};

export default FilterSidebar;