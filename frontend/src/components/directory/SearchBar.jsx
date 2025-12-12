import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { directoryService } from '@/services';

const SearchBar = ({ value, onChange, onSearch }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [localValue, setLocalValue] = useState(value || '');
  const debounceTimer = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Get suggestions asynchronously
    if (newValue.trim()) {
      try {
        const newSuggestions = await directoryService.getSearchSuggestions(newValue);
        setSuggestions(newSuggestions || []);
        setShowSuggestions((newSuggestions || []).length > 0);
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    // Debounce the actual search
    debounceTimer.current = setTimeout(() => {
      onChange(newValue);
      if (onSearch) onSearch(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setLocalValue(suggestion);
    onChange(suggestion);
    if (onSearch) onSearch(suggestion);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    if (onSearch) onSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (onSearch) onSearch(localValue);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          data-testid="alumni-search-input"
          type="text"
          placeholder="Search by name, company, skills, or role..."
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="pl-10 pr-10 h-12 text-base"
        />
        {localValue && (
          <Button
            data-testid="clear-search-button"
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              data-testid={`suggestion-${index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;