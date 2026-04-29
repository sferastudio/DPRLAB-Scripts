// Vercel Serverless Function — sync a Memberstack member's plan connections
// Endpoint: POST /api/members-sync-plans?id=mem_xxx
// Body: { add?: string[], remove?: string[] }
//   - `add`:    plan IDs to attach via /members/:id/add-free-plan
//   - `remove`: plan IDs to detach via /members/:id/remove-free-plan
// Returns: { add: [...], remove: [...] } with per-plan { planId, ok, error? }

const MEMBERSTACK_API = "https://admin.memberstack.com/members";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
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
    const { add, remove } = req.body || {};
    const addIds = Array.isArray(add) ? add.filter(Boolean) : [];
    const removeIds = Array.isArray(remove) ? remove.filter(Boolean) : [];

    const callPlanEndpoint = async (path, planId) => {
      const r = await fetch(`${MEMBERSTACK_API}/${memberId}/${path}`, {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });
      if (r.ok) return { planId, ok: true };
      const errBody = await r.text();
      console.error(`[api/members-sync-plans] ${path} failed for ${planId}:`, errBody);
      return { planId, ok: false, error: `${r.status} — ${errBody}` };
    };

    const addResults = [];
    for (const planId of addIds) {
      addResults.push(await callPlanEndpoint("add-free-plan", planId));
    }

    const removeResults = [];
    for (const planId of removeIds) {
      removeResults.push(await callPlanEndpoint("remove-free-plan", planId));
    }

    return res.status(200).json({ add: addResults, remove: removeResults });
  } catch (err) {
    console.error("[api/members-sync-plans] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
