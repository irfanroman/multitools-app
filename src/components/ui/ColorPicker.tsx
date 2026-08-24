'use client';

import React from 'react';

interface ColorPickerProps {
  colors: string[];
  selected: string;
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ colors, selected, onChange }) => {
  return (
    <div className="flex gap-2 flex-wrap pt-1">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`color-swatch ${selected === c ? 'color-swatch-active' : ''}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
};
