import { Suspense } from "react";
import { LibraryScreen } from "@/components/screens/library-screen";

export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryScreen />
    </Suspense>
  );
}
