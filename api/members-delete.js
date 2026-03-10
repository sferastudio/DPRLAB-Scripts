// Vercel Serverless Function — delete a Memberstack member
// Endpoint: DELETE /api/members-delete?id=mem_xxx

const MEMBERSTACK_API = "https://admin.memberstack.com/members";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "DELETE") {
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
    const response = await fetch(`${MEMBERSTACK_API}/${memberId}`, {
      method: "DELETE",
      headers: {
        "X-API-KEY": apiKey,
      },
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Memberstack API error: ${response.status} — ${errBody}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[api/members-delete] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
