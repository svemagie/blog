/**
 * CV Data
 *
 * API-first for split backend/frontend deployments:
 * - Try Indiekit public API (`/cvapi/data.json`, fallback `/cv/data.json`)
 * - Fallback to local plugin file (`content/.indiekit/cv.json`)
 *
 * Returns empty defaults if neither source is available.
 */

import EleventyFetch from "@11ty/eleventy-fetch";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import cvStatic from "./cvStatic.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDIEKIT_URL =
  process.env.INDIEKIT_URL || process.env.SITE_URL || "https://example.com";

const EMPTY_CV = {
  lastUpdated: null,
  experience: [],
  projects: [],
  skills: {},
  skillTypes: {},
  languages: [],
  education: [],
  interests: {},
  interestTypes: {},
};

async function fetchFromIndiekit(path) {
  const urls = [
    `${INDIEKIT_URL}/cvapi/${path}`,
    `${INDIEKIT_URL}/cv/${path}`,
  ];

  for (const url of urls) {
    try {
      console.log(`[cv] Fetching from Indiekit: ${url}`);
      const data = await EleventyFetch(url, {
        duration: "15m",
        type: "json",
      });
      console.log(`[cv] Indiekit ${path} success via ${url}`);
      return data;
    } catch (error) {
      console.log(`[cv] Indiekit API unavailable at ${url}: ${error.message}`);
    }
  }

  return null;
}

function readLocalCvFile() {
  try {
    const cvPath = resolve(__dirname, "..", "content", ".indiekit", "cv.json");
    const raw = readFileSync(cvPath, "utf8");
    const data = JSON.parse(raw);
    console.log("[cv] Loaded CV data from local plugin file");
    return data;
  } catch {
    return null;
  }
}

export default async function () {
  const apiData = await fetchFromIndiekit("data.json");
  if (apiData && typeof apiData === "object") {
    return { ...EMPTY_CV, ...apiData };
  }

  const localData = readLocalCvFile();
  if (localData && typeof localData === "object") {
    return { ...EMPTY_CV, ...localData };
  }

  if (cvStatic && typeof cvStatic === "object") {
    return { ...EMPTY_CV, ...cvStatic };
  }

  return EMPTY_CV;
}
