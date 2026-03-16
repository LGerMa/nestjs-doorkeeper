import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

export interface CliAnswers {
  accessTokenTtl: string;
  refreshTokenTtl: string;
  jwtSecretEnvVar: string;
  tablePrefix: string;
  routePrefix: string;
}

export async function promptConfig(): Promise<CliAnswers> {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    const ask = (question: string, defaultValue: string): Promise<string> =>
      rl.question(`  ${question} (default: ${defaultValue}): `).then((v) => v.trim() || defaultValue);

    const accessTokenTtl  = await ask("Access token TTL?",       "15m");
    const refreshTokenTtl = await ask("Refresh token TTL?",      "30d");
    const jwtSecretEnvVar = await ask("JWT secret env var name?", "JWT_SECRET");
    const tablePrefix     = await ask("Table prefix?",            "auth");
    const routePrefix     = await ask("Route prefix?",            "auth");

    return { accessTokenTtl, refreshTokenTtl, jwtSecretEnvVar, tablePrefix, routePrefix };
  } finally {
    rl.close();
  }
}
