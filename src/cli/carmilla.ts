#!/usr/bin/env node
import { encrypt, decrypt, encryptAsync, decryptAsync, repack, unpack, processAreas } from "../../lib";

function printHelp() {
  console.log(`
Carmilla OpenSSL CLI (no deps)

Usage:
  carmilla encrypt <pass> <text>
  carmilla decrypt <pass> <base64-or-packaged>
  carmilla repack <base64> [jsonMeta]
  carmilla unpack <packaged>
  carmilla areas <pass> <jsonTargets> [jsonMeta]

Examples:
  carmilla encrypt mypass "hello"
  carmilla decrypt mypass <b64>
  carmilla repack <b64> '{"user":"u1"}'
  carmilla unpack <pkg>
  carmilla areas mypass '[{"type":"obj","key":"x","intent":"encrypt","data":"42"}]' '{"run":"r1"}'
`);
}

async function main() {
  const [,, cmd, ...rest] = process.argv;
  try {
    switch (cmd) {
      case "encrypt": {
        const [pass, text] = rest;
        if (!pass || text === undefined) return printHelp();
        const b64 = encrypt(text, pass);
        console.log(b64);
        return;
      }
      case "decrypt": {
        const [pass, input] = rest;
        if (!pass || input === undefined) return printHelp();
        try {
          const txt = decrypt(input, pass);
          console.log(txt);
        } catch {
          const pack = unpack(input);
          const txt = decrypt(pack.data, pass);
          console.log(txt);
        }
        return;
      }
      case "repack": {
        const [b64, metaStr] = rest;
        if (!b64) return printHelp();
        const meta = metaStr ? JSON.parse(metaStr) : {};
        const pkg = repack(b64, meta);
        console.log(pkg);
        return;
      }
      case "unpack": {
        const [packaged] = rest;
        if (!packaged) return printHelp();
        const obj = unpack(packaged);
        console.log(JSON.stringify(obj));
        return;
      }
      case "areas": {
        const [pass, targetsStr, metaStr] = rest;
        if (!pass || !targetsStr) return printHelp();
        const targets = JSON.parse(targetsStr);
        const meta = metaStr ? JSON.parse(metaStr) : {};
        const results = await processAreas(targets, pass, { meta });
        console.log(JSON.stringify(results));
        return;
      }
      default:
        printHelp();
        return;
    }
  } catch (e: any) {
    console.error(e?.message ?? String(e));
    process.exitCode = 1;
  }
}

main();

