# Vue Bindings for Organization Modals in Webflow

Since Webflow interactions handle modal open/close, we only need to bind the **content** and **form fields** to Vue.

## 1. View Details Modal

### Dynamic Content to Bind

Find these elements in the "Organization Details" modal and add custom attributes:

| Element Text | Vue Binding | Custom Attribute to Add |
|---|---|---|
| "Acme Corporation" (org name heading) | `{{ selectedOrg.name }}` | Replace text with this |
| "acme-corp" (org ID) | `{{ selectedOrg.orgId }}` | Replace text |
| "Cultural Competency" (plan badge) | `{{ selectedOrg.topPlan }}` | Replace text |
| "Active" (status badge) | `{{ selectedOrg.status }}` | Replace text |
| "24" (users count) | `{{ selectedOrg.userCount }}` | Replace text |
| "68%" (avg completion) | `{{ selectedOrg.avgCompletion }}` | Replace text |
| "58" (downloads - if you have this) | Leave as placeholder or remove |

### Users Table in Modal

The users table rows need a `v-for` loop. Find the table row with "John Doe" and:

1. **Add attribute** to the row wrapper: `v-for="member in selectedOrg.users"` and `:key="member.id"`
2. **Replace** the static content:
   - "John Doe" → `{{ getMemberName(member) }}`
   - "johnd@email.com" → `{{ member.auth?.email || '' }}`
   - "72%" → `{{ getMemberProgress(member) }}`

## 2. Edit Organization Modal

### Form Field Bindings

| Field | Placeholder | Custom Attribute to Add |
|---|---|---|
| **Organization Name** input | "Acme Corporation" | `v-model="orgForm.organization_name"` |
| **Organization ID** text (read-only) | "acme-corp" | Replace with `{{ orgForm.organization_id }}` |
| **Plan** dropdown | Select element | `v-model="orgForm.topPlan"` (NEW field - add to orgForm in JS) |
| **Status** dropdown | Select element | `v-model="orgForm.status"` (NEW field - add to orgForm in JS) |

### Validation Error Messages

For the Organization Name field, add a div below the input with:
- **Conditional display**: `v-if="orgForm.errors.organization_name"`
- **Text**: `{{ orgForm.errors.organization_name }}`
- **Class**: Add a red text class

### Save Button

Find the form submit button or "Save" button and add:
- **Click event**: `@click="saveOrg"`
- **Disabled state**: `:disabled="savingOrg"`
- **Text binding** (optional): `{{ savingOrg ? 'Saving...' : 'Save Changes' }}`

## 3. Delete Confirmation Modal

### Dynamic Content

| Element | Current Text | Vue Binding |
|---|---|---|
| Organization name in warning | "Acme Corporation" | `{{ orgDeleteConfirm.orgName }}` |
| Users affected count | "24 users will be affected" | `{{ selectedOrg.userCount }} users will be affected` |

### Delete Button

Find the red "Delete Organization" button and add:
- **Click event**: `@click="confirmDeleteOrg"`
- **Disabled state**: `:disabled="savingOrg"`
- **Text binding** (optional): `{{ savingOrg ? 'Deleting...' : 'Delete Organization' }}`

### Cancel Button

Add: `@click="cancelDelete"` (though if Webflow interaction handles close, this may not be needed)

---

## JavaScript Updates Needed

I need to update the `orgForm` data to include the new `topPlan` and `status` fields:

```javascript
orgForm: {
  visible: false,
  mode: "create",
  editingRecordId: null,
  organization_name: "",
  organization_id: "",
  email_domain: "",
  topPlan: "",      // NEW
  status: "",       // NEW
  errors: {},
}
```

And update `showEditOrgForm()` to populate these:

```javascript
showEditOrgForm(org) {
  this.orgForm = {
    visible: true,
    mode: "edit",
    editingRecordId: org.recordId,
    organization_name: org.name,
    organization_id: org.orgId,
    email_domain: org.emailDomain,
    topPlan: org.topPlan,           // NEW
    status: org.status,             // NEW
    errors: {},
  };
},
```

**NOTE:** Plan and Status are NOT stored in the Memberstack org data table. They're **computed** from member data. If you want to save these, you'd need to add fields to the data table first.

---

## Quick Start Checklist

1. ✅ Add `v-model` attributes to form inputs in Edit modal
2. ✅ Replace static text with `{{ }}` Vue bindings in View modal
3. ✅ Add `v-for` to user table rows in View modal
4. ✅ Add `@click` handlers to Save and Delete buttons
5. ✅ Add validation error message divs with `v-if`
6. ✅ Update JS (I'll do this part)

Let me know when you're ready and I'll update the JavaScript file with the new form fields.
