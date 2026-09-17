import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

// `next-auth/jwt` re-exports the JWT type from `@auth/core/jwt` via `export *`,
// which TypeScript does not always merge with the augmentation above. Augmenting
// the source module directly ensures the callbacks in NextAuth() pick up the fields.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
