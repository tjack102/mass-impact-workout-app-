"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs } from "@/components/tabs";
import { StrengthContent } from "@/components/screens/strength-content";
import { VolumeContent } from "@/components/screens/volume-content";

const TABS = [
  { id: "strength", label: "Strength" },
  { id: "volume", label: "Volume" },
];

export function ProgressScreen() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "volume" ? "volume" : "strength";
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <section className="screen">
      <p className="subtle-label">PROGRESS</p>
      <h1 className="page-title">Progress</h1>
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      {activeTab === "strength" ? <StrengthContent /> : <VolumeContent />}
    </section>
  );
}
