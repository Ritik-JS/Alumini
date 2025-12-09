import { useState, useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { jobService } from '@/services';

const JobFilterSidebar = ({ filters, onFilterChange, onClearAll }) => {
  const [filterOptions, setFilterOptions] = useState({
    companies: [],
    locations: [],
    jobTypes: [],
    skills: [],
  });

  useEffect(() => {
    const loadFilterOptions = async () => {
      const options = await jobService.getFilterOptions();
      setFilterOptions(options);
    };
    loadFilterOptions();
  }, []);

  const handleCheckboxChange = (category, value) => {
    const currentValues = filters[category] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFilterChange({ ...filters, [category]: newValues });
  };

  const jobTypeLabels = {
    'full-time': 'Full-time',
    'part-time': 'Part-time',
    'internship': 'Internship',
    'contract': 'Contract',
  };

  const experienceLevels = [
    '0-1 years',
    '1-3 years',
    '3-5 years',
    '5+ years',
  ];

  return (
    <div className="w-full" data-testid="job-filter-sidebar">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5" />
          <h3 className="font-semibold text-lg">Filters</h3>
        </div>
        {(filters.companies?.length > 0 || filters.locations?.length > 0 || 
          filters.jobTypes?.length > 0 || filters.skills?.length > 0 || 
          filters.experienceLevels?.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-sm"
            data-testid="clear-filters-btn"
          >
            Clear all
          </Button>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-6 pr-4">
          {/* Job Type Filter */}
          <div>
            <h4 className="font-medium mb-3">Job Type</h4>
            <div className="space-y-2">
              {filterOptions.jobTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.jobTypes?.includes(type)}
                    onCheckedChange={() => handleCheckboxChange('jobTypes', type)}
                    data-testid={`filter-jobtype-${type}`}
                  />
                  <Label
                    htmlFor={`type-${type}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {jobTypeLabels[type] || type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Experience Level Filter */}
          <div>
            <h4 className="font-medium mb-3">Experience Level</h4>
            <div className="space-y-2">
              {experienceLevels.map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={`exp-${level}`}
                    checked={filters.experienceLevels?.includes(level)}
                    onCheckedChange={() => handleCheckboxChange('experienceLevels', level)}
                    data-testid={`filter-experience-${level}`}
                  />
                  <Label
                    htmlFor={`exp-${level}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {level}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Location Filter */}
          <div>
            <h4 className="font-medium mb-3">Location</h4>
            <div className="space-y-2">
              {filterOptions.locations.slice(0, 8).map((location) => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox
                    id={`loc-${location}`}
                    checked={filters.locations?.includes(location)}
                    onCheckedChange={() => handleCheckboxChange('locations', location)}
                    data-testid={`filter-location-${location}`}
                  />
                  <Label
                    htmlFor={`loc-${location}`}
                    className="text-sm font-normal cursor-pointer line-clamp-1"
                  >
                    {location}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Company Filter */}
          <div>
            <h4 className="font-medium mb-3">Company</h4>
            <div className="space-y-2">
              {filterOptions.companies.slice(0, 8).map((company) => (
                <div key={company} className="flex items-center space-x-2">
                  <Checkbox
                    id={`comp-${company}`}
                    checked={filters.companies?.includes(company)}
                    onCheckedChange={() => handleCheckboxChange('companies', company)}
                    data-testid={`filter-company-${company}`}
                  />
                  <Label
                    htmlFor={`comp-${company}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {company}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Skills Filter */}
          <div>
            <h4 className="font-medium mb-3">Skills Required</h4>
            <div className="space-y-2">
              {filterOptions.skills.slice(0, 10).map((skill) => (
                <div key={skill} className="flex items-center space-x-2">
                  <Checkbox
                    id={`skill-${skill}`}
                    checked={filters.skills?.includes(skill)}
                    onCheckedChange={() => handleCheckboxChange('skills', skill)}
                    data-testid={`filter-skill-${skill}`}
                  />
                  <Label
                    htmlFor={`skill-${skill}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {skill}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default JobFilterSidebar;
