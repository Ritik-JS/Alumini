import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ActiveFilters = ({ filters, onRemoveFilter, onClearAll }) => {
  const activeFilters = [];

  // Add company filters
  filters.companies?.forEach(company => {
    activeFilters.push({
      type: 'company',
      value: company,
      label: `Company: ${company}`
    });
  });

  // Add skill filters
  filters.skills?.forEach(skill => {
    activeFilters.push({
      type: 'skills',
      value: skill,
      label: `Skill: ${skill}`
    });
  });

  // Add location filters
  filters.locations?.forEach(location => {
    activeFilters.push({
      type: 'locations',
      value: location,
      label: `Location: ${location}`
    });
  });

  // Add role filters
  filters.roles?.forEach(role => {
    activeFilters.push({
      type: 'roles',
      value: role,
      label: `Role: ${role}`
    });
  });

  // Add verified filter
  if (filters.verifiedOnly) {
    activeFilters.push({
      type: 'verifiedOnly',
      value: true,
      label: 'Verified Only'
    });
  }

  // Add year range filter
  if (filters.yearRange) {
    activeFilters.push({
      type: 'yearRange',
      value: filters.yearRange,
      label: `Batch: ${filters.yearRange[0]} - ${filters.yearRange[1]}`
    });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Active Filters:</span>
      {activeFilters.map((filter, index) => (
        <Badge
          key={`${filter.type}-${index}`}
          variant="secondary"
          className="pl-3 pr-1 py-1.5 gap-1"
        >
          <span>{filter.label}</span>
          <button
            data-testid={`remove-filter-${filter.type}-${index}`}
            onClick={() => onRemoveFilter(filter.type, filter.value)}
            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {activeFilters.length > 1 && (
        <Button
          data-testid="clear-all-filters"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 text-xs text-blue-600 hover:text-blue-700"
        >
          Clear All
        </Button>
      )}
    </div>
  );
};

export default ActiveFilters;