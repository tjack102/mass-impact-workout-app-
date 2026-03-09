import { Suspense } from "react";
import { TemplatesScreen } from "@/components/screens/templates-screen";

export default function TemplatesPage() {
  return (
    <Suspense>
      <TemplatesScreen />
    </Suspense>
  );
}
