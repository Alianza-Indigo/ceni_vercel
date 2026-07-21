import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

declare module "next-auth" {
  interface User {
    role: Role;
    orgId: string | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      role: Role;
      orgId: string | null;
    };
  }
}

const credentialsSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(200),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/entrar" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const ip =
          request?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown";
        if (!checkRateLimit(`login:${ip}`)) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const valid = await verify(user.passwordHash, parsed.data.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.orgId = user.orgId;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.orgId = (token.orgId as string | null) ?? null;
      return session;
    },
  },
});

/** Requires an authenticated ORG user; throws otherwise (use in server actions). */
export async function requireOrgSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORG" || !session.user.orgId) {
    throw new Error("No autorizado");
  }
  return session as typeof session & { user: { orgId: string } };
}

/** Requires an authenticated ADMIN user; throws otherwise. */
export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }
  return session;
}
