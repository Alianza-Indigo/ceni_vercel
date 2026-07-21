import { PrismaClient } from "@prisma/client";

/**
 * AuditLog is append-only: the client exposed to the app refuses any
 * mutation of existing rows at the ORM layer.
 */
function buildClient() {
  return new PrismaClient().$extends({
    query: {
      auditLog: {
        update: () => {
          throw new Error("AuditLog is append-only: update is not allowed");
        },
        updateMany: () => {
          throw new Error("AuditLog is append-only: updateMany is not allowed");
        },
        delete: () => {
          throw new Error("AuditLog is append-only: delete is not allowed");
        },
        deleteMany: () => {
          throw new Error("AuditLog is append-only: deleteMany is not allowed");
        },
        upsert: () => {
          throw new Error("AuditLog is append-only: upsert is not allowed");
        },
      },
    },
  });
}

type ExtendedClient = ReturnType<typeof buildClient>;

const globalForPrisma = globalThis as unknown as { prisma?: ExtendedClient };

export const prisma: ExtendedClient = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
