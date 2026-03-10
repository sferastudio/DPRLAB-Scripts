# Webflow Attributes Reference — DPR Admin Dashboard

## Organization Tab

### Stat Cards
| Element | Attribute | Value |
|---|---|---|
| Total orgs count | `v-text` | `totalOrgs` |
| Avg users per org | `v-text` | `avgUsersPerOrg` |

### Search & Filters
| Element | Attribute | Value |
|---|---|---|
| Search input | `v-model` | `orgSearchQuery` |
| Plan filter - All | `v-on:click` | `filterPlanAll()` |
| Plan filter - Foundational | `v-on:click` | `filterPlanFoundational()` |
| Plan filter - Facilitators | `v-on:click` | `filterPlanFacilitators()` |
| Plan filter - Cultural | `v-on:click` | `filterPlanCultural()` |
| Plan filter label | `v-text` | `currentPlanFilter()` |
| Status filter - All | `v-on:click` | `filterStatusAll()` |
| Status filter - Active | `v-on:click` | `filterStatusActive()` |
| Status filter - Trial | `v-on:click` | `filterStatusTrial()` |
| Status filter - Inactive | `v-on:click` | `filterStatusInactive()` |
| Status filter label | `v-text` | `currentStatusFilter()` |

### Error Banner
| Element | Attribute | Value |
|---|---|---|
| Error alert div | `v-if` | `orgError` |
| Error alert div | `v-text` | `orgError` |

### Loading State
| Element | Attribute | Value |
|---|---|---|
| Loading text/spinner | `v-if` | `loadingOrgs` |
| Org table wrapper | `v-if` | `!loadingOrgs` |

### Org Table (list)
| Element | Attribute | Value |
|---|---|---|
| Org row wrapper | `v-for` | `org in paginatedOrgs` |
| Org name | `v-text` | `org.name` |
| Org ID | `v-text` | `org.orgId` |
| Plan badge | `v-text` | `org.planDisplay` |
| Plan badge | `v-bind:class` | `getPlanClass(org.topPlan)` |
| Status badge | `v-text` | `org.status` |
| Status badge | `v-bind:class` | `getStatusClass(org)` |
| User count | `v-text` | `org.userCount` |
| Avg completion | `v-text` | `org.avgCompletion` |
| View detail button | `v-on:click` | `viewOrgDetail(org)` |
| Edit button | `v-on:click` | `showEditOrgForm(org)` |
| Delete button | `v-on:click` | `showDeleteConfirm(org)` |

### Pagination
| Element | Attribute | Value |
|---|---|---|
| Showing text | `v-text` | `orgShowingText` |
| Prev button | `v-on:click` | `orgPrevPage()` |
| Next button | `v-on:click` | `orgNextPage()` |
| Page number button | `v-for` | `p in orgPageNumbers` |
| Page number button | `v-text` | `p` |
| Page number button | `v-on:click` | `orgGoToPage(p)` |

### Add Org Modal (data-ref="orgAddModal")
| Element | Attribute | Value |
|---|---|---|
| Open button | `v-on:click` | `showCreateOrgForm()` |
| Org name input | `v-model` | `orgForm.organization_name` |
| Org name error | `v-if` | `orgForm.errors.organization_name` |
| Org name error | `v-text` | `orgForm.errors.organization_name` |
| Org ID input | `v-model` | `orgForm.organization_id` |
| Org ID error | `v-if` | `orgForm.errors.organization_id` |
| Org ID error | `v-text` | `orgForm.errors.organization_id` |
| Status select | `v-model` | `orgForm.subscription_status` |
| Foundational checkbox | `v-on:click` | `togglePlanFoundational()` |
| Foundational checkbox | `v-bind:checked` | `isPlanFoundational()` |
| Facilitators checkbox | `v-on:click` | `togglePlanFacilitators()` |
| Facilitators checkbox | `v-bind:checked` | `isPlanFacilitators()` |
| Cultural checkbox | `v-on:click` | `togglePlanCultural()` |
| Cultural checkbox | `v-bind:checked` | `isPlanCultural()` |
| Start date input | `data-ref` | `contractStartDate` |
| End date input | `data-ref` | `contractEndDate` |
| Save button | `v-on:click` | `saveOrg()` |
| Save button | `v-text` | `saveButtonText()` |
| Save button | `v-bind:disabled` | `savingOrg` |
| Cancel button | `v-on:click` | `cancelOrgForm()` |

### Edit Org Modal (data-ref="orgEditModal")
Same attributes as Add Org Modal above.

### Delete Confirm Modal (data-ref="orgDeleteModal")
| Element | Attribute | Value |
|---|---|---|
| Org name text | `v-text` | `orgDeleteConfirm.orgName` |
| User count text | `v-text` | `orgDeleteConfirm.userCount` |
| Confirm delete button | `v-on:click` | `confirmDeleteOrg()` |
| Cancel button | `v-on:click` | `cancelDelete()` |

### Org Detail Modal (data-ref="orgDetailModal")
| Element | Attribute | Value |
|---|---|---|
| Org name | `v-text` | `selectedOrg.name` |
| Org ID | `v-text` | `selectedOrg.orgId` |
| Status badge | `v-text` | `selectedOrg.status` |
| Status badge | `v-bind:class` | `getStatusClass(selectedOrg)` |
| Plan display | `v-text` | `selectedOrg.planDisplay` |
| User count | `v-text` | `selectedOrg.userCount` |
| Avg completion | `v-text` | `selectedOrg.avgCompletion` |
| Contract dates wrapper | `v-if` | `hasContractDates()` |
| Contract start | `v-text` | `orgContractStart()` |
| Contract end | `v-text` | `orgContractEnd()` |
| Close button | `v-on:click` | `closeOrgDetail()` |
| Edit button | `v-on:click` | `showEditOrgForm(selectedOrg)` |
| Member search input | `v-model` | `memberSearchQuery` |
| Member row | `v-for` | `member in filteredMembersForConnect` |
| Member name | `v-text` | `getMemberName(member)` |
| Member email | `v-text` | `getMemberEmail(member)` |
| Connect button | `v-on:click` | `connectMemberToOrg(member.id)` |
| Current member row | `v-for` | `member in selectedOrgUsers` |
| Disconnect button | `v-on:click` | `disconnectMemberFromOrg(member.id)` |

### CSV Export
| Element | Attribute | Value |
|---|---|---|
| Export orgs button | `v-on:click` | `exportOrgsCSV()` |
| Export users button | `v-on:click` | `exportUsersCSV()` |

---

## Users Tab

### Stat Cards
| Element | Attribute | Value |
|---|---|---|
| Total users | `v-text` | `totalNonAdminUsers` |
| Users with orgs | `v-text` | `usersWithOrgs` |
| New this month | `v-text` | `newThisMonth` |

### User Table
| Element | Attribute | Value |
|---|---|---|
| + Add User button | `v-on:click` | `showCreateUserForm()` |
| User row | `v-for` | `user in sortedMembers` |
| First name | `v-text` | `user.firstName` |
| Last name | `v-text` | `user.lastName` |
| Email | `v-text` | `user.email` |
| Role | `v-text` | `user.role` |
| Organization | `v-text` | `user.org` |
| Joined org date | `v-text` | `formatDate(user.joinedOrgDate)` |
| View detail button | `v-on:click` | `viewUserDetail(user)` |
| Edit button | `v-on:click` | `showEditUserForm(user)` |
| Delete button | `v-on:click` | `showDeleteUserConfirm(user)` |

### User Detail Modal (data-ref="userDetailModal")
| Element | Attribute | Value |
|---|---|---|
| Name | `v-text` | `userDetail.name` |
| Email | `v-text` | `userDetail.email` |
| Organization | `v-text` | `userDetail.org` |
| Role | `v-text` | `userDetail.role` |
| Plan(s) | `v-text` | `userDetail.plan` |
| Progress | `v-text` | `userDetail.progress` |
| Joined org date | `v-text` | `userDetail.joinedDate` |
| Account created | `v-text` | `userDetail.createdDate` |
| Topic row | `v-for` | `topic in userDetail.topics` |
| Topic name | `v-text` | `topic.name` |
| Total videos | `v-text` | `topic.totalVideos` |
| Completed videos | `v-text` | `topic.completedVideos` |
| Avg progress | `v-text` | `topic.avgProgress` |
| Total downloads | `v-text` | `userDetail.totalDownloads` |
| Total link clicks | `v-text` | `userDetail.totalLinkClicks` |
| Edit button | `v-on:click` | `editUserFromDetail()` |
| Delete button | `v-on:click` | `deleteUserFromDetail()` |
| Close button | `v-on:click` | `closeUserDetail()` |

### Add User Modal (data-ref="userAddModal")
| Element | Attribute | Value |
|---|---|---|
| First name input | `v-model` | `userForm.first_name` |
| First name error | `v-if` | `userForm.errors.first_name` |
| First name error | `v-text` | `userForm.errors.first_name` |
| Last name input | `v-model` | `userForm.last_name` |
| Last name error | `v-if` | `userForm.errors.last_name` |
| Last name error | `v-text` | `userForm.errors.last_name` |
| Email input | `v-model` | `userForm.email` |
| Email error | `v-if` | `userForm.errors.email` |
| Email error | `v-text` | `userForm.errors.email` |
| Role input | `v-model` | `userForm.role` |
| Org select | `data-ref` | `userOrgSelect` _(options populated dynamically via JS — no v-model or v-for needed)_ |
| Save button | `v-on:click` | `saveUser()` |
| Save button | `v-text` | `userSaveButtonText` |
| Save button | `v-bind:disabled` | `savingUser` |
| Cancel button | `v-on:click` | `cancelUserForm()` |

### Edit User Modal (data-ref="userEditModal")
Same attributes as Add User Modal above (except email input is not needed). The org select also uses `data-ref="userOrgSelect"` — options are populated dynamically.

### Delete User Confirm Modal (data-ref="userDeleteModal")
| Element | Attribute | Value |
|---|---|---|
| User name text | `v-text` | `userDeleteConfirm.memberName` |
| Confirm delete button | `v-on:click` | `confirmDeleteUser()` |
| Cancel button | `v-on:click` | `cancelUserDelete()` |

---

## Overview Tab

### Stat Cards
| Element | Attribute | Value |
|---|---|---|
| Total users | `v-text` | `totalUsers` |
| Total orgs | `v-text` | `totalOrgs` |
| Total topics | `v-text` | `totalTopics` |
| Total assets | `v-text` | `totalAssets` |
| Users with progress | `v-text` | `usersWithProgress` |
| Videos completed | `v-text` | `videosCompleted` |
| Videos in progress | `v-text` | `videosInProgress` |
| Avg completion | `v-text` | `avgCompletion` |

### Top Organizations
| Element | Attribute | Value |
|---|---|---|
| Org row | `v-for` | `org in topOrgs` |
| Org name | `v-text` | `org.name` |
| User count | `v-text` | `org.userCount` |
| Avg completion | `v-text` | `org.avgCompletion` |
| Top plan | `v-text` | `org.topPlan` |
| Status | `v-text` | `org.status` |

---

## Tab Navigation
| Element | Attribute | Value |
|---|---|---|
| Overview tab button | `v-on:click` | `setTab('overview')` |
| Organizations tab button | `v-on:click` | `setTab('organizations')` |
| Users tab button | `v-on:click` | `setTab('users')` |
| Usage tab button | `v-on:click` | `setTab('usage')` |
| Membership tab button | `v-on:click` | `setTab('membership')` |
| Downloads tab button | `v-on:click` | `setTab('downloads')` |

---

## External Dependencies

### Flatpickr (date pickers)
Add to site `<head>` custom code:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
```
