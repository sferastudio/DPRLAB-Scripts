console.log("dpr-admin-dashboard.js");
(function () {
  "use strict";

  // ── Configuration ─────────────────────────────────────────────────────
  var CONFIG = {
    debug: true,
    refreshInterval: 300000, // Refresh data every 5 minutes
    apiEndpoint: "/api/get-members", // Update this with your deployed API endpoint
    // Map your Memberstack plan IDs to display names
    planNames: {
      "pln_foundational-54nx0w9x": "Foundational",
      "pln_facilitators-mbo10wwc": "Facilitators",
      "pln_cultural-competency-tr3q09av": "Cultural Competency",
      "pln_admin-sz1zl0jnt": "Admin"
    }
  };

  function log(msg, data) {
    if (CONFIG.debug) console.log("[AdminDashboard]", msg, data || "");
  }

  // ── Fetch Members from API ───────────────────────────────────────────
  async function getAllMembers() {
    try {
      log("Fetching members from API...");

      var response = await fetch(CONFIG.apiEndpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch members: " + response.statusText);
      }

      var data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch members");
      }

      log("Fetched " + data.members.length + " members");

      return {
        members: data.members || [],
        total: data.total || 0
      };
    } catch (e) {
      log("Error fetching members:", e);
      return { members: [], total: 0 };
    }
  }

  // ── Calculate Statistics ──────────────────────────────────────────────
  function calculateStats(members) {
    var now = Date.now();
    var sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    var thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    var stats = {
      totalMembers: members.length,
      activeMembers7d: 0,
      activeMembers30d: 0,
      planDistribution: {},
      newMembers7d: 0,
      newMembers30d: 0
    };

    members.forEach(function (member) {
      // Count active members (those who logged in recently)
      var lastLoginTime = member.lastLogin ? new Date(member.lastLogin).getTime() : 0;
      if (lastLoginTime > sevenDaysAgo) stats.activeMembers7d++;
      if (lastLoginTime > thirtyDaysAgo) stats.activeMembers30d++;

      // Count new members
      var createdTime = member.createdAt ? new Date(member.createdAt).getTime() : 0;
      if (createdTime > sevenDaysAgo) stats.newMembers7d++;
      if (createdTime > thirtyDaysAgo) stats.newMembers30d++;

      // Plan distribution
      if (member.planConnections) {
        member.planConnections.forEach(function (conn) {
          if (conn.status === "ACTIVE") {
            var planName = CONFIG.planNames[conn.planId] || conn.planId;
            stats.planDistribution[planName] = (stats.planDistribution[planName] || 0) + 1;
          }
        });
      }
    });

    return stats;
  }

  // ── Update Dashboard UI ───────────────────────────────────────────────
  function updateOverviewStats(stats) {
    // Update total users
    var totalUsersEl = document.querySelector('[data-stat="total-users"]');
    if (totalUsersEl) {
      totalUsersEl.textContent = stats.totalMembers;
    }

    // Update active users
    var activeUsersEl = document.querySelector('[data-stat="active-users"]');
    if (activeUsersEl) {
      activeUsersEl.textContent = stats.activeMembers7d;
    }

    // Update total topics (from CMS)
    updateCMSCount("practice-topics", '[data-stat="total-topics"]');

    // Update total assets (from CMS)
    updateCMSCount("practice-assets", '[data-stat="total-assets"]');

    log("Stats updated", stats);
  }

  async function updateCMSCount(collectionSlug, selector) {
    try {
      // This would need to query your CMS collections
      // For now, keep existing static values
      log("CMS count update needed for:", collectionSlug);
    } catch (e) {
      log("Error updating CMS count:", e);
    }
  }

  // ── Render Users Table ────────────────────────────────────────────────
  function renderUsersTable(members) {
    var tableContainer = document.querySelector('[data-admin="users-table"]');
    if (!tableContainer) {
      log("Users table container not found");
      return;
    }

    // Clear existing content
    tableContainer.innerHTML = "";

    // Create table
    var table = document.createElement("div");
    table.className = "admin-users-table";

    // Table header
    var header = document.createElement("div");
    header.className = "admin-table-header";
    header.innerHTML =
      '<div class="admin-table-cell">Name</div>' +
      '<div class="admin-table-cell">Email</div>' +
      '<div class="admin-table-cell">Plan</div>' +
      '<div class="admin-table-cell">Joined</div>' +
      '<div class="admin-table-cell">Last Active</div>';
    table.appendChild(header);

    // Table rows
    members.forEach(function (member) {
      var row = document.createElement("div");
      row.className = "admin-table-row";

      var planName = "N/A";
      if (member.planConnections && member.planConnections.length > 0) {
        var activePlan = member.planConnections.find(function (c) {
          return c.status === "ACTIVE";
        });
        if (activePlan) {
          planName = CONFIG.planNames[activePlan.planId] || activePlan.planId;
        }
      }

      var joinedDate = member.createdAt
        ? new Date(member.createdAt).toLocaleDateString()
        : "N/A";
      var lastActive = member.lastLogin
        ? new Date(member.lastLogin).toLocaleDateString()
        : "Never";

      row.innerHTML =
        '<div class="admin-table-cell">' +
        (member.customFields?.name || "N/A") +
        "</div>" +
        '<div class="admin-table-cell">' +
        (member.auth?.email || "N/A") +
        "</div>" +
        '<div class="admin-table-cell">' +
        planName +
        "</div>" +
        '<div class="admin-table-cell">' +
        joinedDate +
        "</div>" +
        '<div class="admin-table-cell">' +
        lastActive +
        "</div>";

      table.appendChild(row);
    });

    tableContainer.appendChild(table);
  }

  // ── Export to CSV ─────────────────────────────────────────────────────
  function exportToCSV(members) {
    var csv = "Name,Email,Plan,Joined,Last Active\n";

    members.forEach(function (member) {
      var planName = "N/A";
      if (member.planConnections && member.planConnections.length > 0) {
        var activePlan = member.planConnections.find(function (c) {
          return c.status === "ACTIVE";
        });
        if (activePlan) {
          planName = CONFIG.planNames[activePlan.planId] || activePlan.planId;
        }
      }

      var name = (member.customFields?.name || "N/A").replace(/,/g, "");
      var email = member.auth?.email || "N/A";
      var joined = member.createdAt
        ? new Date(member.createdAt).toLocaleDateString()
        : "N/A";
      var lastActive = member.lastLogin
        ? new Date(member.lastLogin).toLocaleDateString()
        : "Never";

      csv += name + "," + email + "," + planName + "," + joined + "," + lastActive + "\n";
    });

    // Create download link
    var blob = new Blob([csv], { type: "text/csv" });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "dpr-members-" + new Date().toISOString().split("T")[0] + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    log("CSV exported");
  }

  // ── Add Export Button ─────────────────────────────────────────────────
  function addExportButton(members) {
    var exportBtn = document.querySelector('[data-action="export-csv"]');
    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        exportToCSV(members);
      });
    }
  }

  // ── Render Plan Distribution ──────────────────────────────────────────
  function renderPlanDistribution(stats) {
    var container = document.querySelector('[data-admin="plan-distribution"]');
    if (!container) return;

    container.innerHTML = "";

    Object.keys(stats.planDistribution).forEach(function (planName) {
      var count = stats.planDistribution[planName];
      var item = document.createElement("div");
      item.className = "admin-plan-item";
      item.innerHTML =
        "<strong>" + planName + "</strong>: " + count + " user" + (count !== 1 ? "s" : "");
      container.appendChild(item);
    });
  }

  // ── Inject Styles ─────────────────────────────────────────────────────
  function injectStyles() {
    var css =
      ".admin-users-table{width:100%;border-collapse:collapse;margin-top:20px}" +
      ".admin-table-header{display:grid;grid-template-columns:repeat(5,1fr);" +
      "gap:16px;padding:12px;background:#f5f5f5;font-weight:600;border-bottom:2px solid #ddd}" +
      ".admin-table-row{display:grid;grid-template-columns:repeat(5,1fr);" +
      "gap:16px;padding:12px;border-bottom:1px solid #eee;transition:background .2s}" +
      ".admin-table-row:hover{background:#f9f9f9}" +
      ".admin-table-cell{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".admin-plan-item{padding:8px 0;font-size:15px}";

    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── Main Init ─────────────────────────────────────────────────────────
  async function init() {
    log("Initializing admin dashboard");
    injectStyles();

    try {
      // Get all members
      var data = await getAllMembers();
      var members = data.members;

      // Calculate statistics
      var stats = calculateStats(members);

      // Update UI
      updateOverviewStats(stats);
      renderUsersTable(members);
      renderPlanDistribution(stats);
      addExportButton(members);

      // Set up auto-refresh
      setInterval(function () {
        init();
      }, CONFIG.refreshInterval);

      log("Dashboard initialized successfully");
    } catch (e) {
      log("Dashboard initialization error:", e);
    }
  }

  // Start when ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
