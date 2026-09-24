import { spawnSync } from "node:child_process";
import process from "node:process";

const threshold = 95;
const projects = [
  { name: "docs-site", args: ["--project", "apps/docs-site"] },
  { name: "frontend", args: ["--project", "frontend"] },
  { name: "server", args: ["--project", "server"] },
  { name: "shared", args: ["--", "packages/shared/index.ts"] },
];

let correctCount = 0;
let totalCount = 0;
let failed = false;

for (const project of projects) {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "type-coverage",
      "--detail",
      "--strict",
      "--json-output",
      "--ignore-catch",
      "--ignore-nested",
      "--ignore-as-assertion",
      "--ignore-type-assertion",
      "--ignore-non-null-assertion",
      "--ignore-object",
      "--ignore-empty-type",
      ...project.args,
    ],
    { encoding: "utf8" },
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    failed = true;
    continue;
  }

  const report = JSON.parse(result.stdout);
  correctCount += report.correctCount;
  totalCount += report.totalCount;
  console.log(`${project.name}: ${report.percentString}%`);
}

const percent = totalCount === 0 ? 0 : (correctCount / totalCount) * 100;
const formattedPercent = percent.toFixed(2);
console.log(`Type coverage: ${formattedPercent}% (minimum: ${threshold}%)`);
console.log(`TYPE_COVERAGE_PERCENT=${formattedPercent}`);

if (failed || percent < threshold) {
  process.exitCode = 1;
}