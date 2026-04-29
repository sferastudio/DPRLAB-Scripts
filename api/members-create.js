// Vercel Serverless Function — create a new Memberstack member
// Endpoint: POST /api/members-create

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

  try {
    const { email, password, customFields, plans } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const body = {
      email,
      password: password || generatePassword(),
      customFields: customFields || {},
    };

    const response = await fetch(MEMBERSTACK_API, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Memberstack API error: ${response.status} — ${errBody}`);
    }

    const result = await response.json();
    const memberId = result?.data?.id || result?.id;

    // Attach any inherited plans (e.g. from the user's organization)
    const planIds = Array.isArray(plans) ? plans.filter(Boolean) : [];
    const planResults = [];
    if (memberId && planIds.length) {
      for (const planId of planIds) {
        const planRes = await fetch(`${MEMBERSTACK_API}/${memberId}/add-free-plan`, {
          method: "POST",
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planId }),
        });
        if (planRes.ok) {
          planResults.push({ planId, ok: true });
        } else {
          const errBody = await planRes.text();
          // Don't fail the whole request — surface per-plan errors so caller can decide
          planResults.push({ planId, ok: false, error: `${planRes.status} — ${errBody}` });
          console.error(`[api/members-create] add-free-plan failed for ${planId}:`, errBody);
        }
      }
    }

    return res.status(201).json({ ...result, planResults });
  } catch (err) {
    console.error("[api/members-create] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// Generate a random temporary password
function generatePassword() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
