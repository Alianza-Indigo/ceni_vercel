import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

try {
  process.loadEnvFile();
} catch {
  // Environment variables may be injected by Vercel.
}

const prisma = new PrismaClient();

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;

if (!email || !password) {
  console.log("Skipping admin password update: SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD is missing.");
  process.exit(0);
}

try {
  const passwordHash = await hash(password);
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash, role: "ADMIN" },
    select: { email: true },
  });

  console.log(`Admin password updated for ${user.email}.`);
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
