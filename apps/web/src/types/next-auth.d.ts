import { Role } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      sectionId?: string | null;
    };
  }

  interface User {
    role: Role;
    sectionId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    sectionId?: string | null;
  }
}
