'use client';

interface Props<T extends string> {
  tabs: { id: T; label: string; badge?: number }[];
  active: T;
  onChange: (id: T) => void;
}

/** ניווט טאבים. נשאר דביק בראש כדי שלא יילך לאיבוד בגלילה ארוכה. */
export default function Tabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <nav className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className="tab-btn"
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="tab-badge">{tab.badge}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
