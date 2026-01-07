import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionJwt } from "@/lib/stytch";

async function getSession() {
  const cookieStore = await cookies();
  const sessionJwt = cookieStore.get("stytch_session_jwt")?.value;

  if (!sessionJwt) {
    return null;
  }

  try {
    return await verifySessionJwt(sessionJwt);
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    // User is authenticated, redirect to dashboard
    redirect("/dashboard");
  }

  // User is not authenticated, redirect to login
  redirect("/login");
}
