/**
 * Where/Checkin data
 *
 * Fetches h-entry checkins from an OwnYourSwarm-connected endpoint.
 * Expected payload: MF2 JSON with h-entry objects containing `checkin` and/or `location`.
 */

import EleventyFetch from "@11ty/eleventy-fetch";

const FEED_URL = process.env.OWNYOURSWARM_FEED_URL || "https://ownyourswarm.p3k.io/";
const FEED_TOKEN = process.env.OWNYOURSWARM_FEED_TOKEN || "";

function first(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function asText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    if (typeof value.value === "string") return value.value;
    if (typeof value.text === "string") return value.text;
  }
  return "";
}

function asNumber(value) {
  const raw = first(value);
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function joinLocation(locality, region, country) {
  return [locality, region, country].filter(Boolean).join(", ");
}

function buildCandidateUrls(baseUrl) {
  const raw = (baseUrl || "").trim();
  if (!raw) return [];

  const urls = [raw];

  try {
    const parsed = new URL(raw);
    const pathWithoutSlash = parsed.pathname.replace(/\/$/, "");
    const basePath = `${parsed.origin}${pathWithoutSlash}`;

    const withFormat = new URL(parsed.toString());
    withFormat.searchParams.set("format", "json");
    urls.push(withFormat.toString());

    const withOutput = new URL(parsed.toString());
    withOutput.searchParams.set("output", "json");
    urls.push(withOutput.toString());

    if (pathWithoutSlash) {
      urls.push(`${basePath}.json`);
      urls.push(`${basePath}/checkins.json`);
      urls.push(`${basePath}/feed.json`);
      urls.push(`${basePath}/api/checkins`);
    } else {
      urls.push(`${parsed.origin}/checkins.json`);
      urls.push(`${parsed.origin}/feed.json`);
      urls.push(`${parsed.origin}/api/checkins`);
    }
  } catch {
    // If URL parsing fails, we still try the raw URL above.
  }

  return [...new Set(urls)];
}

async function fetchJson(url) {
  const headers = FEED_TOKEN ? { Authorization: `Bearer ${FEED_TOKEN}` } : {};
  const fetchOptions = Object.keys(headers).length ? { headers } : undefined;

  try {
    return await EleventyFetch(url, {
      duration: "15m",
      type: "json",
      fetchOptions,
    });
  } catch (jsonError) {
    // Some endpoints serve JSON with an incorrect content type. Retry as text.
    const text = await EleventyFetch(url, {
      duration: "15m",
      type: "text",
      fetchOptions,
    });
    const trimmed = text.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      throw jsonError;
    }
    return JSON.parse(trimmed);
  }
}

function looksLikeCheckinEntry(entry) {
  if (!entry || typeof entry !== "object") return false;
  const type = Array.isArray(entry.type) ? entry.type : [];
  if (type.includes("h-entry")) {
    const props = entry.properties || {};
    return Boolean(props.checkin || props.location);
  }
  return false;
}

function extractEntries(payload) {
  const queue = [];
  if (Array.isArray(payload)) {
    queue.push(...payload);
  } else if (payload && typeof payload === "object") {
    queue.push(payload);
  }

  const entries = [];

  while (queue.length) {
    const item = queue.shift();
    if (!item || typeof item !== "object") continue;

    if (looksLikeCheckinEntry(item)) {
      entries.push(item);
    }

    if (Array.isArray(item.items)) queue.push(...item.items);
    if (Array.isArray(item.children)) queue.push(...item.children);
    if (item.data && Array.isArray(item.data.items)) queue.push(...item.data.items);
  }

  return entries;
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function parsePersonCard(card) {
  if (!card || typeof card !== "object") return null;
  const props = card.properties || {};

  const urls = Array.isArray(props.url)
    ? props.url.map((url) => asText(url)).filter(Boolean)
    : [];
  const photos = Array.isArray(props.photo)
    ? props.photo.map((photo) => asText(photo)).filter(Boolean)
    : [];

  return {
    name: asText(first(props.name)),
    url: urls[0] || "",
    urls,
    photo: photos[0] || "",
  };
}

function parseCategory(categoryValues) {
  const tags = [];
  const people = [];

  for (const value of categoryValues) {
    if (typeof value === "string") {
      tags.push(value.trim());
      continue;
    }

    if (!value || typeof value !== "object") continue;
    const type = Array.isArray(value.type) ? value.type : [];
    if (type.includes("h-card")) {
      const person = parsePersonCard(value);
      if (person && (person.name || person.url)) {
        people.push(person);
      }
    }
  }

  return {
    tags: uniqueStrings(tags),
    people,
  };
}

function normalizeCheckin(entry) {
  const props = entry.properties || {};

  if (!props.checkin && !props.location) {
    return null;
  }

  const checkinCard = first(props.checkin);
  const locationCard = first(props.location);

  const checkinProps =
    checkinCard && typeof checkinCard === "object" && checkinCard.properties
      ? checkinCard.properties
      : {};
  const locationProps =
    locationCard && typeof locationCard === "object" && locationCard.properties
      ? locationCard.properties
      : {};

  const venueUrlsRaw = Array.isArray(checkinProps.url)
    ? checkinProps.url
    : checkinProps.url
      ? [checkinProps.url]
      : [];
  const venueUrls = venueUrlsRaw.map((url) => asText(url)).filter(Boolean);

  const name = asText(first(checkinProps.name)) || "Unknown place";
  const venueUrl = venueUrls[0] || asText(checkinCard?.value);
  const venueWebsiteUrl = venueUrls[1] || "";
  const venueSocialUrl = venueUrls[2] || "";

  const locality = asText(first(checkinProps.locality)) || asText(first(locationProps.locality));
  const region = asText(first(checkinProps.region)) || asText(first(locationProps.region));
  const country =
    asText(first(checkinProps["country-name"])) ||
    asText(first(locationProps["country-name"]));
  const postalCode =
    asText(first(checkinProps["postal-code"])) ||
    asText(first(locationProps["postal-code"]));

  const latitude =
    asNumber(checkinProps.latitude) ?? asNumber(locationProps.latitude) ?? asNumber(props.latitude);
  const longitude =
    asNumber(checkinProps.longitude) ?? asNumber(locationProps.longitude) ?? asNumber(props.longitude);

  const published = asText(first(props.published));
  const syndication = asText(first(props.syndication));
  const visibility = asText(first(props.visibility)).toLowerCase();

  const categoryValues = Array.isArray(props.category) ? props.category : [];
  const category = parseCategory(categoryValues);

  const checkedInByCard = first(props["checked-in-by"]);
  const checkedInBy = parsePersonCard(checkedInByCard);

  const photos = Array.isArray(props.photo)
    ? props.photo.map((photo) => asText(photo)).filter(Boolean)
    : [];

  const mapUrl =
    latitude !== null && longitude !== null
      ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
      : "";

  const coordinatesText =
    latitude !== null && longitude !== null
      ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
      : "";

  const locationText = joinLocation(locality, region, country);
  const timestamp = published ? Date.parse(published) || 0 : 0;
  const id = syndication || `${published}-${name}-${coordinatesText}`;

  return {
    id,
    published,
    timestamp,
    syndication,
    visibility,
    isPrivate: visibility === "private",
    name,
    photos,
    tags: category.tags,
    taggedPeople: category.people,
    checkedInBy,
    venueUrl,
    venueWebsiteUrl,
    venueSocialUrl,
    locality,
    region,
    country,
    postalCode,
    locationText,
    latitude,
    longitude,
    coordinatesText,
    mapUrl,
  };
}

function normalizeCheckins(entries) {
  const seen = new Set();
  const checkins = [];

  for (const entry of entries) {
    const normalized = normalizeCheckin(entry);
    if (!normalized) continue;
    if (seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    checkins.push(normalized);
  }

  return checkins.sort((a, b) => b.timestamp - a.timestamp);
}

export default async function () {
  const checkedAt = new Date().toISOString();
  const candidateUrls = buildCandidateUrls(FEED_URL);
  const errors = [];

  for (const url of candidateUrls) {
    try {
      console.log(`[whereCheckins] Fetching: ${url}`);
      const payload = await fetchJson(url);
      const entries = extractEntries(payload);
      const checkins = normalizeCheckins(entries);

      if (checkins.length > 0) {
        const withCoordinates = checkins.filter(
          (item) => item.latitude !== null && item.longitude !== null
        ).length;

        return {
          feedUrl: url,
          checkins,
          source: "ownyourswarm",
          available: true,
          checkedAt,
          triedUrls: candidateUrls,
          errors,
          stats: {
            total: checkins.length,
            withCoordinates,
          },
        };
      }

      errors.push(`No checkin h-entry objects found at ${url}`);
    } catch (error) {
      const message = `[whereCheckins] Unable to use ${url}: ${error.message}`;
      console.log(message);
      errors.push(message);
    }
  }

  return {
    feedUrl: FEED_URL,
    checkins: [],
    source: "unavailable",
    available: false,
    checkedAt,
    triedUrls: candidateUrls,
    errors,
    stats: {
      total: 0,
      withCoordinates: 0,
    },
  };
}
