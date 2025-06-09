"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

const presetColors = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
  '#ffc0cb', '#a52a2a', '#808080', '#000080', '#008000'
];

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(color);

  const handleColorSelect = (selectedColor: string) => {
    onChange(selectedColor);
    setCustomColor(selectedColor);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-10 h-10 p-0 border-2"
          style={{ backgroundColor: color }}
          title={label || 'Select color'}
        >
          <span className="sr-only">{label || 'Select color'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <div className="space-y-4">
          {label && <Label className="text-sm font-medium">{label}</Label>}
          
          {/* Preset Colors */}
          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Preset Colors</Label>
            <div className="grid grid-cols-5 gap-2">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => handleColorSelect(presetColor)}
                  title={presetColor}
                />
              ))}
            </div>
          </div>

          {/* Custom Color */}
          <div>
            <Label htmlFor="custom-color" className="text-xs text-gray-600 mb-2 block">
              Custom Color
            </Label>
            <div className="flex space-x-2">
              <Input
                id="custom-color"
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-12 h-8 p-0 border-0"
              />
              <Input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    onChange(e.target.value);
                  }
                }}
                placeholder="#000000"
                className="flex-1 text-xs"
              />
            </div>
          </div>

          {/* Transparent Option */}
          <div>
            <button
              className="w-full h-8 border-2 border-gray-200 hover:border-gray-400 transition-colors rounded bg-white relative overflow-hidden"
              onClick={() => handleColorSelect('transparent')}
              title="Transparent"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-500 to-transparent opacity-50"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700">Transparent</span>
              </div>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}