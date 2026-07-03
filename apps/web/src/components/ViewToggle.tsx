import { LayoutGrid, List } from "lucide-react";

type ViewOption<T extends string> = {
  value: T;
  label: string;
  icon: "grid" | "list";
};

export function ViewToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: ViewOption<T>[];
}) {
  return (
    <div className="view-toggle" role="group" aria-label="View mode">
      {options.map((opt) => {
        const Icon = opt.icon === "grid" ? LayoutGrid : List;
        return (
          <button
            key={opt.value}
            type="button"
            className={`view-toggle-btn ${value === opt.value ? "on" : ""}`}
            aria-label={opt.label}
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            <Icon size={17} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
