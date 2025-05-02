import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export function auth() {
  return getServerSession(authOptions);
}

export { authOptions }; 