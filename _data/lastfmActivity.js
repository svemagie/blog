/**
 * Last.fm Activity Data
 * Fetches from Indiekit's endpoint-lastfm public API
 */

import EleventyFetch from "@11ty/eleventy-fetch";

const INDIEKIT_URL =
  process.env.INDIEKIT_URL || process.env.SITE_URL || "https://example.com";
const LASTFM_USERNAME = process.env.LASTFM_USERNAME || "";
const DEFAULT_FETCH_CACHE_DURATION = "5m";
const LISTENING_FETCH_CACHE_DURATION =
  (process.env.LISTENING_FETCH_CACHE_DURATION || "").trim() || DEFAULT_FETCH_CACHE_DURATION;
const LASTFM_FETCH_CACHE_DURATION =
  (process.env.LASTFM_FETCH_CACHE_DURATION || "").trim() || LISTENING_FETCH_CACHE_DURATION;

/**
 * Fetch from Indiekit's public Last.fm API endpoint
 */
async function fetchFromIndiekit(path) {
  const urls = [
    `${INDIEKIT_URL}/lastfmapi/api/${path}`,
    `${INDIEKIT_URL}/lastfm/api/${path}`,
  ];

  for (const url of urls) {
    try {
      console.log(`[lastfmActivity] Fetching from Indiekit: ${url}`);
      const data = await EleventyFetch(url, {
        duration: LASTFM_FETCH_CACHE_DURATION,
        type: "json",
      });
      console.log(`[lastfmActivity] Indiekit ${path} success via ${url}`);
      return data;
    } catch (error) {
      console.log(
        `[lastfmActivity] Indiekit API unavailable for ${path} at ${url}: ${error.message}`
      );
    }
  }

  return null;
}

export default async function () {
  try {
    console.log("[lastfmActivity] Fetching Last.fm data...");
    console.log(
      `[lastfmActivity] EleventyFetch cache duration: ${LASTFM_FETCH_CACHE_DURATION}`
    );

    // Fetch all data from Indiekit API
    const [nowPlaying, scrobbles, loved, stats] = await Promise.all([
      fetchFromIndiekit("now-playing"),
      fetchFromIndiekit("scrobbles?period=alltime&limit=10"),
      fetchFromIndiekit("loved?limit=10"),
      fetchFromIndiekit("stats?period=alltime"),
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
