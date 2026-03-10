// Vercel Serverless Function — update a Memberstack member's custom fields
// Endpoint: PATCH /api/members-update?id=mem_xxx

const MEMBERSTACK_API = "https://admin.memberstack.com/members";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.MEMBERSTACK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "MEMBERSTACK_API_KEY not configured" });
  }

  const memberId = req.query.id;
  if (!memberId) {
    return res.status(400).json({ error: "Member ID is required (use ?id=mem_xxx)" });
  }

  try {
    const { customFields } = req.body || {};
    if (!customFields) {
      return res.status(400).json({ error: "customFields is required in request body" });
    }

    const response = await fetch(`${MEMBERSTACK_API}/${memberId}`, {
      method: "PATCH",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customFields }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Memberstack API error: ${response.status} — ${errBody}`);
    }

    const result = await response.json();
    return res.status(200).json(result);
  } catch (err) {
    console.error("[api/members-update] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
