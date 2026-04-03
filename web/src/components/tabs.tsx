"use client";

type TabItem = {
  id: string;
  label: string;
};

type TabsProps = {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
};

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="tab-bar" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          className={`tab-item${active === tab.id ? " tab-active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
