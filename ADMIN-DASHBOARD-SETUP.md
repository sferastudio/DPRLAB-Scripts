# DPR Lab Admin Dashboard Setup Guide

This guide will help you set up a dynamic, professional admin dashboard with live Memberstack data.

## Overview

The admin dashboard will display:
- **Real-time statistics**: Total members, active users, plan distribution
- **Dynamic user table**: Live member list with search, filter, and export
- **Analytics**: Usage tracking and reporting for clients
- **Export functionality**: Download member data as CSV

---

## Step 1: Add Data Attributes to Webflow

In your Webflow Designer, add these `data-*` attributes to elements on your admin dashboard page:

### Statistics Section
```html
<!-- Add these attributes to your stat number elements -->
<div data-stat="total-users">128</div>
<div data-stat="active-users">12</div>
<div data-stat="total-topics">28</div>
<div data-stat="total-assets">86</div>
```

### Users Table Container
```html
<!-- Add this to the container where you want the users table -->
<div data-admin="users-table"></div>
```

### Plan Distribution Container
```html
<!-- Add this where you want to show plan breakdown -->
<div data-admin="plan-distribution"></div>
```

### Export Button
```html
<!-- Add this to your export button -->
<button data-action="export-csv">Export to CSV</button>
```

---

## Step 2: Deploy the API Endpoint

You need a server-side API to fetch member data securely. Choose one option:

### Option A: Vercel Serverless Function (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Create** `api/get-members.js` in your project root (already created in this repo)

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Add environment variable** in Vercel Dashboard:
   - Go to your project settings
   - Add: `MEMBERSTACK_SECRET_KEY=sk-your-secret-key`
   - Get your secret key from: Memberstack Dashboard → Settings → API Keys

5. **Update** `dpr-admin-dashboard.js` line 8:
   ```javascript
   apiEndpoint: "https://your-project.vercel.app/api/get-members"
   ```

### Option B: Netlify Function

1. Create `netlify/functions/get-members.js`:
   ```javascript
   exports.handler = async function(event, context) {
     // Copy code from api-get-members.js
   };
   ```

2. Deploy to Netlify

3. Add environment variable `MEMBERSTACK_SECRET_KEY`

### Option C: Your Existing Backend

If you have an existing Node.js/Express backend:
1. Add the endpoint from `api-get-members.js`
2. Update the API URL in `dpr-admin-dashboard.js`

---

## Step 3: Add Scripts to Webflow

1. **Go to** Webflow Project Settings → Custom Code

2. **Add in "Before </body> tag"** (Site-wide):
   ```html
   <!-- Only load on admin dashboard page -->
   <script>
   if (window.location.pathname === '/admin-dashboard') {
     // Add your deployed script URL or paste the script
   }
   </script>
   ```

3. **Or add directly to the Admin Dashboard page** (Page Settings → Custom Code):
   ```html
   <script src="https://your-cdn.com/dpr-admin-dashboard.js"></script>
   ```

---

## Step 4: Test the Dashboard

1. **Publish your Webflow site**
2. **Navigate to** `/admin-dashboard`
3. **Check browser console** for logs (CONFIG.debug = true)
4. **Verify**:
   - Stats are updating
   - User table is populated
   - Export button works

---

## Customization

### Update Plan Names
Edit `CONFIG.planNames` in `dpr-admin-dashboard.js`:
```javascript
planNames: {
  "pln_your-plan-id": "Display Name",
  // Add all your plan IDs
}
```

### Change Refresh Interval
```javascript
refreshInterval: 300000, // 5 minutes in milliseconds
```

### Add Custom Styling
The script injects minimal CSS. Add your own styles in Webflow or custom CSS.

---

## Troubleshooting

### "No members showing"
- Check API endpoint is correct
- Verify Memberstack secret key is set
- Check browser console for errors
- Test API endpoint directly in browser

### "Stats not updating"
- Verify `data-stat` attributes are added correctly
- Check spelling matches exactly

### "Export not working"
- Verify `data-action="export-csv"` attribute exists
- Check if members array has data

---

## Next Steps: Enhanced Features

Once basic functionality works, you can add:

1. **Search & Filter**
   - Add search input with `data-action="search-users"`
   - Add filter dropdowns

2. **Usage Tracking**
   - Track topic views
   - Track asset downloads
   - Show in timeline

3. **Charts & Graphs**
   - Use Chart.js or similar
   - Show growth trends
   - Engagement over time

4. **PDF Reports**
   - Use jsPDF library
   - Generate client-ready reports
   - Include charts and tables

---

## Need Help?

Check these files:
- `dpr-admin-dashboard.js` - Main dashboard script
- `api-get-members.js` - Server-side API endpoint
- `dpr-content-gating.js` - Content gating reference

For Memberstack API docs: https://docs.memberstack.com/hc/en-us/articles/5368718248603-Admin-API
