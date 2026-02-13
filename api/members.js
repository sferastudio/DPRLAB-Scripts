// Vercel Serverless Function — fetches all Memberstack members via Admin API
// Deploy: push to Vercel with MEMBERSTACK_API_KEY env variable set

const MEMBERSTACK_API = "https://admin.memberstack.com/members";

export default async function handler(req, res) {
  // CORS — allow your Webflow domain
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.MEMBERSTACK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "MEMBERSTACK_API_KEY not configured" });
  }

  try {
    const allMembers = [];
    let cursor = null;
    let hasMore = true;

    // Paginate through all members (50 per page)
    while (hasMore) {
      const params = new URLSearchParams({ limit: "50" });
      if (cursor) params.set("after", cursor);

      const response = await fetch(`${MEMBERSTACK_API}?${params}`, {
        headers: { "X-API-KEY": apiKey },
      });

      if (!response.ok) {
        throw new Error(`Memberstack API error: ${response.status}`);
      }

      const result = await response.json();
      const members = result.data || [];
      allMembers.push(...members);

      hasMore = result.hasMore === true;
      cursor = result.endCursor || null;
    }

    return res.status(200).json(allMembers);
  } catch (err) {
    console.error("[api/members] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
