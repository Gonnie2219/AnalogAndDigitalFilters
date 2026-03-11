"use client";
import { FilterSection } from "@/lib/circuit/types";
import RCCircuit from "./RCCircuit";
import SallenKeyCircuit from "./SallenKeyCircuit";

interface CircuitCascadeProps {
  sections: FilterSection[];
  onUpdateSection: (index: number, updated: FilterSection) => void;
}

export default function CircuitCascade({ sections, onUpdateSection }: CircuitCascadeProps) {
  if (sections.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">No sections to display</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text)]">
        Cascade Implementation ({sections.length} stage{sections.length > 1 ? "s" : ""})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, i) =>
          section.type === "first-order" ? (
            <RCCircuit
              key={i}
              section={section}
              index={i}
              onUpdate={(updated) => onUpdateSection(i, updated)}
            />
          ) : (
            <SallenKeyCircuit
              key={i}
              section={section}
              index={i}
              onUpdate={(updated) => onUpdateSection(i, updated)}
            />
          )
        )}
      </div>
    </div>
  );
}
