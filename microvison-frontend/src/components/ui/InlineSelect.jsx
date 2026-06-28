import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

export default function InlineSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  required = false,
  className = '',
  id = ''
}) {
  const [search, setSearch] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        // Reset search to actual value if they click away without selecting
        setSearch(value || '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (opt) => {
    onChange(opt);
    setSearch(opt);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    onChange(val); // Allow free-text editing/custom values
    setIsOpen(true);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} id={id}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          required={required}
          className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-8"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
        >
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-[200px] w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none">
          <div className="max-h-[190px] overflow-y-auto">
            {filteredOptions.map((opt) => (
              <div
                key={opt}
                onClick={() => handleSelect(opt)}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              >
                <span className="font-medium">{opt}</span>
                {value === opt && (
                  <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>
            ))}
            
            {/* If no exact match and they typed something new, show option to use their custom input */}
            {search.trim().length > 0 && !options.some(opt => opt.toLowerCase() === search.trim().toLowerCase()) && (
              <div
                onClick={() => handleSelect(search.trim())}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none text-primary hover:bg-accent font-semibold border-t mt-1 pt-1"
              >
                Use "{search.trim()}"
              </div>
            )}

            {filteredOptions.length === 0 && search.trim().length === 0 && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No options available.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
