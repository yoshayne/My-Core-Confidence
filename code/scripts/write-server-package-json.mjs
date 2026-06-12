// The root package.json declares "type": "module" (needed for Vite config),
// but the compiled server output is CommonJS (tsconfig.server.json).
// Writing a nested package.json next to the compiled output tells Node to
// treat everything under dist/ as CommonJS regardless of the root setting.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, "dist");

mkdirSync(distDir, { recursive: true });
writeFileSync(join(distDir, "package.json"), JSON.stringify({ type: "commonjs" }, null, 2) + "\n");

console.log("Wrote dist/package.json with { type: \"commonjs\" }");
