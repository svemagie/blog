/**
 * CV Page Configuration Data
 *
 * API-first for split backend/frontend deployments:
 * - Try Indiekit public API (`/cvapi/page.json`, fallback `/cv/page.json`)
 * - Fallback to local plugin file (`content/.indiekit/cv-page.json`)
 *
 * Falls back to null so cv.njk can use the hardcoded default layout.
 */

import EleventyFetch from "@11ty/eleventy-fetch";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import cvPageConfigStatic from "./cvPageConfigStatic.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDIEKIT_URL =
  process.env.INDIEKIT_URL || process.env.SITE_URL || "https://example.com";

async function fetchFromIndiekit(path) {
  const urls = [
    `${INDIEKIT_URL}/cvapi/${path}`,
    `${INDIEKIT_URL}/cv/${path}`,
  ];

  for (const url of urls) {
    try {
      console.log(`[cvPageConfig] Fetching from Indiekit: ${url}`);
      const data = await EleventyFetch(url, {
        duration: "15m",
        type: "json",
      });
      console.log(`[cvPageConfig] Indiekit ${path} success via ${url}`);
      return data;
    } catch (error) {
      console.log(
        `[cvPageConfig] Indiekit API unavailable at ${url}: ${error.message}`
      );
    }
  }

  return null;
}

function readLocalConfigFile() {
  try {
    const configPath = resolve(
      __dirname,
      "..",
      "content",
      ".indiekit",
      "cv-page.json"
    );
    const raw = readFileSync(configPath, "utf8");
    const config = JSON.parse(raw);
    console.log("[cvPageConfig] Loaded local CV page builder config");
    return config;
  } catch {
    return null;
  }
}

export default async function () {
  const apiConfig = await fetchFromIndiekit("page.json");
  if (apiConfig && typeof apiConfig === "object") {
    return apiConfig;
  }

  const localConfig = readLocalConfigFile();
  if (localConfig && typeof localConfig === "object") {
    return localConfig;
  }

  if (cvPageConfigStatic && typeof cvPageConfigStatic === "object") {
    return cvPageConfigStatic;
  }

  return null;
}
