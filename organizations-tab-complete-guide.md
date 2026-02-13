# Complete Organizations Tab Binding Guide

This guide shows EVERYTHING that should be in your Organizations tab and the exact Vue bindings needed.

---

## 🔍 SECTION 1: Search & Filters (Toolbar)

### Search Input Box
- **Element**: `<input>` for searching organizations
- **Attribute**: `v-model="orgSearchQuery"`
- **Placeholder**: "Search Organization"

### Plan Filter Dropdown
Your Webflow dropdown needs to be replaced with a real HTML `<select>` element:

```html
<select v-model="orgPlanFilter">
  <option value="all">All Plans</option>
  <option v-for="plan in orgPlanOptions" :key="plan" :value="plan">{{ plan }}</option>
</select>
```

**Alternative if you keep Webflow dropdown**: Remove it for now and handle it later.

### Status Filter Dropdown (Optional - can skip for now)
Same as above - needs to be a real `<select>` or skip it.

---

## 📊 SECTION 2: Organization Table

### Table Header Row
Should have these column headers:
- **Column 1**: Organizations ID (or ORGANIZATION)
- **Column 2**: Plan
- **Column 3**: Users
- **Column 4**: Avg Completion (or COMPLETION)
- **Column 5**: Status
- **Column 6**: (Empty for action buttons)

### Table Data Row (THE CRITICAL PART!)

**This is the row you added the v-for to. It should have:**

1. **On the row wrapper div** (the parent div containing all cells):
   - `v-for="org in paginatedOrgs"`
   - `:key="org.recordId"`

2. **Inside the row, the cells should display**:

   **Cell 1 - Organization Name & ID**:
   ```
   {{ org.name }}
   {{ org.orgId }}
   ```

   **Cell 2 - Plan**:
   ```
   {{ org.topPlan }}
   ```

   **Cell 3 - User Count**:
   ```
   {{ org.userCount }}
   ```

   **Cell 4 - Completion** (with progress bar):
   ```
   {{ org.avgCompletion }}
   ```
   The JavaScript code will automatically add a progress bar here via `enhanceOrgTable()`.

   **Cell 5 - Status**:
   The JavaScript will automatically inject status badges via `enhanceOrgTable()`.

   **Cell 6 - Action Buttons**:
   The JavaScript will automatically add View/Edit/Delete buttons via `enhanceOrgTable()`.

### Loading State (Optional but recommended)
```html
<div v-if="loadingOrgs">Loading organizations...</div>
```

### Empty State (Optional but recommended)
```html
<div v-if="!loadingOrgs && paginatedOrgs.length === 0">
  No organizations found
</div>
```

### Error State (Optional but recommended)
```html
<div v-if="orgError" class="error">{{ orgError }}</div>
```

---

## 📄 SECTION 3: Pagination

### "Showing X-Y of Z" Text
```
{{ orgShowingText }}
```

### Previous Button
- **Attribute**: `@click="orgPrevPage"`
- **Disabled state**: `:disabled="orgPage <= 1"`

### Next Button
- **Attribute**: `@click="orgNextPage"`
- **Disabled state**: `:disabled="orgPage >= orgTotalPages"`

### Page Numbers (Optional)
```html
<button v-for="p in orgPageNumbers" :key="p" @click="orgPage = p" :class="{ 'active': p === orgPage }">
  {{ p }}
</button>
```

---

## 🔷 MODAL 1: View Details Modal

### Modal Structure
The modal should have Webflow's modal wrapper (which handles show/hide), but the **content inside** needs Vue bindings.

### Bindings for View Details Modal:

**Organization Name**:
```
{{ selectedOrg?.name || '' }}
```

**Organization ID**:
```
{{ selectedOrg?.orgId || '' }}
```

**Email Domain**:
```
{{ selectedOrg?.emailDomain || '' }}
```

**User Count**:
```
{{ selectedOrg?.userCount || 0 }}
```

**Average Completion**:
```
{{ selectedOrg?.avgCompletion || '0%' }}
```

**Top Plan**:
```
{{ selectedOrg?.topPlan || 'None' }}
```

**Status**:
```
{{ selectedOrg?.status || 'Inactive' }}
```

**Created Date** (if you have this):
```
{{ formatDate(selectedOrg?.createdAt) }}
```

### Members Table in View Details Modal

**Search input for members**:
```
v-model="memberSearchQuery"
```

**Table row loop**:
```html
<div v-for="member in (selectedOrg?.users || [])" :key="member.id">
  <!-- Member name -->
  {{ getMemberName(member) }}

  <!-- Member email -->
  {{ member.auth?.email || '' }}

  <!-- Member plan -->
  {{ getMemberPlans(member) }}

  <!-- Disconnect button -->
  <button @click="disconnectMemberFromOrg(member.id)">Remove</button>
</div>
```

**"Add Member" section** (if you have this):
```html
<div v-for="member in filteredMembersForConnect" :key="member.id">
  {{ getMemberName(member) }}
  <button @click="connectMemberToOrg(member.id)">Add</button>
</div>
```

**Close button**:
```
@click="closeOrgDetail"
```

---

## 🔷 MODAL 2: Edit/Create Modal

### Form Fields

**Organization Name Input**:
```
v-model="orgForm.organization_name"
```

**Organization ID Input**:
```
v-model="orgForm.organization_id"
```

**Email Domain Input**:
```
v-model="orgForm.email_domain"
```

**Error Messages** (if you want to show validation errors):
```
{{ orgForm.errors.organization_name }}
{{ orgForm.errors.organization_id }}
{{ orgForm.errors.email_domain }}
```

**Save Button**:
```
@click="saveOrg"
:disabled="savingOrg"
```

**Cancel Button**:
```
@click="cancelOrgForm"
```

**Note**: Plan and Status dropdowns should NOT be in the edit form (they're computed fields).

---

## 🔷 MODAL 3: Delete Confirmation Modal

**Organization Name to Delete**:
```
{{ orgDeleteConfirm?.orgName || '' }}
```

**User Count Warning** (optional):
```
{{ selectedOrg?.userCount || 0 }}
```

**Confirm Delete Button**:
```
@click="confirmDeleteOrg"
:disabled="savingOrg"
```

**Cancel Button**:
```
@click="cancelDelete"
```

---

## ✅ CRITICAL CHECKLIST

Go through this checklist in your Webflow page:

### Main Table:
- [ ] Search input has `v-model="orgSearchQuery"`
- [ ] Table row wrapper has `v-for="org in paginatedOrgs"` AND `:key="org.recordId"`
- [ ] Inside cells: `{{ org.name }}`, `{{ org.orgId }}`, `{{ org.topPlan }}`, `{{ org.userCount }}`, `{{ org.avgCompletion }}`
- [ ] Pagination text shows `{{ orgShowingText }}`
- [ ] Prev button has `@click="orgPrevPage"`
- [ ] Next button has `@click="orgNextPage"`

### View Details Modal:
- [ ] Uses `{{ selectedOrg?.name }}` (with `?`) for all fields
- [ ] Member table has `v-for="member in (selectedOrg?.users || [])"`
- [ ] Close button has `@click="closeOrgDetail"`

### Edit Modal:
- [ ] Form inputs have `v-model="orgForm.organization_name"`, etc.
- [ ] Save button has `@click="saveOrg"`
- [ ] Cancel button has `@click="cancelOrgForm"`

### Delete Modal:
- [ ] Shows `{{ orgDeleteConfirm?.orgName }}`
- [ ] Confirm button has `@click="confirmDeleteOrg"`
- [ ] Cancel button has `@click="cancelDelete"`

---

## 🚨 COMMON MISTAKES TO AVOID

1. **Forgetting the `?` in modal bindings** → Use `selectedOrg?.name`, not `selectedOrg.name`
2. **Wrong v-for placement** → Must be on the row wrapper, not on individual cells
3. **Missing :key** → Always add `:key` with v-for
4. **Using Webflow dropdowns with v-model** → Won't work, use real `<select>` elements
5. **Putting v-if on modal wrapper** → This breaks Webflow interactions

---

## 🛠️ HOW TO DEBUG

1. **Check console for errors**
2. **Test in console**:
   ```javascript
   app._instance.data.paginatedOrgs  // Should show array of orgs
   app._instance.data.selectedOrg     // Should be null until you click view
   app._instance.data.orgSearchQuery  // Should change when you type
   ```
3. **Check Vue attributes in Inspect Element** → Right-click row → Inspect → verify v-for exists
