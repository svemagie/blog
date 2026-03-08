#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const UPSTREAM_REPO = "rmdes/indiekit-eleventy-theme";
const DEFAULT_REF = "main";

const targets = [
  {
    name: "recent-posts",
    upstreamPath: "_includes/components/widgets/recent-posts.njk",
    localPath: "_includes/components/widgets/recent-posts.njk",
    mirrorPath: "theme/_includes/components/widgets/recent-posts.njk",
  },
  {
    name: "recent-posts-blog",
    upstreamPath: "_includes/components/widgets/recent-posts-blog.njk",
    localPath: "_includes/components/widgets/recent-posts-blog.njk",
    mirrorPath: "theme/_includes/components/widgets/recent-posts-blog.njk",
  },
];

function printHelp() {
  console.log(`Usage: node scripts/check-upstream-widget-drift.mjs [options]\n\nOptions:\n  --ref=<git-ref>   Upstream branch/tag/sha to compare against (default: ${DEFAULT_REF})\n  --show-diff       Print unified diff when drift is found\n  --strict          Exit with code 1 when drift is found\n  -h, --help        Show this help\n\nExamples:\n  npm run check:upstream-widgets\n  npm run check:upstream-widgets -- --show-diff\n  npm run check:upstream-widgets -- --ref=main --strict`);
}

function normalize(content) {
  return content.replace(/\r\n/g, "\n");
}

function parseOptions(argv) {
  const args = new Set(argv);
  const refArg = argv.find((arg) => arg.startsWith("--ref="));

  return {
    ref: refArg ? refArg.slice("--ref=".length) : DEFAULT_REF,
    showDiff: args.has("--show-diff"),
    strict: args.has("--strict"),
    help: args.has("-h") || args.has("--help"),
  };
}

async function fetchUpstreamFile(ref, filePath) {
  const url = `https://raw.githubusercontent.com/${UPSTREAM_REPO}/${encodeURIComponent(ref)}/${filePath}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "upstream-widget-drift-check",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} (${url})`);
  }

  return normalize(await response.text());
}

function printNoIndexDiff(leftFile, rightFile, leftLabel, rightLabel) {
  const diffResult = spawnSync(
    "git",
    ["--no-pager", "diff", "--no-index", "--src-prefix=a/", "--dst-prefix=b/", "--", leftFile, rightFile],
    { encoding: "utf8" },
  );

  let output = diffResult.stdout || "";
  output = output.split(leftFile).join(leftLabel).split(rightFile).join(rightLabel);
  if (output.trim()) {
    process.stdout.write(output);
  }

  if (diffResult.status !== 0 && diffResult.status !== 1 && diffResult.stderr) {
    process.stderr.write(diffResult.stderr);
  }
}

async function main() {
  const options = parseOptions(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const tempDir = mkdtempSync(path.join(tmpdir(), "widget-drift-"));
  const cwd = process.cwd();

  let upstreamDriftCount = 0;
  let mirrorDriftCount = 0;
  let errorCount = 0;

  console.log(`Comparing local widget files against ${UPSTREAM_REPO}@${options.ref}`);

  try {
    for (const target of targets) {
      const localAbs = path.join(cwd, target.localPath);
      const mirrorAbs = path.join(cwd, target.mirrorPath);

      console.log(`\n[${target.name}]`);

      if (!existsSync(localAbs)) {
        console.log(`  local:   ERROR (missing ${target.localPath})`);
        errorCount += 1;
        continue;
      }

      if (!existsSync(mirrorAbs)) {
        console.log(`  mirror:  ERROR (missing ${target.mirrorPath})`);
        errorCount += 1;
        continue;
      }

      const localContent = normalize(readFileSync(localAbs, "utf8"));
      const mirrorContent = normalize(readFileSync(mirrorAbs, "utf8"));

      let upstreamContent;
      try {
        upstreamContent = await fetchUpstreamFile(options.ref, target.upstreamPath);
      } catch (error) {
        console.log(`  upstream: ERROR (${error.message})`);
        errorCount += 1;
        continue;
      }

      const matchesUpstream = localContent === upstreamContent;
      const matchesMirror = localContent === mirrorContent;

      console.log(`  upstream: ${matchesUpstream ? "OK" : "DRIFT"}`);
      console.log(`  mirror:   ${matchesMirror ? "OK" : "DRIFT"}`);

      if (!matchesUpstream) {
        upstreamDriftCount += 1;
      }

      if (!matchesMirror) {
        mirrorDriftCount += 1;
      }

      if (options.showDiff && !matchesUpstream) {
        const localTmp = path.join(tempDir, `${target.name}.local.njk`);
        const upstreamTmp = path.join(tempDir, `${target.name}.upstream.njk`);
        writeFileSync(localTmp, localContent, "utf8");
        writeFileSync(upstreamTmp, upstreamContent, "utf8");

        console.log(`\n  diff local vs upstream (${target.name})`);
        printNoIndexDiff(localTmp, upstreamTmp, `a/${target.localPath}`, `b/upstream/${target.upstreamPath}`);
      }

      if (options.showDiff && !matchesMirror) {
        console.log(`\n  diff local vs mirror (${target.name})`);
        printNoIndexDiff(localAbs, mirrorAbs, `a/${target.localPath}`, `b/${target.mirrorPath}`);
      }
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }

  console.log("\nSummary");
  console.log(`  upstream drift: ${upstreamDriftCount}`);
  console.log(`  mirror drift:   ${mirrorDriftCount}`);
  console.log(`  errors:         ${errorCount}`);

  if (errorCount > 0) {
    process.exit(2);
  }

  if (options.strict && (upstreamDriftCount > 0 || mirrorDriftCount > 0)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
