"use client";

import { useMemo, useState } from "react";
import {
  createBuildDecisionReport,
  createPortfolioExport,
  createShareableBuildUrl,
  explainPortfolioDecision,
  formatBuildDecisionReport,
} from "@/domain/optimizer/build-report";
import type {
  PortfolioEvaluation,
  PortfolioScenarioId,
} from "@/engine/optimizer/portfolio-types";

type Props = {
  selected: PortfolioEvaluation;
  evaluations: readonly PortfolioEvaluation[];
  scenarioIds: readonly PortfolioScenarioId[];
};

function safeFileName(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "bike-build"
  );
}

function downloadText(
  fileName: string,
  mimeType: string,
  content: string,
) {
  const blob = new Blob([content], { type: mimeType });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function BuildReportActions({
  selected,
  evaluations,
  scenarioIds,
}: Props) {
  const [notice, setNotice] = useState("");
  const explanation = useMemo(
    () => explainPortfolioDecision(selected, evaluations),
    [evaluations, selected],
  );

  function currentReport() {
    return createBuildDecisionReport(
      selected,
      evaluations,
      scenarioIds,
      new Date().toISOString(),
    );
  }

  async function handleCopy() {
    const report = currentReport();
    const shareUrl = createShareableBuildUrl(
      window.location.href,
      report,
    );
    await copyText(
      formatBuildDecisionReport(report) +
        "\n\nInspect this build in Bike Atlas: " +
        shareUrl,
    );
    setNotice("Report copied.");
  }

  async function handleShare() {
    const report = currentReport();
    const shareUrl = createShareableBuildUrl(
      window.location.href,
      report,
    );
    const text = formatBuildDecisionReport(report);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bike Atlas — ${report.name}`,
          text,
          url: shareUrl,
        });
        setNotice("Share sheet opened.");
        return;
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }
      }
    }

    await copyText(text + "\n\nInspect this build: " + shareUrl);
    setNotice("Sharing is unavailable here, so the report was copied.");
  }

  function handleMarkdownDownload() {
    const report = currentReport();
    downloadText(
      safeFileName(report.name) + "-bike-atlas-report.md",
      "text/markdown;charset=utf-8",
      formatBuildDecisionReport(report),
    );
    setNotice("Markdown report exported.");
  }

  function handlePortfolioExport() {
    const generatedAt = new Date().toISOString();
    const bundle = createPortfolioExport(
      evaluations,
      scenarioIds,
      generatedAt,
    );
    downloadText(
      safeFileName(selected.entry.bikeId) +
        "-bike-atlas-portfolio.json",
      "application/json;charset=utf-8",
      JSON.stringify(bundle, null, 2) + "\n",
    );
    setNotice(
      `Exported ${bundle.builds.length} evaluated build${
        bundle.builds.length === 1 ? "" : "s"
      }.`,
    );
  }

  return (
    <section className="portfolio-report">
      <div className="portfolio-report__head">
        <div>
          <span>P28 decision report</span>
          <strong>
            Explain the choice, then take the evidence with you.
          </strong>
        </div>
        <b>
          #{explanation.rank}/{explanation.totalCandidates}
        </b>
      </div>

      <p className="portfolio-report__summary">
        {explanation.summary}
      </p>

      <div className="portfolio-report__reasons">
        <article>
          <span>Why choose it</span>
          {explanation.strengths.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </article>
        <article>
          <span>Trade-offs</span>
          {(explanation.tradeoffs.length
            ? explanation.tradeoffs
            : ["No additional trade-off note for this scenario mix."]
          ).map((item) => (
            <p key={item}>{item}</p>
          ))}
        </article>
      </div>

      <div className="portfolio-report__actions">
        <button type="button" onClick={handleShare}>
          Share report
        </button>
        <button type="button" onClick={handleCopy}>
          Copy report
        </button>
        <button type="button" onClick={handleMarkdownDownload}>
          Download .md
        </button>
        <button type="button" onClick={handlePortfolioExport}>
          Export portfolio .json
        </button>
      </div>

      {notice && (
        <p className="portfolio-report__notice" role="status">
          {notice}
        </p>
      )}

      <small className="portfolio-report__boundary">
        Reports are regenerated from the current P27 evaluation state.
        Sharing exports the chosen build and a reproducible Build Lab URL;
        it does not publish or expose browser-local portfolio storage.
      </small>
    </section>
  );
}
