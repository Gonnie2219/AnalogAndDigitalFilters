"use client";

interface TabBarProps {
  tabs: string[];
  active: number;
  onChange: (index: number) => void;
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div className="flex border-b border-[var(--border)]">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          onClick={() => onChange(i)}
          className={`px-4 py-2 text-sm font-medium transition-colors
            ${
              i === active
                ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
