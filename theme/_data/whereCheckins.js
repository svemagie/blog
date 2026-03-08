/**
 * Where/Checkin data
 *
 * Reads local check-ins created by this site's Micropub endpoint.
 * Supports OwnYourSwarm JSON mode and simple mode payloads once they are
 * written to local markdown content.
 */

import matter from "gray-matter";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

function resolveContentDir() {
  const candidates = ["../content", "../../content"].map((value) =>
    fileURLToPath(new URL(value, import.meta.url))
  );
  return candidates.find((dirPath) => existsSync(dirPath)) || candidates[0];
}

const CONTENT_DIR = resolveContentDir();
const SWARM_HOST = "swarmapp.com";

function first(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function asArray(value) {
  if (value === null || value === undefined || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

function asText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if (typeof value.value === "string") return value.value;
    if (typeof value.text === "string") return value.text;
    if (typeof value.url === "string") return value.url;
  }
  return "";
}

function asNumber(value) {
  const raw = first(asArray(value));
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function joinLocation(locality, region, country) {
  return [locality, region, country].filter(Boolean).join(", ");
}

function toRelativePath(filePath) {
  return relative(CONTENT_DIR, filePath).replace(/\\/g, "/");
}

function walkMarkdownFiles(dirPath) {
  const files = [];

  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath));
      continue;
    }

    if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
      files.push(fullPath);
    }
  }

  return files;
}

function toPropertiesObject(value) {
  if (!value || typeof value !== "object") return {};
  if (value.properties && typeof value.properties === "object") {
    return value.properties;
  }
  return value;
}

function getEntryProperties(frontmatter) {
  return toPropertiesObject(frontmatter.properties);
}

function isSwarmUrl(url) {
  return asText(url).toLowerCase().includes(SWARM_HOST);
}

function parseGeoUri(value) {
  const raw = asText(value).trim();
  const match = raw.match(/^geo:\s*([-+]?\d+(?:\.\d+)?),\s*([-+]?\d+(?:\.\d+)?)/i);
  if (!match) {
    return {
      latitude: null,
      longitude: null,
    };
  }

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);

  return {
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  };
}

function extractSimpleModeVenueName(contentValue) {
  const text = asText(contentValue).trim();
  if (!text) return "";

  const match = text.match(/^Checked in (?:at|to)\s+(.+?)(?:\.\s|$)/i);
  return match ? match[1].trim() : "";
}

function parsePersonCard(card) {
  if (!card || typeof card !== "object") return null;
  const props = toPropertiesObject(card);

  const urls = asArray(props.url).map((url) => asText(url)).filter(Boolean);
  const photos = asArray(props.photo).map((photo) => asText(photo)).filter(Boolean);

  return {
    name:
      asText(first(asArray(props.name))) ||
      asText(props.firstName) ||
      "",
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
    const looksLikePersonTag =
      type.includes("h-card") ||
      Boolean(value.properties) ||
      value.name !== undefined ||
      value.url !== undefined;

    if (looksLikePersonTag) {
      const person = parsePersonCard(value);
      if (person && (person.name || person.url)) {
        people.push(person);
      }
    }
  }

  const normalizedTags = uniqueStrings(tags).filter(
    (tag) => !["where", "slashpage"].includes(tag.toLowerCase())
  );

  return {
    tags: normalizedTags,
    people,
  };
}

function isCheckinFrontmatter(frontmatter, relativePath) {
  if (relativePath === "pages/where.md") return false;

  const properties = getEntryProperties(frontmatter);

  const checkinValue =
    properties.checkin ??
    frontmatter.checkin ??
    frontmatter["check-in"];

  const syndicationValues = asArray(properties.syndication ?? frontmatter.syndication)
    .map((value) => asText(value))
    .filter(Boolean);

  const categories = asArray(properties.category ?? frontmatter.category)
    .map((value) => asText(value).toLowerCase())
    .filter(Boolean);

  const locationValue = properties.location ?? frontmatter.location;
  const geoCoords = parseGeoUri(first(asArray(locationValue)));

  const hasCheckinField = checkinValue !== undefined;
  const hasSwarmSyndication = syndicationValues.some((url) => isSwarmUrl(url));
  const hasLocationField = locationValue !== undefined;
  const hasCoordinates =
    properties.latitude !== undefined ||
    properties.longitude !== undefined ||
    frontmatter.latitude !== undefined ||
    frontmatter.longitude !== undefined ||
    (geoCoords.latitude !== null && geoCoords.longitude !== null);

  const hasCheckinCategory =
    categories.includes("where") ||
    categories.includes("checkin") ||
    categories.includes("swarm");

  return hasCheckinField || hasSwarmSyndication || (hasCheckinCategory && (hasLocationField || hasCoordinates));
}

function normalizeCheckin(frontmatter, relativePath) {
  const properties = getEntryProperties(frontmatter);

  const checkinValue = first(
    asArray(properties.checkin ?? frontmatter.checkin ?? frontmatter["check-in"])
  );
  const locationValue = first(asArray(properties.location ?? frontmatter.location));

  const checkinProps = toPropertiesObject(checkinValue);
  const locationProps = toPropertiesObject(locationValue);
  const locationGeo = parseGeoUri(locationValue);

  const venueUrlsFromCard = asArray(checkinProps.url).map((url) => asText(url)).filter(Boolean);
  const venueUrlFromSimpleMode =
    typeof checkinValue === "string" ? checkinValue : asText(checkinValue?.value);
  const venueUrls = uniqueStrings(
    venueUrlFromSimpleMode ? [venueUrlFromSimpleMode, ...venueUrlsFromCard] : venueUrlsFromCard
  );

  const venueUrl = venueUrls[0] || "";
  const venueWebsiteUrl = venueUrls[1] || "";
  const venueSocialUrl = venueUrls[2] || "";

  const contentValue = first(asArray(properties.content ?? frontmatter.content));
  const simpleModeVenueName = extractSimpleModeVenueName(contentValue);

  const name =
    asText(first(asArray(checkinProps.name))) ||
    simpleModeVenueName ||
    asText(frontmatter.title) ||
    "Unknown place";

  const locality =
    asText(first(asArray(checkinProps.locality))) ||
    asText(first(asArray(locationProps.locality))) ||
    asText(properties.locality) ||
    asText(frontmatter.locality);
  const region =
    asText(first(asArray(checkinProps.region))) ||
    asText(first(asArray(locationProps.region))) ||
    asText(properties.region) ||
    asText(frontmatter.region);
  const country =
    asText(first(asArray(checkinProps["country-name"]))) ||
    asText(first(asArray(locationProps["country-name"]))) ||
    asText(properties["country-name"]) ||
    asText(frontmatter["country-name"]);
  const postalCode =
    asText(first(asArray(checkinProps["postal-code"]))) ||
    asText(first(asArray(locationProps["postal-code"]))) ||
    asText(properties["postal-code"]) ||
    asText(frontmatter["postal-code"]);

  const latitude =
    asNumber(checkinProps.latitude) ??
    asNumber(locationProps.latitude) ??
    asNumber(properties.latitude) ??
    asNumber(frontmatter.latitude) ??
    locationGeo.latitude;
  const longitude =
    asNumber(checkinProps.longitude) ??
    asNumber(locationProps.longitude) ??
    asNumber(properties.longitude) ??
    asNumber(frontmatter.longitude) ??
    locationGeo.longitude;

  const published =
    asText(first(asArray(properties.published ?? frontmatter.published))) ||
    asText(frontmatter.date);

  const syndicationUrls = asArray(properties.syndication ?? frontmatter.syndication)
    .map((url) => asText(url))
    .filter(Boolean);
  const syndication =
    syndicationUrls.find((url) => isSwarmUrl(url)) ||
    syndicationUrls[0] ||
    "";

  const visibility = asText(
    first(asArray(properties.visibility ?? frontmatter.visibility))
  ).toLowerCase();

  const categoryValues = asArray(properties.category ?? frontmatter.category);
  const category = parseCategory(categoryValues);

  const checkedInByValue = first(
    asArray(
      properties["checked-in-by"] ??
        frontmatter["checked-in-by"] ??
        frontmatter.checkedInBy
    )
  );
  const checkedInBy = parsePersonCard(checkedInByValue);

  const addedPhotos =
    frontmatter.add && typeof frontmatter.add === "object"
      ? asArray(frontmatter.add.photo)
      : [];
  const photoValues = [
    ...asArray(properties.photo ?? frontmatter.photo),
    ...addedPhotos,
  ];
  const photos = uniqueStrings(
    photoValues
      .map((photo) => {
        if (typeof photo === "string") return photo;
        if (photo && typeof photo === "object") {
          return asText(photo.url || photo.value || photo.src || "");
        }
        return "";
      })
      .filter(Boolean)
  );

  if (!checkinValue && !syndication && latitude === null && longitude === null) {
    return null;
  }

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
  const permalink = asText(frontmatter.permalink);
  const id = syndication || permalink || `${relativePath}-${published || "unknown"}`;

  return {
    id,
    sourcePath: relativePath,
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

function normalizeCheckins(items) {
  const seen = new Set();
  const checkins = [];

  for (const item of items) {
    if (!item) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    checkins.push(item);
  }

  return checkins.sort((a, b) => b.timestamp - a.timestamp);
}

export default async function () {
  const checkedAt = new Date().toISOString();
  const errors = [];

  let filePaths = [];

  try {
    filePaths = walkMarkdownFiles(CONTENT_DIR);
  } catch (error) {
    const message = `[whereCheckins] Unable to scan local content: ${error.message}`;
    console.log(message);
    return {
      source: "local-endpoint",
      available: false,
      checkedAt,
      scannedFiles: 0,
      checkins: [],
      errors: [message],
      stats: {
        total: 0,
        withCoordinates: 0,
      },
    };
  }

  const items = [];

  for (const filePath of filePaths) {
    const relativePath = toRelativePath(filePath);

    try {
      const raw = readFileSync(filePath, "utf-8");
      const frontmatter = matter(raw).data || {};

      if (!isCheckinFrontmatter(frontmatter, relativePath)) continue;

      const checkin = normalizeCheckin(frontmatter, relativePath);
      if (checkin) items.push(checkin);
    } catch (error) {
      errors.push(`[whereCheckins] Skipped ${relativePath}: ${error.message}`);
    }
  }

  const checkins = normalizeCheckins(items);
  const withCoordinates = checkins.filter(
    (item) => item.latitude !== null && item.longitude !== null
  ).length;

  return {
    source: "local-endpoint",
    available: checkins.length > 0,
    checkedAt,
    scannedFiles: filePaths.length,
    checkins,
    errors,
    stats: {
      total: checkins.length,
      withCoordinates,
    },
  };
}
