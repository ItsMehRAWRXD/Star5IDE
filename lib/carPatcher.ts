import fs from "fs";
import path from "path";
import vm from "vm";

export type PatchPoint = {
  index: number; // occurrence number (0-based)
  code: string; // code to inject at this Car(); marker
};

export type PatchResult = {
  original: string;
  patched: string;
  applied: number;
};

const MARKER_REGEX = /^\s*Car\(\);\s*$/m;

export function applyPatchesToSource(source: string, patches: string[] | PatchPoint[]): PatchResult {
  const lines = source.split(/\r?\n/);
  let applied = 0;
  let occurrence = 0;

  const isArrayOfStrings = typeof (patches as any)[0] === "string";
  const getPatchCode = (idx: number): string | undefined => {
    if (isArrayOfStrings) {
      const list = patches as string[];
      return list[applied];
    } else {
      const list = patches as PatchPoint[];
      const p = list.find(p => p.index === idx);
      return p?.code;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    if (MARKER_REGEX.test(lines[i])) {
      const code = getPatchCode(occurrence);
      if (code !== undefined) {
        lines[i] = code;
        applied++;
      }
      occurrence++;
    }
  }

  const patched = lines.join("\n");
  return { original: source, patched, applied };
}

export function applyPatchesToFile(filePath: string, patches: string[] | PatchPoint[]): PatchResult {
  const src = fs.readFileSync(filePath, "utf8");
  return applyPatchesToSource(src, patches);
}

export function runPatchedJs(patchedSource: string, filename = "patched.js", context: Record<string, any> = {}) {
  const sandbox = { console, require, module, __filename: filename, __dirname: path.dirname(filename), ...context };
  const script = new vm.Script(patchedSource, { filename });
  const ctx = vm.createContext(sandbox);
  return script.runInContext(ctx);
}

