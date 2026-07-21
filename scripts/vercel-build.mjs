import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function hasEnv(name) {
  return Boolean(process.env[name]);
}

run("npx", ["prisma", "generate"]);

if (hasEnv("DATABASE_URL")) {
  run("npx", ["prisma", "migrate", "deploy"]);

  if (hasEnv("SEED_ADMIN_EMAIL") && hasEnv("SEED_ADMIN_PASSWORD")) {
    run("npm", ["run", "db:seed"]);
  } else {
    console.log("Skipping seed: SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD is missing.");
  }
} else {
  console.log("Skipping database migration: DATABASE_URL is missing.");
}

run("npx", ["next", "build", "--turbopack"]);
