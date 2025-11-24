import { Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ViewToggle = ({ view, onViewChange }) => {
  return (
    <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
      <Button
        data-testid="grid-view-button"
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className="h-8 w-8 p-0"
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button
        data-testid="list-view-button"
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ViewToggle;