import * as fs from "node:fs";
import * as path from "node:path";

export type DetectedAdapter = "typeorm" | "prisma" | "mongoose" | null;

export function detectAdapter(cwd: string = process.cwd()): DetectedAdapter {
  const pkgPath = path.join(cwd, "package.json");

  if (!fs.existsSync(pkgPath)) return null;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  if ("typeorm" in deps) return "typeorm";
  if ("@prisma/client" in deps || "prisma" in deps) return "prisma";
  if ("mongoose" in deps) return "mongoose";

  return null;
}
