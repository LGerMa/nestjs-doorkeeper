import * as fs from "node:fs";
import * as path from "node:path";

export type DetectedAdapter = "typeorm" | "prisma" | "mongoose" | null;

/**
 * Walk up to 3 levels under `cwd/src` looking for a file named `data-source.ts`.
 * Returns the directory containing it (suitable as a sibling migrations folder),
 * or null if not found.
 */
export function detectDataSourceDir(cwd: string = process.cwd()): string | null {
  const srcRoot = path.join(cwd, "src");
  if (!fs.existsSync(srcRoot)) return null;

  const candidates = [
    srcRoot,
    ...fs.readdirSync(srcRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => path.join(srcRoot, e.name)),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "data-source.ts"))) {
      return path.join(dir, "migrations");
    }
  }

  return null;
}

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
