import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const JobSearchBar = ({ value, onChange, placeholder = "Search jobs by title or company..." }) => {
  return (
    <div className="relative w-full" data-testid="job-search-bar">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 w-full"
        data-testid="job-search-input"
      />
    </div>
  );
};

export default JobSearchBar;
