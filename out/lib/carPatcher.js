"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPatchesToSource = applyPatchesToSource;
exports.applyPatchesToFile = applyPatchesToFile;
exports.runPatchedJs = runPatchedJs;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const vm_1 = __importDefault(require("vm"));
const MARKER_REGEX = /^\s*Car\(\);\s*$/m;
function applyPatchesToSource(source, patches) {
    const lines = source.split(/\r?\n/);
    let applied = 0;
    let occurrence = 0;
    const isArrayOfStrings = typeof patches[0] === "string";
    const getPatchCode = (idx) => {
        if (isArrayOfStrings) {
            const list = patches;
            return list[applied];
        }
        else {
            const list = patches;
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
function applyPatchesToFile(filePath, patches) {
    const src = fs_1.default.readFileSync(filePath, "utf8");
    return applyPatchesToSource(src, patches);
}
function runPatchedJs(patchedSource, filename = "patched.js", context = {}) {
    const sandbox = { console, require, module, __filename: filename, __dirname: path_1.default.dirname(filename), ...context };
    const script = new vm_1.default.Script(patchedSource, { filename });
    const ctx = vm_1.default.createContext(sandbox);
    return script.runInContext(ctx);
}
