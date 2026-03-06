/**
 * Recent Comments Data
 * Fetches the 5 most recent comments at build time for the sidebar widget.
 */

import EleventyFetch from "@11ty/eleventy-fetch";

const INDIEKIT_URL = process.env.SITE_URL || "https://example.com";

export default async function () {
  try {
    const url = `${INDIEKIT_URL}/comments/api/comments?limit=5`;
    console.log(`[recentComments] Fetching: ${url}`);
    const data = await EleventyFetch(url, {
      duration: "15m",
      type: "json",
    });
    console.log(`[recentComments] Got ${(data.children || []).length} comments`);
    return data.children || [];
  } catch (error) {
    console.log(`[recentComments] Unavailable: ${error.message}`);
    return [];
  }
}
