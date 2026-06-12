const ORDER = ["Core", "Strength", "Cardio", "Mobility"];

function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const ai = ORDER.indexOf(a);
    const bi = ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export default function CategoryChips({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}) {
  const items = ["All", ...sortCategories(categories)];

  return (
    <div className="flex gap-2 overflow-x-auto">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`whitespace-nowrap rounded-pill px-4 py-1.5 text-xs font-semibold ${
            active === item
              ? "bg-blue text-white"
              : "border border-card-border text-text-secondary"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
