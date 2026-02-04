// Server-side function to fetch Memberstack members
// Deploy this as a serverless function (Vercel, Netlify, AWS Lambda, etc.)
// Or add to your existing backend

// IMPORTANT: Add your Memberstack Secret Key as environment variable:
// MEMBERSTACK_SECRET_KEY=sk-your-secret-key-here

export default async function handler(req, res) {
  // Only allow requests from your domain
  const allowedOrigin = "https://dpr-lab.webflow.io"; // Update with your domain
  const origin = req.headers.origin;

  if (origin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const MEMBERSTACK_SECRET = process.env.MEMBERSTACK_SECRET_KEY;

    if (!MEMBERSTACK_SECRET) {
      throw new Error("Memberstack secret key not configured");
    }

    // Fetch members from Memberstack Admin API
    const response = await fetch("https://admin.memberstack.com/members", {
      method: "GET",
      headers: {
        "X-API-KEY": MEMBERSTACK_SECRET,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch members from Memberstack");
    }

    const data = await response.json();

    // Return sanitized data
    return res.status(200).json({
      success: true,
      members: data.data || [],
      total: data.data?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Alternative: Express.js version
//
// const express = require('express');
// const cors = require('cors');
// const app = express();
//
// app.use(cors({ origin: 'https://dpr-lab.webflow.io' }));
//
// app.get('/api/members', async (req, res) => {
//   try {
//     const response = await fetch('https://admin.memberstack.com/members', {
//       headers: {
//         'X-API-KEY': process.env.MEMBERSTACK_SECRET_KEY,
//         'Content-Type': 'application/json'
//       }
//     });
//     const data = await response.json();
//     res.json({ success: true, members: data.data || [] });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });
//
// app.listen(3000);
