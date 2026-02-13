// dpr-admin-dashboard.js
// Vue-powered admin dashboard — fetches members from Vercel API proxy

const { createApp } = Vue;

// Replace with your Vercel deployment URL after deploying
const MEMBERS_API_URL =
  "https://dprlab.vercel.app/api/members";
const CMS_COUNTS_URL =
  "https://dprlab.vercel.app/api/cms-counts";

const ORG_TABLE_KEY = "organization";

const app = createApp({
  data() {
    return {
      loadingData: true,
      error: null,
      members: [],
      cmsCounts: { totalTopics: 0, totalAssets: 0 },
      selectedMember: null,
      view: {
        tab: "overview",
      },

      // Organization CRUD state
      organizations: [],
      loadingOrgs: false,
      orgError: null,
      savingOrg: false,
      orgForm: {
        visible: false,
        mode: "create",
        editingRecordId: null,
        organization_name: "",
        organization_id: "",
        email_domain: "",
        plan: "",
        subscription_status: "trial",
        contract_start_date: "",
        contract_end_date: "",
        errors: {},
      },
      orgDeleteConfirm: {
        visible: false,
        recordId: null,
        orgName: "",
        userCount: 0,
      },
      selectedOrg: null,
      orgDetailView: false,
      memberSearchQuery: "",

      // Organization list filters & pagination
      orgSearchQuery: "",
      orgPlanFilter: "all",
      orgStatusFilter: "all",
      orgPage: 1,
      orgPerPage: 5,
    };
  },

  watch: {
    orgSearchQuery() {
      this.orgPage = 1;
    },
    orgPlanFilter() {
      this.orgPage = 1;
    },
    orgStatusFilter() {
      this.orgPage = 1;
    },
  },

  computed: {
    /* ───────────────────────────────────────────
     * SHARED / OVERVIEW
     * ─────────────────────────────────────────── */
    totalUsers() {
      return this.members.length;
    },

    totalOrgs() {
      return this.orgList.length;
    },

    totalTopics() {
      return this.cmsCounts.totalTopics;
    },

    totalAssets() {
      return this.cmsCounts.totalAssets;
    },

    usersWithProgress() {
      return this.members.filter((m) => this.getVideoData(m).watched.length > 0).length;
    },

    videosCompleted() {
      let count = 0;
      this.members.forEach((m) => {
        count += this.getVideoData(m).watched.filter((v) => v.completed).length;
      });
      return count;
    },

    videosInProgress() {
      let count = 0;
      this.members.forEach((m) => {
        count += this.getVideoData(m).watched.filter((v) => v.started && !v.completed).length;
      });
      return count;
    },

    avgCompletion() {
      const usersWithVideos = this.members.filter(
        (m) => this.getVideoData(m).watched.length > 0
      );
      if (usersWithVideos.length === 0) return "0%";

      let totalPercent = 0;
      usersWithVideos.forEach((m) => {
        const vd = this.getVideoData(m);
        const avg =
          vd.watched.reduce((sum, v) => sum + (v.percent_watched || 0), 0) /
          vd.watched.length;
        totalPercent += avg;
      });

      return Math.round(totalPercent / usersWithVideos.length) + "%";
    },

    // Group members by org-id
    orgList() {
      const orgs = {};
      this.members.forEach((member) => {
        const orgId = member.customFields?.["org-id"] || "no-org";
        const orgName = member.customFields?.["org-name"] || "No Organization";
        if (!orgs[orgId]) {
          orgs[orgId] = { id: orgId, name: orgName, users: [] };
        }
        orgs[orgId].users.push(member);
      });
      return Object.values(orgs);
    },

    // Orgs enriched with completion + top plan, sorted by completion desc
    topOrgs() {
      return this.orgList
        .map((org) => {
          const hasActivePlan = org.users.some((m) =>
            (m.planConnections || []).some((c) => c.status === "ACTIVE")
          );
          return {
            id: org.id,
            name: org.name,
            userCount: org.users.length,
            avgCompletion: this.getOrgProgress(org),
            completionNum: this._getOrgCompletionNum(org),
            topPlan: this._getOrgTopPlan(org),
            status: org.users.length > 0 ? (hasActivePlan ? "Active" : "Trial") : "Inactive",
          };
        })
        .sort((a, b) => b.completionNum - a.completionNum);
    },

    /* ───────────────────────────────────────────
     * ORGANIZATIONS TAB
     * ─────────────────────────────────────────── */
    avgUsersPerOrg() {
      if (this.orgList.length === 0) return "0";
      return (this.members.length / this.orgList.length).toFixed(1);
    },

    // Organizations from data table, enriched with member analytics
    // Vue template bindings: v-for="org in enrichedOrgs"
    //   org.recordId, org.orgId, org.name, org.emailDomain,
    //   org.userCount, org.users, org.avgCompletion, org.topPlan, org.createdAt
    enrichedOrgs() {
      return this.organizations
        .map((orgRecord) => {
          const orgId = orgRecord.data.organization_id;
          const orgMembers = this.members.filter(
            (m) => m.customFields?.["org-id"] === orgId
          );
          const orgObj = { id: orgId, name: orgRecord.data.organization_name, users: orgMembers };

          const planRaw = orgRecord.data.subscription_plan || "";
          const plans = planRaw ? planRaw.split(",").map((p) => p.trim()).filter(Boolean) : [];
          const hasActivePlan = orgMembers.some((m) =>
            (m.planConnections || []).some((c) => c.status === "ACTIVE")
          );

          return {
            recordId: orgRecord.id,
            orgId: orgId,
            name: orgRecord.data.organization_name,
            emailDomain: orgRecord.data.email_domain,
            plans: plans,
            planDisplay: plans.length > 0 ? plans.join(", ") : "None",
            subscriptionStatus: orgRecord.data.subscription_status || "trial",
            contractStartDate: orgRecord.data.contract_start_date || null,
            contractEndDate: orgRecord.data.contract_end_date || null,
            userCount: orgMembers.length,
            users: orgMembers,
            avgCompletion: this.getOrgProgress(orgObj),
            completionNum: this._getOrgCompletionNum(orgObj),
            topPlan: plans[0] || "None",
            planClass: this._getPlanClass(plans[0]),
            status: orgRecord.data.subscription_status || (orgMembers.length > 0 ? (hasActivePlan ? "Active" : "Trial") : "Inactive"),
            totalDownloads: orgMembers.reduce((sum, m) => {
              const ad = this._getActivityData(m);
              return sum + ad.downloads.reduce((s, d) => s + (d.count || 1), 0);
            }, 0),
            createdAt: orgRecord.createdAt,
            _raw: orgRecord,
          };
        })
        .sort((a, b) => b.completionNum - a.completionNum);
    },

    // Members filtered by search query for the "add member to org" UI
    // Vue template: v-for="member in filteredMembersForConnect"
    filteredMembersForConnect() {
      const query = this.memberSearchQuery.toLowerCase().trim();
      if (!query) return this.members.slice(0, 20);
      return this.members
        .filter((m) => {
          const name = this.getMemberName(m).toLowerCase();
          const email = (m.auth?.email || "").toLowerCase();
          return name.includes(query) || email.includes(query);
        })
        .slice(0, 20);
    },

    // Orgs after search + plan filter (before pagination)
    filteredOrgs() {
      let orgs = this.enrichedOrgs;

      // Search by name or org ID
      const q = this.orgSearchQuery.toLowerCase().trim();
      if (q) {
        orgs = orgs.filter(
          (o) =>
            o.name.toLowerCase().includes(q) ||
            o.orgId.toLowerCase().includes(q)
        );
      }

      // Filter by plan (match any of the org's plans)
      if (this.orgPlanFilter !== "all") {
        orgs = orgs.filter((o) => o.plans.includes(this.orgPlanFilter));
      }

      // Filter by status
      if (this.orgStatusFilter !== "all") {
        orgs = orgs.filter((o) => o.status === this.orgStatusFilter);
      }

      return orgs;
    },

    // Paginated slice of filteredOrgs
    // Vue template: v-for="org in paginatedOrgs"
    paginatedOrgs() {
      const start = (this.orgPage - 1) * this.orgPerPage;
      return this.filteredOrgs.slice(start, start + this.orgPerPage);
    },

    orgTotalPages() {
      return Math.max(1, Math.ceil(this.filteredOrgs.length / this.orgPerPage));
    },

    // Array of page numbers for pagination buttons
    // Vue template: v-for="p in orgPageNumbers"
    orgPageNumbers() {
      const pages = [];
      for (let i = 1; i <= this.orgTotalPages; i++) {
        pages.push(i);
      }
      return pages;
    },

    // "Showing X-Y of Z organizations" text
    orgShowingText() {
      const total = this.filteredOrgs.length;
      if (total === 0) return "No organizations found";
      const start = (this.orgPage - 1) * this.orgPerPage + 1;
      const end = Math.min(this.orgPage * this.orgPerPage, total);
      return `Showing ${start}-${end} of ${total} organizations`;
    },

    // Unique plan names for the filter dropdown
    // Vue template: <option v-for="plan in orgPlanOptions" :value="plan">{{ plan }}</option>
    orgPlanOptions() {
      const plans = new Set();
      this.enrichedOrgs.forEach((o) => {
        o.plans.forEach((p) => plans.add(p));
      });
      return Array.from(plans).sort();
    },

    orgStatusOptions() {
      const statuses = new Set();
      this.enrichedOrgs.forEach((o) => {
        if (o.status) statuses.add(o.status);
      });
      return Array.from(statuses).sort();
    },

    /* ───────────────────────────────────────────
     * USERS TAB
     * ─────────────────────────────────────────── */
    usersWithOrgs() {
      return this.members.filter(
        (m) => m.customFields?.["org-id"] && m.customFields["org-id"] !== "no-org"
      ).length;
    },

    newThisMonth() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return this.members.filter((m) => {
        if (!m.createdAt) return false;
        return new Date(m.createdAt) >= monthStart;
      }).length;
    },

    sortedMembers() {
      return [...this.members]
        .map((m) => ({
          _raw: m,
          firstName: m.customFields?.["first-name"] || "",
          lastName: m.customFields?.["last-name"] || "",
          email: m.auth?.email || "",
          org: m.customFields?.["org-name"] || "No Organization",
          plan: this.getMemberPlans(m),
          progress: this.getMemberProgress(m),
          progressNum: parseInt(this.getMemberProgress(m)) || 0,
          joinedOrgDate: m.customFields?.["joined-org-date"] || null,
          role: m.customFields?.["role"] || "",
        }))
        .sort((a, b) => a.firstName.localeCompare(b.firstName));
    },

    /* ───────────────────────────────────────────
     * USAGE TAB
     * ─────────────────────────────────────────── */
    topOrgsByCompletion() {
      return this.topOrgs.slice(0, 5);
    },

    completionByTopic() {
      const topics = {};
      this.members.forEach((m) => {
        const vd = this.getVideoData(m);
        vd.watched.forEach((v) => {
          (v.topics || []).forEach((slug) => {
            if (!topics[slug]) {
              topics[slug] = {
                slug,
                name: this._formatTopicName(slug),
                total: 0,
                completed: 0,
              };
            }
            topics[slug].total++;
            if (v.completed) topics[slug].completed++;
          });
        });
      });
      return Object.values(topics)
        .map((t) => ({
          ...t,
          rate: t.total > 0 ? Math.round((t.completed / t.total) * 100) + "%" : "0%",
          rateNum: t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0,
        }))
        .sort((a, b) => b.rateNum - a.rateNum);
    },

    topAssets() {
      const assets = {};
      this.members.forEach((m) => {
        const vd = this.getVideoData(m);
        vd.watched.forEach((v) => {
          const id = v.id || v.slug;
          if (!id) return;
          if (!assets[id]) {
            assets[id] = {
              id,
              title: v.title || id,
              topic: (v.topics || [])[0] || "",
              topicName: this._formatTopicName((v.topics || [])[0] || ""),
              completions: 0,
              type: v.type || "Video",
            };
          }
          if (v.completed) assets[id].completions++;
        });
      });
      return Object.values(assets)
        .sort((a, b) => b.completions - a.completions)
        .slice(0, 6);
    },

    /* ───────────────────────────────────────────
     * MEMBERSHIP TAB
     * ─────────────────────────────────────────── */
    orgsByPlan() {
      const counts = {};
      this.orgList.forEach((org) => {
        const plan = this._getOrgTopPlan(org);
        counts[plan] = (counts[plan] || 0) + 1;
      });
      const total = this.orgList.length || 1;
      return Object.entries(counts)
        .map(([name, count]) => ({
          name,
          count,
          percent: Math.round((count / total) * 100) + "%",
          percentNum: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count);
    },

    usersByPlan() {
      const counts = {};
      this.members.forEach((m) => {
        const planName =
          (m.planConnections || []).map((c) => c.planName).filter(Boolean)[0] || "None";
        counts[planName] = (counts[planName] || 0) + 1;
      });
      const total = this.members.length || 1;
      return Object.entries(counts)
        .map(([name, count]) => ({
          name,
          count,
          percent: Math.round((count / total) * 100) + "%",
          percentNum: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count);
    },

    planDetails() {
      const details = {};
      this.members.forEach((m) => {
        const planName =
          (m.planConnections || []).map((c) => c.planName).filter(Boolean)[0] || "None";
        if (!details[planName]) {
          details[planName] = {
            name: planName,
            orgs: new Set(),
            users: 0,
            totalProgress: 0,
            progressCount: 0,
          };
        }
        details[planName].users++;
        const orgId = m.customFields?.["org-id"];
        if (orgId && orgId !== "no-org") details[planName].orgs.add(orgId);
        const vd = this.getVideoData(m);
        if (vd.watched.length > 0) {
          const avg =
            vd.watched.reduce((sum, v) => sum + (v.percent_watched || 0), 0) /
            vd.watched.length;
          details[planName].totalProgress += avg;
          details[planName].progressCount++;
        }
      });

      return Object.values(details).map((d) => ({
        name: d.name,
        orgCount: d.orgs.size,
        userCount: d.users,
        avgCompletion:
          d.progressCount > 0
            ? Math.round(d.totalProgress / d.progressCount) + "%"
            : "0%",
      }));
    },

    /* ───────────────────────────────────────────
     * DOWNLOADS & LINKS TAB
     * ─────────────────────────────────────────── */
    totalDownloads() {
      let count = 0;
      this.members.forEach((m) => {
        const ad = this._getActivityData(m);
        ad.downloads.forEach((d) => {
          count += d.count || 1;
        });
      });
      return count;
    },

    totalLinkClicks() {
      let count = 0;
      this.members.forEach((m) => {
        const ad = this._getActivityData(m);
        ad.clicks.forEach((c) => {
          count += c.count || 1;
        });
      });
      return count;
    },

    topDownloads() {
      const items = {};
      this.members.forEach((m) => {
        const ad = this._getActivityData(m);
        ad.downloads.forEach((d) => {
          if (!items[d.slug]) {
            items[d.slug] = {
              slug: d.slug,
              name: d.name || d.slug,
              topic: this._formatTopicName(d.topic || ""),
              downloads: 0,
            };
          }
          items[d.slug].downloads += d.count || 1;
        });
      });
      return Object.values(items)
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, 10);
    },

    topLinkClicks() {
      const items = {};
      this.members.forEach((m) => {
        const ad = this._getActivityData(m);
        ad.clicks.forEach((c) => {
          if (!items[c.slug]) {
            items[c.slug] = {
              slug: c.slug,
              name: c.name || c.slug,
              topic: this._formatTopicName(c.topic || ""),
              clicks: 0,
            };
          }
          items[c.slug].clicks += c.count || 1;
        });
      });
      return Object.values(items)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);
    },

  },

  methods: {
    async fetchData() {
      this.loadingData = true;
      this.error = null;

      try {
        const response = await fetch(MEMBERS_API_URL);

        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        this.members = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("[Admin Dashboard] Fetch failed:", err);
        this.error = err.message;
      } finally {
        this.loadingData = false;
      }
    },

    // Parse video-data JSON string from customFields
    getVideoData(member) {
      const raw = member.customFields?.["video-data"];
      if (!raw) return { watched: [] };
      try {
        return JSON.parse(raw);
      } catch {
        return { watched: [] };
      }
    },

    getMemberName(member) {
      const first = member.customFields?.["first-name"] || "";
      const last = member.customFields?.["last-name"] || "";
      return `${first} ${last}`.trim() || "Unknown";
    },

    getMemberOrg(member) {
      return member.customFields?.["org-name"] || "No Organization";
    },

    getMemberEmail(member) {
      return member.auth?.email || "";
    },

    saveButtonText() {
      return this.savingOrg ? "Saving..." : "Save";
    },

    getMemberPlans(member) {
      return (member.planConnections || []).map((conn) => conn.planName).join(", ") || "None";
    },

    getMemberProgress(member) {
      const vd = this.getVideoData(member);
      if (vd.watched.length === 0) return "0%";
      const avg =
        vd.watched.reduce((sum, v) => sum + (v.percent_watched || 0), 0) /
        vd.watched.length;
      return Math.round(avg) + "%";
    },

    getOrgProgress(org) {
      if (org.users.length === 0) return "0%";
      let total = 0;
      let count = 0;
      org.users.forEach((m) => {
        const vd = this.getVideoData(m);
        if (vd.watched.length > 0) {
          const avg =
            vd.watched.reduce((sum, v) => sum + (v.percent_watched || 0), 0) /
            vd.watched.length;
          total += avg;
          count++;
        }
      });
      return count > 0 ? Math.round(total / count) + "%" : "0%";
    },

    // Internal helpers
    _getActivityData(member) {
      const raw = member.customFields?.["activity-data"];
      if (!raw) return { downloads: [], clicks: [] };
      try {
        const data = JSON.parse(raw);
        return {
          downloads: data.downloads || [],
          clicks: data.clicks || [],
        };
      } catch {
        return { downloads: [], clicks: [] };
      }
    },

    _getOrgCompletionNum(org) {
      if (org.users.length === 0) return 0;
      let total = 0;
      let count = 0;
      org.users.forEach((m) => {
        const vd = this.getVideoData(m);
        if (vd.watched.length > 0) {
          const avg =
            vd.watched.reduce((sum, v) => sum + (v.percent_watched || 0), 0) /
            vd.watched.length;
          total += avg;
          count++;
        }
      });
      return count > 0 ? Math.round(total / count) : 0;
    },

    _getOrgTopPlan(org) {
      const planCounts = {};
      org.users.forEach((m) => {
        (m.planConnections || []).forEach((conn) => {
          if (conn.planName) {
            planCounts[conn.planName] = (planCounts[conn.planName] || 0) + 1;
          }
        });
      });
      const sorted = Object.entries(planCounts).sort((a, b) => b[1] - a[1]);
      return sorted.length > 0 ? sorted[0][0] : "None";
    },

    _formatTopicName(slug) {
      if (!slug) return "Unknown";
      return slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    },

    _getPlanClass(planName) {
      if (!planName) return "plan-none";
      const slug = planName.toLowerCase().replace(/\s+/g, "-");
      return "plan-" + slug;
    },

    /* ───────────────────────────────────────────
     * ORGANIZATION CRUD
     * ─────────────────────────────────────────── */

    async fetchOrganizations() {
      this.loadingOrgs = true;
      this.orgError = null;

      try {
        const memberstack = window.$memberstackDom;
        if (!memberstack) throw new Error("Memberstack not available");

        const result = await memberstack.getDataRecords({
          table: ORG_TABLE_KEY,
          limit: 100,
        });

        console.log("[Admin Dashboard] Raw org data table response:", result);
        this.organizations = result?.data?.records || [];
      } catch (err) {
        console.error("[Admin Dashboard] Fetch orgs failed:", err);
        this.orgError = err.message || "Failed to load organizations";
      } finally {
        this.loadingOrgs = false;
      }
    },

    showCreateOrgForm() {
      this.orgForm = {
        visible: true,
        mode: "create",
        editingRecordId: null,
        organization_name: "",
        organization_id: "",
        email_domain: "",
        plan: "",
        subscription_status: "trial",
        contract_start_date: "",
        contract_end_date: "",
        errors: {},
      };

      // Manually remove .hide class because it has !important
      this.$nextTick(() => {
        const modal = document.querySelector('[data-ref="orgFormModal"]');
        if (modal) {
          modal.classList.remove('hide');
          console.log("✅ Opened create org form");
        }
      });
    },

    showEditOrgForm(org) {
      this.orgForm = {
        visible: true,
        mode: "edit",
        editingRecordId: org.recordId,
        organization_name: org.name,
        organization_id: org.orgId,
        email_domain: org.emailDomain,
        plan: org.planDisplay !== "None" ? org.planDisplay : "",
        subscription_status: org.subscriptionStatus || "trial",
        contract_start_date: org.contractStartDate || "",
        contract_end_date: org.contractEndDate || "",
        errors: {},
      };

      // Manually remove .hide class because it has !important
      this.$nextTick(() => {
        const modal = document.querySelector('[data-ref="orgFormModal"]');
        if (modal) {
          modal.classList.remove('hide');
          console.log("✅ Opened edit org form for:", org.name);
        }
      });
    },

    cancelOrgForm() {
      this.orgForm.visible = false;

      // Manually add .hide class because it has !important
      const modal = document.querySelector('[data-ref="orgFormModal"]');
      if (modal) {
        modal.classList.add('hide');
        console.log("✅ Closed org form");
      }
    },

    validateOrgForm() {
      const errors = {};
      if (!this.orgForm.organization_name.trim()) {
        errors.organization_name = "Organization name is required";
      }
      if (!this.orgForm.organization_id.trim()) {
        errors.organization_id = "Organization ID is required";
      } else if (!/^[a-z0-9_-]+$/.test(this.orgForm.organization_id.trim())) {
        errors.organization_id = "ID must be lowercase alphanumeric, hyphens, or underscores";
      }
      if (!this.orgForm.email_domain.trim()) {
        errors.email_domain = "Email domain is required";
      } else if (!this.orgForm.email_domain.trim().startsWith("@")) {
        errors.email_domain = "Email domain must start with @";
      }

      // Check duplicate org ID on create
      if (this.orgForm.mode === "create") {
        const exists = this.organizations.some(
          (o) => o.data.organization_id === this.orgForm.organization_id.trim()
        );
        if (exists) {
          errors.organization_id = "An organization with this ID already exists";
        }
      }

      this.orgForm.errors = errors;
      return Object.keys(errors).length === 0;
    },

    async saveOrg() {
      if (!this.validateOrgForm()) return;

      this.savingOrg = true;
      this.orgError = null;

      try {
        const memberstack = window.$memberstackDom;
        if (!memberstack) throw new Error("Memberstack not available");

        const orgData = {
          organization_name: this.orgForm.organization_name.trim(),
          organization_id: this.orgForm.organization_id.trim(),
          email_domain: this.orgForm.email_domain.trim(),
          plan: this.orgForm.plan || null,
          subscription_status: this.orgForm.subscription_status || "trial",
          contract_start_date: this.orgForm.contract_start_date || null,
          contract_end_date: this.orgForm.contract_end_date || null,
        };

        if (this.orgForm.mode === "create") {
          await memberstack.createDataRecord({
            table: ORG_TABLE_KEY,
            data: orgData,
          });
          console.log("[Admin Dashboard] Created org:", orgData.organization_name);
        } else {
          await memberstack.updateDataRecord({
            recordId: this.orgForm.editingRecordId,
            data: orgData,
          });
          console.log("[Admin Dashboard] Updated org:", orgData.organization_name);
        }

        this.orgForm.visible = false;

        // Manually add .hide class because it has !important
        const modal = document.querySelector('[data-ref="orgFormModal"]');
        if (modal) {
          modal.classList.add('hide');
          console.log("✅ Closed org form after save");
        }

        await this.fetchOrganizations();
      } catch (err) {
        console.error("[Admin Dashboard] Save org failed:", err);
        this.orgError = err.message || "Failed to save organization";
      } finally {
        this.savingOrg = false;
      }
    },

    showDeleteConfirm(org) {
      this.orgDeleteConfirm = {
        visible: true,
        recordId: org.recordId,
        orgName: org.name,
        userCount: org.userCount || 0,
      };
      this.$nextTick(() => {
        const modal = document.querySelector('[data-ref="orgDeleteModal"]');
        if (modal) modal.classList.remove('hide');
      });
    },

    cancelDelete() {
      this.orgDeleteConfirm.visible = false;
      const modal = document.querySelector('[data-ref="orgDeleteModal"]');
      if (modal) modal.classList.add('hide');
    },

    async confirmDeleteOrg() {
      this.savingOrg = true;
      this.orgError = null;

      try {
        const memberstack = window.$memberstackDom;
        if (!memberstack) throw new Error("Memberstack not available");

        await memberstack.deleteDataRecord({
          recordId: this.orgDeleteConfirm.recordId,
        });

        console.log("[Admin Dashboard] Deleted org:", this.orgDeleteConfirm.orgName);
        this.orgDeleteConfirm.visible = false;
        const deleteModal = document.querySelector('[data-ref="orgDeleteModal"]');
        if (deleteModal) deleteModal.classList.add('hide');

        if (this.selectedOrg?.recordId === this.orgDeleteConfirm.recordId) {
          this.selectedOrg = null;
          this.orgDetailView = false;
          const detailModal = document.querySelector('[data-ref="orgDetailModal"]');
          if (detailModal) detailModal.classList.add('hide');
        }

        await this.fetchOrganizations();
      } catch (err) {
        console.error("[Admin Dashboard] Delete org failed:", err);
        this.orgError = err.message || "Failed to delete organization";
      } finally {
        this.savingOrg = false;
      }
    },

    viewOrgDetail(org) {
      this.selectedOrg = org;
      this.orgDetailView = true;
      this.memberSearchQuery = "";

      // Manually remove .hide class because it has !important
      this.$nextTick(() => {
        const modal = document.querySelector('[data-ref="orgDetailModal"]');
        if (modal) {
          modal.classList.remove('hide');
          console.log("✅ Removed .hide class from modal");
        } else {
          console.warn("⚠️ Modal not found - add data-ref='orgDetailModal' to modal");
        }
      });
    },

    closeOrgDetail() {
      this.selectedOrg = null;
      this.orgDetailView = false;

      // Manually add .hide class because it has !important
      const modal = document.querySelector('[data-ref="orgDetailModal"]');
      if (modal) {
        modal.classList.add('hide');
        console.log("✅ Added .hide class to modal");
      }
    },

    orgGoToPage(page) {
      if (page >= 1 && page <= this.orgTotalPages) {
        this.orgPage = page;
      }
    },

    orgNextPage() {
      this.orgGoToPage(this.orgPage + 1);
    },

    orgPrevPage() {
      this.orgGoToPage(this.orgPage - 1);
    },

    async connectMemberToOrg(memberId) {
      if (!this.selectedOrg) return;
      this.savingOrg = true;
      this.orgError = null;

      try {
        const memberstack = window.$memberstackDom;
        if (!memberstack) throw new Error("Memberstack not available");

        // First, update the member's joined-org-date if not already set
        const member = this.members.find((m) => m.id === memberId);
        if (member && !member.customFields?.["joined-org-date"]) {
          await memberstack.updateMemberJSON({
            memberId: memberId,
            json: {
              "joined-org-date": new Date().toISOString().split('T')[0], // YYYY-MM-DD format
              "org-id": this.selectedOrg.orgId,
              "org-name": this.selectedOrg.name,
            },
          });
          console.log("[Admin Dashboard] Set joined-org-date for member:", memberId);
        }

        // Then connect member to org in data table
        await memberstack.updateDataRecord({
          recordId: this.selectedOrg.recordId,
          data: {
            members: { connect: [{ id: memberId }] },
          },
        });

        console.log("[Admin Dashboard] Connected member:", memberId);

        // Refresh data
        await this.fetchData();
        await this.fetchOrganizations();

        // Refresh selected org view
        const updated = this.enrichedOrgs.find(
          (o) => o.recordId === this.selectedOrg.recordId
        );
        if (updated) this.selectedOrg = updated;
      } catch (err) {
        console.error("[Admin Dashboard] Connect member failed:", err);
        this.orgError = err.message || "Failed to add member";
      } finally {
        this.savingOrg = false;
      }
    },

    async disconnectMemberFromOrg(memberId) {
      if (!this.selectedOrg) return;
      this.savingOrg = true;
      this.orgError = null;

      try {
        const memberstack = window.$memberstackDom;
        if (!memberstack) throw new Error("Memberstack not available");

        await memberstack.updateDataRecord({
          recordId: this.selectedOrg.recordId,
          data: {
            members: { disconnect: [{ id: memberId }] },
          },
        });

        console.log("[Admin Dashboard] Disconnected member:", memberId);
        await this.fetchOrganizations();

        const updated = this.enrichedOrgs.find(
          (o) => o.recordId === this.selectedOrg.recordId
        );
        if (updated) this.selectedOrg = updated;
      } catch (err) {
        console.error("[Admin Dashboard] Disconnect member failed:", err);
        this.orgError = err.message || "Failed to remove member";
      } finally {
        this.savingOrg = false;
      }
    },

    formatDate(str) {
      if (!str) return "--";
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      const date = new Date(str);
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    },

    selectMember(member) {
      this.selectedMember = member;
    },

    setTab(tab) {
      this.view.tab = tab;
    },

    filterPlanAll() { this.orgPlanFilter = "all"; },
    filterPlanFoundational() { this.orgPlanFilter = "Foundational"; },
    filterPlanFacilitators() { this.orgPlanFilter = "Facilitators"; },
    filterPlanCultural() { this.orgPlanFilter = "Cultural Competency"; },

    currentPlanFilter() {
      if (this.orgPlanFilter === "all") return "All Plans";
      return this.orgPlanFilter;
    },

    filterStatusAll() { this.orgStatusFilter = "all"; },
    filterStatusActive() { this.orgStatusFilter = "Active"; },
    filterStatusTrial() { this.orgStatusFilter = "trial"; },
    filterStatusInactive() { this.orgStatusFilter = "Inactive"; },

    currentStatusFilter() {
      if (this.orgStatusFilter === "all") return "All Status";
      return this.orgStatusFilter;
    },

    getStatusClass(org) {
      if (!org || !org.status) return "";
      const s = org.status.toLowerCase();
      if (s === "active") return "is-active";
      if (s === "trial") return "is-trial";
      if (s === "inactive") return "is-inactive";
      return "";
    },

    getPlanClass(plan) {
      if (!plan) return "is-plan-none";
      const p = plan.toLowerCase();
      if (p.includes("foundational")) return "is-plan-foundational";
      if (p.includes("facilitator")) return "is-plan-facilitators";
      if (p.includes("cultural")) return "is-plan-cultural";
      return "is-plan-none";
    },

    // CSV exports
    exportUsersCSV() {
      const headers = ["First Name", "Last Name", "Email", "Role", "Organization", "Joined Org", "Plan", "Progress"];
      const rows = this.sortedMembers.map((u) => [
        u.firstName, u.lastName, u.email, u.role, u.org,
        u.joinedOrgDate ? this.formatDate(u.joinedOrgDate) : "",
        u.plan, u.progress,
      ]);
      this._downloadCSV("users-export.csv", headers, rows);
    },

    exportOrgsCSV() {
      const headers = ["Org ID", "Organization", "Email Domain", "Status", "Contract Start", "Contract End", "Users", "Avg Completion", "Top Plan"];
      const rows = this.enrichedOrgs.map((o) => [
        o.orgId, o.name, o.emailDomain, o.subscriptionStatus,
        o.contractStartDate ? this.formatDate(o.contractStartDate) : "",
        o.contractEndDate ? this.formatDate(o.contractEndDate) : "",
        o.userCount, o.avgCompletion, o.topPlan,
      ]);
      this._downloadCSV("organizations-export.csv", headers, rows);
    },

    _downloadCSV(filename, headers, rows) {
      const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
      const csv = [
        headers.map(escape).join(","),
        ...rows.map((r) => r.map(escape).join(",")),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  },

  mounted() {
    console.log("[Admin Dashboard] Mounted");
    document.querySelectorAll("[dash-content]").forEach((el) => {
      el.classList.remove("hide");
    });

    // Prevent form submissions from reloading the page
    this.$el.addEventListener("submit", (e) => e.preventDefault(), true);
    this.$el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.tagName === "INPUT") e.preventDefault();
    }, true);

    // Expose Vue instance globally for debugging
    window.adminApp = this;

    this.fetchData();

    // Fetch CMS collection counts from Webflow API
    fetch(CMS_COUNTS_URL)
      .then((r) => r.json())
      .then((data) => { this.cmsCounts = data; })
      .catch((err) => console.warn("[Admin Dashboard] CMS counts fetch failed:", err));

    // Fetch organizations from data table once Memberstack is ready
    const waitForMemberstack = () => {
      if (window.$memberstackDom) {
        this.fetchOrganizations();
      } else {
        setTimeout(waitForMemberstack, 500);
      }
    };
    waitForMemberstack();
  },
}).mount("#admin-dashboard");
