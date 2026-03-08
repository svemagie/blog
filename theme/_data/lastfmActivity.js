/**
 * Last.fm Activity Data
 * Fetches from Indiekit's endpoint-lastfm public API
 */

import EleventyFetch from "@11ty/eleventy-fetch";

const INDIEKIT_URL =
  process.env.INDIEKIT_URL || process.env.SITE_URL || "https://example.com";
const LASTFM_USERNAME = process.env.LASTFM_USERNAME || "";

/**
 * Fetch from Indiekit's public Last.fm API endpoint
 */
async function fetchFromIndiekit(endpoint) {
  const urls = [
    `${INDIEKIT_URL}/lastfmapi/api/${endpoint}`,
    `${INDIEKIT_URL}/lastfm/api/${endpoint}`,
  ];

  for (const url of urls) {
    try {
      console.log(`[lastfmActivity] Fetching from Indiekit: ${url}`);
      const data = await EleventyFetch(url, {
        duration: "15m",
        type: "json",
      });
      console.log(`[lastfmActivity] Indiekit ${endpoint} success via ${url}`);
      return data;
    } catch (error) {
      console.log(
        `[lastfmActivity] Indiekit API unavailable for ${endpoint} at ${url}: ${error.message}`
      );
    }
  }

  return null;
}

export default async function () {
  try {
    console.log("[lastfmActivity] Fetching Last.fm data...");

    // Fetch all data from Indiekit API
    const [nowPlaying, scrobbles, loved, stats] = await Promise.all([
      fetchFromIndiekit("now-playing"),
      fetchFromIndiekit("scrobbles"),
      fetchFromIndiekit("loved"),
      fetchFromIndiekit("stats"),
    ]);

    // Check if we got data
    const hasData = nowPlaying || scrobbles?.scrobbles?.length || stats?.summary;

    if (!hasData) {
      console.log("[lastfmActivity] No data available from Indiekit");
      return {
        nowPlaying: null,
        scrobbles: [],
        loved: [],
        stats: null,
        username: LASTFM_USERNAME,
        profileUrl: LASTFM_USERNAME ? `https://www.last.fm/user/${LASTFM_USERNAME}` : null,
        source: "unavailable",
      };
    }

    console.log("[lastfmActivity] Using Indiekit API data");

    return {
      nowPlaying: nowPlaying || null,
      scrobbles: scrobbles?.scrobbles || [],
      loved: loved?.loved || [],
      stats: stats || null,
      username: LASTFM_USERNAME,
      profileUrl: LASTFM_USERNAME ? `https://www.last.fm/user/${LASTFM_USERNAME}` : null,
      source: "indiekit",
    };
  } catch (error) {
    console.error("[lastfmActivity] Error:", error.message);
    return {
      nowPlaying: null,
      scrobbles: [],
      loved: [],
      stats: null,
      username: LASTFM_USERNAME,
      profileUrl: null,
      source: "error",
    };
  }
}
