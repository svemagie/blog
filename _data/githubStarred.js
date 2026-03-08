/**
 * GitHub Starred Repos Metadata
 * Fetches the starred API response (cached 15min) to extract totalCount.
 * Only totalCount is passed to Eleventy's data cascade — the full star
 * list is discarded after parsing, keeping build memory low.
 * The starred page fetches all data client-side via Alpine.js.
 */

import EleventyFetch from "@11ty/eleventy-fetch";

const INDIEKIT_URL = process.env.SITE_URL || "https://example.com";

export default async function () {
  try {
    const urls = [
      `${INDIEKIT_URL}/github/api/starred/all`,
      `${INDIEKIT_URL}/githubapi/api/starred/all`,
    ];

    for (const url of urls) {
      try {
        const response = await EleventyFetch(url, {
          duration: "15m",
          type: "json",
        });

        return {
          totalCount: response.totalCount || 0,
          buildDate: new Date().toISOString(),
        };
      } catch (error) {
        console.log(`[githubStarred] Could not fetch ${url}: ${error.message}`);
      }
    }

    throw new Error("No GitHub starred endpoint responded");
  } catch (error) {
    console.log(`[githubStarred] Could not fetch starred count: ${error.message}`);
    return {
      totalCount: 0,
      buildDate: new Date().toISOString(),
    };
  }
}
