# Memberstack Fields Setup Guide

This guide will walk you through creating the new fields in Memberstack for your DPR Lab admin dashboard.

---

## Organization Data Table Fields

Go to **Memberstack Dashboard → Data Tables → "organization" table** and add these fields:

### 1. subscription_status
- **Field Name:** `subscription_status`
- **Field Type:** Text (or Single-select if available)
- **Description:** Current subscription status
- **Allowed Values:** "active", "trial", "expired", "suspended"
- **Default Value:** "trial"
- **Required:** Yes

### 2. contract_start_date
- **Field Name:** `contract_start_date`
- **Field Type:** Date
- **Description:** When the organization's contract/subscription started
- **Required:** No (can be null for trials)

### 3. contract_end_date
- **Field Name:** `contract_end_date`
- **Field Type:** Date
- **Description:** When the organization's contract/subscription ends
- **Required:** No (can be null for trials)

---

## Member Custom Fields

Go to **Memberstack Dashboard → Settings → Custom Fields** and add these fields:

### 4. joined-org-date
- **Field Name:** `joined-org-date`
- **Field Type:** Date or Text
- **Description:** Date when the member joined their organization
- **Required:** No
- **Note:** This will be automatically populated when you connect a member to an org

### 5. role
- **Field Name:** `role`
- **Field Type:** Text (or Single-select if you want predefined options)
- **Description:** Member's role within their organization
- **Example Values:** "Teacher", "Administrator", "Facilitator", "Coordinator"
- **Required:** No

---

## Existing Fields (Already in Use)

These fields should already exist. **Do NOT delete them:**

### Member Custom Fields:
- `first-name` - User's first name
- `last-name` - User's last name
- `org-id` - Organization ID (links to organization table)
- `org-name` - Organization name (for display)
- `video-data` - JSON string with video progress tracking
- `activity-data` - JSON string with downloads/clicks tracking

### Organization Table Fields:
- `organization_name` - Display name
- `organization_id` - Unique identifier
- `email_domain` - Email domain (e.g., @company.com)
- `members` - Relationship field to members

---

## Step-by-Step Setup Instructions

### For Organization Fields:

1. **Log into Memberstack Dashboard**
2. Navigate to **Data Tables** in the left sidebar
3. Click on the **"organization"** table
4. Click **"Add Field"** button
5. For each field above:
   - Enter the exact field name (e.g., `subscription_status`)
   - Select the field type
   - Add a description
   - Set required/default values
   - Click **Save**

### For Member Fields:

1. **Log into Memberstack Dashboard**
2. Navigate to **Settings → Custom Fields**
3. Click **"Add Custom Field"** button
4. For each field above:
   - Enter the exact field name (e.g., `joined-org-date`)
   - Select the field type
   - Add a description
   - Click **Save**

---

## What Changed in Your Scripts

### ✅ dpr-admin-dashboard.js
**Now displays and manages:**
- Organization subscription status
- Contract start and end dates
- Member joined dates
- Member roles
- Exports include the new fields

### ✅ practice-assets.js
**Now tracks:**
- `started_date` - ISO timestamp when user first started a video
- `completed_date` - ISO timestamp when user completed a video (≥90%)

**Example video-data structure:**
```json
{
  "watched": [
    {
      "id": "intro-to-dpr",
      "title": "Introduction to DPR",
      "topics": ["foundational"],
      "started": true,
      "started_date": "2026-02-12T15:30:00.000Z",
      "completed": true,
      "completed_date": "2026-02-12T15:45:30.000Z",
      "percent_watched": 100,
      "last_position": 0
    }
  ],
  "topic_totals": {
    "foundational": 10
  }
}
```

### ✅ dpr-activity-tracking.js
**Already tracks:**
- `firstDownloaded` / `lastDownloaded` - ISO timestamps for downloads
- `firstClicked` / `lastClicked` - ISO timestamps for link clicks

---

## Testing Your Setup

### Test Organization Fields:
1. Go to your admin dashboard
2. Click **"Create Organization"** button
3. Fill in the form - you should see fields for:
   - Organization Name
   - Organization ID
   - Email Domain
   - **Subscription Status** (dropdown: trial/active/expired/suspended)
   - **Contract Start Date** (date picker)
   - **Contract End Date** (date picker)
4. Save and verify the fields appear in the org detail view

### Test Member Fields:
1. Watch a video to completion (90%+)
2. Open browser console and check the `video-data` field
3. Look for `started_date` and `completed_date` timestamps
4. Download a file with `data-track="download"` attribute
5. Check `activity-data` for `firstDownloaded` timestamp

### Verify Dashboard Display:
1. Go to **Organizations tab**
2. Check that contract dates show in the table
3. Export organizations CSV - verify new columns appear
4. Go to **Users tab**
5. Export users CSV - verify "Joined Org" and "Role" columns appear

---

## Troubleshooting

### "Field not found" errors:
- Verify field names match exactly (case-sensitive, including hyphens)
- For organization fields: must be in the "organization" **data table**, not member fields
- For member fields: must be in **Settings → Custom Fields**

### Dates not showing:
- Make sure date fields are type "Date" not "Text"
- Check that your scripts are deployed and running
- Clear browser cache and hard refresh

### Timestamps not saving:
- Check browser console for errors
- Verify Memberstack is initialized (`window.$memberstackReady`)
- Test with `CONFIG.debug = true` to see logs

---

## Next Steps

After setting up these fields, you can:

1. **Manually populate existing orgs:**
   - Edit each organization
   - Set subscription status to "active" or "trial"
   - Add contract dates

2. **Bulk update via API or CSV import** (if you have many orgs)

3. **Set up automated reminders:**
   - Add logic to show "Expires in 30 days" warnings
   - Email admins before contract end dates

4. **Add seat limit enforcement** (coming in next update)

---

## Questions?

If you run into issues, check:
1. Browser console for JavaScript errors
2. Memberstack dashboard for field names (exact match required)
3. Network tab to see if API calls are succeeding

Common issues:
- Field name typos (use exact names above)
- Wrong field location (data table vs. member fields)
- Memberstack script not loaded yet (wait for `memberstack.ready`)
