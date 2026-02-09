// dpr-admin-dashboard.js
// Vue-powered admin dashboard — fetches data from Make.com webhook

const { createApp } = Vue;

const MAKE_WEBHOOK_URL =
  "https://hook.us2.make.com/0rytlxf2bvui3r1xfik6gdlkmvou4opw";

// Webflow CMS counts (update these or fetch dynamically)
const CMS_COUNTS = {
  totalTopics: 5,
  totalAssets: 25,
};

const app = createApp({
  data() {
    return {
      loadingData: true,
      error: null,
      members: [],
      selectedMember: null,
      view: {
        tab: "overview", // overview, organizations, users
      },
    };
  },

  computed: {
    // Stats
    totalUsers() {
      return this.members.length;
    },

    totalOrgs() {
      return this.orgList.length;
    },

    totalTopics() {
      return CMS_COUNTS.totalTopics;
    },

    totalAssets() {
      return CMS_COUNTS.totalAssets;
    },

    usersWithProgress() {
      return this.members.filter((m) => this.getVideoData(m).watched.length > 0).length;
    },

    videosCompleted() {
      let count = 0;
      this.members.forEach((m) => {
        const vd = this.getVideoData(m);
        count += vd.watched.filter((v) => v.completed).length;
      });
      return count;
    },

    videosInProgress() {
      let count = 0;
      this.members.forEach((m) => {
        const vd = this.getVideoData(m);
        count += vd.watched.filter((v) => v.started && !v.completed).length;
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
          orgs[orgId] = {
            id: orgId,
            name: orgName,
            users: [],
          };
        }
        orgs[orgId].users.push(member);
      });
      return Object.values(orgs);
    },

    // Unique plans across all members
    planList() {
      const plans = {};
      this.members.forEach((member) => {
        (member.planConnections || []).forEach((conn) => {
          if (conn.planName && !plans[conn.planId]) {
            plans[conn.planId] = {
              id: conn.planId,
              name: conn.planName,
              type: conn.type,
            };
          }
        });
      });
      return Object.values(plans);
    },
  },

  methods: {
    async fetchData() {
      this.loadingData = true;
      this.error = null;

      try {
        const response = await fetch(MAKE_WEBHOOK_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

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
  },

  mounted() {
    document.querySelectorAll("[dash-content]").forEach((el) => {
      el.classList.remove("hide");
    });

    this.fetchData();
  },
}).mount("#vue-app");
