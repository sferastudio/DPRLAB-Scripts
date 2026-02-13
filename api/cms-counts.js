// Vercel Serverless Function — fetches CMS collection item counts from Webflow API
// Deploy: push to Vercel with WEBFLOW_API_TOKEN env variable set

const COLLECTIONS = {
  topics: "696482cc1280b14f218d12c5",
  assets: "6964859b6cf3e25232c5d380",
};

async function getCollectionCount(collectionId, token) {
  const res = await fetch(
    `https://api.webflow.com/v2/collections/${collectionId}/items?limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Webflow API error: ${res.status}`);
  const data = await res.json();
  return data.pagination?.total || 0;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const token = process.env.WEBFLOW_API_TOKEN;
  if (!token) return res.status(500).json({ error: "WEBFLOW_API_TOKEN not configured" });

  try {
    const [totalTopics, totalAssets] = await Promise.all([
      getCollectionCount(COLLECTIONS.topics, token),
      getCollectionCount(COLLECTIONS.assets, token),
    ]);

    return res.status(200).json({ totalTopics, totalAssets });
  } catch (err) {
    console.error("[api/cms-counts] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
