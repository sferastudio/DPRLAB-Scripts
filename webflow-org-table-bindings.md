# Organization Table Vue Bindings

## Main Organization Table (the list that's not showing)

You need to add these Vue bindings to your Webflow organization table elements:

### 1. Search Input
Find the search input field and add:
- **Attribute**: `v-model="orgSearchQuery"`

### 2. Plan Filter Dropdown
Find the "All Plans" dropdown and add:
- **Attribute**: `v-model="orgPlanFilter"`
- **Value attribute on options**: The first option should have `value="all"`, then add dynamic options with `v-for="plan in orgPlanOptions"` `:value="plan"` and text `{{ plan }}`

### 3. Status Filter Dropdown
Find the status filter dropdown (if you have one) and add:
- **Attribute**: `v-model="orgStatusFilter"`
- **Options**: `<option value="all">All Status</option>`, then `v-for="status in orgStatusOptions"` `:value="status"` `{{ status }}`

### 4. **Table Row Loop (CRITICAL - this is why the list isn't showing!)**

Find the table row element that currently shows placeholder data (like "Acme Corporation"). This is the row you need to loop through:

**Add to the table row wrapper element:**
```
v-for="org in paginatedOrgs"
:key="org.recordId"
```

**Then replace the static content in each cell with:**

| Column Header | Current Placeholder | Replace With |
|---|---|---|
| **Organization ID** | "acme-corp" | `{{ org.orgId }}` |
| **Organization Name** | "Acme Corporation" | `{{ org.name }}` |
| **Plan** | "Cultural Competency" badge | `{{ org.topPlan }}` |
| **Users** | "24" | `{{ org.userCount }}` |
| **Avg Completion** | "68%" | `{{ org.avgCompletion }}` |
| **Status** | "Active" badge | `{{ org.status }}` |
| **Actions** | View/Edit/Delete buttons | Add click handlers (see below) |

### 5. Action Buttons in Each Row

**View Details Button:**
- **Attribute**: `@click="viewOrgDetail(org)"`

**Edit Button:**
- **Attribute**: `@click="showEditOrgForm(org)"`

**Delete Button:**
- **Attribute**: `@click="showDeleteConfirm(org)"`

### 6. Pagination Controls

**Previous Button:**
- **Attribute**: `@click="orgPage--"`
- **Disabled state**: `:disabled="orgPage <= 1"`

**Next Button:**
- **Attribute**: `@click="orgPage++"`
- **Disabled state**: `:disabled="orgPage >= orgTotalPages"`

**Page Number Buttons (if you have them):**
- **Loop**: `v-for="p in orgPageNumbers"` `:key="p"`
- **Text**: `{{ p }}`
- **Click**: `@click="orgPage = p"`
- **Active class**: `:class="{ 'active': p === orgPage }"`

**"Showing X-Y of Z" text:**
- Replace with: `{{ orgShowingText }}`

### 7. Loading State (optional but recommended)

Add a loading indicator div with:
```html
<div v-if="loadingOrgs">Loading organizations...</div>
```

### 8. Empty State (optional but recommended)

Add an empty state div with:
```html
<div v-if="!loadingOrgs && paginatedOrgs.length === 0">
  No organizations found. <a @click="showCreateOrgForm">Create your first organization</a>
</div>
```

### 9. Error State (optional but recommended)

Add an error message div with:
```html
<div v-if="orgError" class="error-message">
  {{ orgError }}
</div>
```

---

## Quick Example Structure

Your table should look something like this:

```html
<!-- Search and filters -->
<input type="text" placeholder="Search organizations..." v-model="orgSearchQuery">
<select v-model="orgPlanFilter">
  <option value="all">All Plans</option>
  <option v-for="plan in orgPlanOptions" :key="plan" :value="plan">{{ plan }}</option>
</select>

<!-- Loading state -->
<div v-if="loadingOrgs">Loading...</div>

<!-- Error state -->
<div v-if="orgError" class="error">{{ orgError }}</div>

<!-- Table -->
<table v-if="!loadingOrgs">
  <thead>
    <tr>
      <th>Org ID</th>
      <th>Name</th>
      <th>Plan</th>
      <th>Users</th>
      <th>Completion</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <!-- THIS IS THE KEY PART - add v-for to this row -->
    <tr v-for="org in paginatedOrgs" :key="org.recordId">
      <td>{{ org.orgId }}</td>
      <td>{{ org.name }}</td>
      <td>{{ org.topPlan }}</td>
      <td>{{ org.userCount }}</td>
      <td>{{ org.avgCompletion }}</td>
      <td>{{ org.status }}</td>
      <td>
        <button @click="viewOrgDetail(org)">View</button>
        <button @click="showEditOrgForm(org)">Edit</button>
        <button @click="showDeleteConfirm(org)">Delete</button>
      </td>
    </tr>
  </tbody>
</table>

<!-- Pagination -->
<div class="pagination">
  <span>{{ orgShowingText }}</span>
  <button @click="orgPage--" :disabled="orgPage <= 1">Previous</button>
  <button @click="orgPage++" :disabled="orgPage >= orgTotalPages">Next</button>
</div>
```

---

## Debugging Checklist

If the list still doesn't show:

1. **Open browser console** (F12) and check for:
   - ✅ "[Admin Dashboard] Loaded X organizations" message
   - ❌ Any JavaScript errors (red text)

2. **In console, type**: `$memberstackDom`
   - Should show an object, not `undefined`

3. **In console, type**:
   ```javascript
   app._instance.data.organizations
   ```
   - Should show your organization records array

4. **Check your table row element in Webflow:**
   - Make sure `v-for="org in paginatedOrgs"` is on the correct wrapper element
   - Make sure `:key="org.recordId"` is also on the same element

5. **Verify the Vue app is mounted:**
   - Your page should have `<div id="admin-dashboard">` wrapping everything
   - The script should end with `.mount("#admin-dashboard")`
