import { redirect } from "next/navigation";

// Root → always go to dashboard
// (The dashboard handles first-run detection client-side)
export default function RootPage() {
  redirect("/dashboard");
}
