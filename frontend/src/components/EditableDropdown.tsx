import { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

interface EditableDropdownProps {
  options?: string[];
  placeholder?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export default function EditableDropdown({
  options = [],
  placeholder = "Select or enter an option",
  onChange,
  className = ""
}: EditableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (option: string) => {
    setInputValue(option);
    setIsOpen(false);
    onChange?.(option);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') setIsOpen(false);
    if (e.key === 'ArrowDown') setIsOpen(true);
    if (e.key === 'Escape') setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div className="flex flex-row items-center justify-between w-full text-white text-xs bg-zinc-950 border border-zinc-600 focus-within:ring-1 focus-within:ring-gray-700">
        <input
          ref={inputRef}
          type="text"
          className="bg-transparent text-white border-none outline-none px-2 py-1 text-xs w-full"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={() => setIsOpen(true)}
        />
        <div className="p-1 border-l border-zinc-600 cursor-pointer flex-shrink-0" onClick={toggleDropdown}>
          <span className={`transition-transform flex items-center ${isOpen ? 'rotate-180' : ''}`}>
            <Icon iconName="arrow_downward" fontSize="11px" color="white" />
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-full text-xs bg-zinc-900 border border-gray-600 shadow-lg max-h-60 overflow-auto z-10">
          {options.length > 0 ? (
            <ul>
              {options.map((option, index) => (
                <li
                  key={index}
                  className="px-4 py-2 text-white hover:bg-gray-800 cursor-pointer"
                  onClick={() => handleOptionClick(option)}
                >
                  {option}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-2 text-gray-400">No options available</div>
          )}
        </div>
      )}
    </div>
  );
}