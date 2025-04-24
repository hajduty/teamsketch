import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";

export const Color = ({ className, onChange }: { className?: string, onChange?: (value: string) => void; }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [color, setColor] = useState("#aabbcc");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
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

  const changeColor = (newColor: string) => {
    setColor(newColor);
    onChange?.(newColor);
  }

  return (
    <>
      <div className={`relative w-full ${className}`} ref={dropdownRef}>
        <div className="flex flex-row items-center justify-between w-full text-white text-xs bg-zinc-950 border border-zinc-600 focus-within:ring-1 focus-within:ring-gray-700">
          <input type="text" className="bg-transparent text-white border-none outline-none px-2 py-1 text-xs w-full" ref={inputRef}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onClick={() => setIsOpen(true)}
            value={color}
          />
          <div className="p-1 border-l border-zinc-600 cursor-pointer flex-shrink-0">
            <span className={`transition-transform flex items-center`} onClick={toggleDropdown}>
              <span className="w-3 h-3 bg-" style={{ backgroundColor: color }} />
            </span>
          </div>
        </div>
        {isOpen && (
          <div className="absolute left-0 mt-1 w-fit text-xs shadow-lg max-h-60 overflow-hidden z-10">
            <HexColorPicker color={color} onChange={changeColor} />
          </div>
        )}
      </div>
    </>
  )
}