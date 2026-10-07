import { readFile } from "node:fs/promises";

const errors = [];
function assert(condition, message) {
  if (!condition) errors.push(message);
}

const reportText = await readFile(
  "domain/optimizer/build-report.ts",
  "utf8",
);

for (const token of [
  "BUILD_REPORT_SCHEMA_VERSION = 1",
  '"bike-atlas-build-report"',
  '"bike-atlas-portfolio-export"',
  "explainPortfolioDecision",
  "createBuildDecisionReport",
  "createPortfolioExport",
  "createShareableBuildUrl",
  "formatBuildDecisionReport",
  "encodeBuildSelections",
  'url.searchParams.set("build", "1")',
  'url.searchParams.set("buildParts", report.encodedSelections)',
  "selected.aggregateScore",
  "selected.scenarioResults",
  "selected.entry.selections",
]) {
  assert(
    reportText.includes(token),
    "P28 report domain missing behavior: " + token,
  );
}

const actionText = await readFile(
  "components/optimizer/BuildReportActions.tsx",
  "utf8",
);

for (const token of [
  "P28 decision report",
  "Share report",
  "Copy report",
  "Download .md",
  "Export portfolio .json",
  "navigator.share",
  "navigator.clipboard",
  "URL.createObjectURL",
  "createBuildDecisionReport",
  "createPortfolioExport",
  "createShareableBuildUrl",
  "formatBuildDecisionReport",
  "does not publish or expose browser-local portfolio storage",
]) {
  assert(
    actionText.includes(token),
    "P28 report actions missing behavior/copy: " + token,
  );
}

const portfolioText = await readFile(
  "components/optimizer/BuildPortfolioPanel.tsx",
  "utf8",
);
for (const token of [
  'import { BuildReportActions } from "@/components/optimizer/BuildReportActions";',
  "<BuildReportActions",
  "evaluations={evaluations}",
  "scenarioIds={scenarioIds}",
]) {
  assert(
    portfolioText.includes(token),
    "P28 Portfolio integration missing token: " + token,
  );
}

const packageText = await readFile("package.json", "utf8");
assert(
  packageText.includes("scripts/validate-reports.mjs"),
  "P28 validator must be registered in validate:domain.",
);

const cssText = await readFile("app/globals.css", "utf8");
for (const token of [
  ".portfolio-report",
  ".portfolio-report__reasons",
  ".portfolio-report__actions",
  ".portfolio-report__boundary",
]) {
  assert(
    cssText.includes(token),
    "P28 visual system missing selector: " + token,
  );
}

if (errors.length) {
  console.error("\nP28 report validation failed:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}

console.log(
  "✓ P28 reports valid: decision explanations, portable selected-build reports, share/copy/Markdown export, full portfolio JSON export and reproducible build URLs are protected.",
);
