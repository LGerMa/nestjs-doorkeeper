import * as path from "node:path";
import { detectAdapter, detectDataSourceDir, DetectedAdapter } from "./detector";
import { promptConfig } from "./prompt";
import { generateMigration } from "./migration-generator";

const ADAPTER_LABELS: Record<NonNullable<DetectedAdapter>, string> = {
  typeorm:  "TypeORM",
  prisma:   "Prisma (adapter coming soon)",
  mongoose: "Mongoose (adapter coming soon)",
};

export async function runInit(): Promise<void> {
  console.log("\nnestjs-doorkeeper init\n");

  const cwd = process.cwd();
  const detected = detectAdapter(cwd);

  if (detected) {
    console.log(`✔ Detected adapter: ${ADAPTER_LABELS[detected]}`);
  } else {
    console.warn("⚠  No supported ORM detected. Defaulting to TypeORM.");
  }

  const defaultMigrationsDir = detectDataSourceDir(cwd) ?? path.join(cwd, "src", "migrations");
  const answers = await promptConfig(defaultMigrationsDir);

  console.log();
  console.log(`✔ Access token TTL:     ${answers.accessTokenTtl}`);
  console.log(`✔ Refresh token TTL:    ${answers.refreshTokenTtl}`);
  console.log(`✔ JWT secret env var:   ${answers.jwtSecretEnvVar}`);
  console.log(`✔ Table prefix:         ${answers.tablePrefix}`);
  console.log(`✔ Route prefix:         ${answers.routePrefix}`);
  console.log(`✔ Migrations folder:    ${answers.migrationsDir}`);
  console.log();

  const outputDir = answers.migrationsDir;
  console.log("Generating migration...");
  const filePath = generateMigration({ tablePrefix: answers.tablePrefix, outputDir });
  const relative = path.relative(cwd, filePath);
  console.log(`✔ Created ${relative}\n`);

  printNextSteps(answers.jwtSecretEnvVar, answers.accessTokenTtl, answers.refreshTokenTtl, answers.routePrefix);
}

function printNextSteps(
  jwtEnvVar: string,
  accessTtl: string,
  refreshTtl: string,
  routePrefix: string,
): void {
  console.log("Next steps:");
  console.log("  1. Run your migration:");
  console.log("       npx typeorm migration:run -d src/data-source.ts");
  console.log("  2. Register the module in your AppModule:");
  console.log(`       AuthModule.forRoot({`);
  console.log(`         jwt: {`);
  console.log(`           secret: process.env.${jwtEnvVar},`);
  console.log(`           accessTokenTtl: '${accessTtl}',`);
  console.log(`           refreshTokenTtl: '${refreshTtl}',`);
  console.log(`         },`);
  console.log(`         routePrefix: '${routePrefix}',`);
  console.log(`       })`);
  console.log("  3. Protect your routes with @UseGuards(JwtAuthGuard)");
  console.log("\nReady. 🚀\n");
}
