/**
 * Mastodon Feed Data
 * Fetches recent posts from Mastodon using the public API
 */

import EleventyFetch from "@11ty/eleventy-fetch";

export default async function () {
  const instance = (
    process.env.MASTODON_URL ||
    process.env.MASTODON_INSTANCE ||
    ""
  )
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  const username = (
    process.env.MASTODON_USER ||
    process.env.MASTODON_USERNAME ||
    ""
  ).trim().replace(/^@+/, "");

  if (!instance || !username) {
    console.log("[mastodonFeed] MASTODON_URL/MASTODON_USER not set, skipping");
    return [];
  }

  try {
    // First, look up the account ID
    const lookupUrl = `https://${instance}/api/v1/accounts/lookup?acct=${username}`;

    const account = await EleventyFetch(lookupUrl, {
      duration: "1h", // Cache account lookup for 1 hour
      type: "json",
      fetchOptions: {
        headers: {
          Accept: "application/json",
        },
      },
    });

    if (!account || !account.id) {
      console.log("Mastodon account not found:", username);
      return [];
    }

    // Fetch recent statuses (excluding replies; boosts included since that's primary activity)
    const statusesUrl = `https://${instance}/api/v1/accounts/${account.id}/statuses?limit=10&exclude_replies=true`;

    const statuses = await EleventyFetch(statusesUrl, {
      duration: "15m", // Cache for 15 minutes
      type: "json",
      fetchOptions: {
        headers: {
          Accept: "application/json",
        },
      },
    });

    if (!statuses || !Array.isArray(statuses)) {
      console.log("No Mastodon statuses found for:", username);
      return [];
    }

    // Transform statuses into a simpler format; for boosts use the reblogged post's content
    return statuses.map((status) => {
      const isBoost = !!status.reblog;
      const source = isBoost ? status.reblog : status;
      return {
        id: status.id,
        url: source.url,
        text: stripHtml(source.content),
        htmlContent: source.content,
        createdAt: status.created_at,
        isBoost,
        author: {
          username: source.account.username,
          displayName: source.account.display_name || source.account.username,
          avatar: source.account.avatar,
          url: source.account.url,
        },
        favouritesCount: source.favourites_count || 0,
        reblogsCount: source.reblogs_count || 0,
        repliesCount: source.replies_count || 0,
        // Media attachments
        media: source.media_attachments
          ? source.media_attachments.map((m) => ({
              type: m.type,
              url: m.url,
              previewUrl: m.preview_url,
              description: m.description,
            }))
          : [],
      };
    });
  } catch (error) {
    console.error("Error fetching Mastodon feed:", error.message);
    return [];
  }
}

// Simple HTML stripper for plain text display
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
