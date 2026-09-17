import { auth } from "@/lib/auth/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autenticado.");
  }
  return session.user;
}
