import { Suspense } from "react";
import { ProgressScreen } from "@/components/screens/progress-screen";

export default function ProgressPage() {
  return (
    <Suspense>
      <ProgressScreen />
    </Suspense>
  );
}
