#!/usr/bin/env node
"use strict";

const [, , command] = process.argv;

if (command !== "init") {
  console.error(`Unknown command: "${command ?? ""}"`);
  console.error("Usage: npx nestjs-doorkeeper init");
  process.exit(1);
}

require("../dist/cli/index.js")
  .runInit()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
