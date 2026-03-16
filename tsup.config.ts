import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    // root barrel → nestjs-doorkeeper
    index: "src/index.ts",
    // sub-path exports
    "guards/index": "src/guards/index.ts",
    "decorators/index": "src/decorators/index.ts",
    "services/index": "src/services/index.ts",
    "entities/index": "src/entities/index.ts",
    "adapters/index": "src/adapters/index.ts",
  },
  format: ["cjs", "esm"], // ship both CommonJS and ESM
  target: "es2021",
  dts: true, // generate .d.ts type declarations
  sourcemap: true,
  clean: true, // wipe dist/ before each build
  splitting: false,
  treeshake: true,
});
