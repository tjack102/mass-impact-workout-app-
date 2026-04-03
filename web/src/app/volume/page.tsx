import { redirect } from "next/navigation";

export default function VolumePage() {
  redirect("/progress?tab=volume");
}
