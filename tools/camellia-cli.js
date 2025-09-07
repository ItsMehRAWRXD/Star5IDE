#!/usr/bin/env node
"use strict";

const path = require("path");
const { spawnSync } = require("child_process");

function run(argv) {
  const target = path.join(__dirname, "carmilla-openssl.js");
  const res = spawnSync(process.execPath, [target, ...argv], { stdio: "inherit" });
  process.exit(res.status || 0);
}

function printHelp() {
  console.log([
    "Camellia CLI (wrapper)",
    "Usage:",
    "  camellia encrypt --pass <pass> [--in file|-] [--out file|-] [--hint <text>] [--cipher camellia-256-cbc]",
    "  camellia decrypt --pass <pass> [--in file|-] [--out file|-] [--cipher camellia-256-cbc]",
    "  camellia repack [--in file|-] [--out file|-] [--meta '{\"hint\":\"...\"}']",
    "  camellia unpack [--in file|-] [--out file|-]",
  ].join("\n"));
}

const argv = process.argv.slice(2);
if (argv.length === 0 || ["-h","--help","help"].includes(argv[0])) {
  printHelp();
  process.exit(0);
}
run(argv);
