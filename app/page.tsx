import { redirect } from "next/navigation";

export default async function HomePage() {
  // Always redirect to login page
  redirect("/login");
}
