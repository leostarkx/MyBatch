import React from "react";
import { CheckCircle } from "lucide-react";
import { ThemeColor } from "../types";

export interface ThemeSelectorProps {
  currentTheme: ThemeColor;
  onChange: (t: ThemeColor) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onChange }) => {
  const themes: { id: ThemeColor; color: string; label: string }[] = [
    { id: "blue", color: "37 99 235", label: "أزرق" },
    { id: "emerald", color: "16 185 129", label: "أخضر" },
    { id: "violet", color: "139 92 246", label: "بنفسجي" },
    { id: "rose", color: "244 63 94", label: "وردي" },
    { id: "amber", color: "245 158 11", label: "ذهبي" },
  ];

  return (
    <div className="flex gap-3 justify-center md:justify-start">
      {themes.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${
            currentTheme === t.id ? "border-gray-600 scale-110" : "border-transparent"
          }`}
          style={{ backgroundColor: `rgb(${t.color})` }}
          aria-label={t.label}
        >
          {currentTheme === t.id && (
            <CheckCircle size={14} className="text-white" />
          )}
        </button>
      ))}
    </div>
  );
};
