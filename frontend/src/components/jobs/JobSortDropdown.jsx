import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

const JobSortDropdown = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2" data-testid="job-sort-dropdown">
      <ArrowUpDown className="w-4 h-4 text-gray-500" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]" data-testid="sort-trigger">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="title">Job Title</SelectItem>
          <SelectItem value="salary">Salary</SelectItem>
          <SelectItem value="applications">Most Applied</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default JobSortDropdown;
