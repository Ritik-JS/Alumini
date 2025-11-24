import { ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const sortOptions = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'recent', label: 'Recently Updated' },
  { value: 'experience', label: 'Most Experienced' },
  { value: 'batch', label: 'Batch Year (Recent First)' },
];

const SortDropdown = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-gray-500" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger data-testid="sort-dropdown" className="w-[200px]">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map(option => (
            <SelectItem
              key={option.value}
              value={option.value}
              data-testid={`sort-option-${option.value}`}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SortDropdown;