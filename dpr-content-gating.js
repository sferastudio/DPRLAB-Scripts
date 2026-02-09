console.log("dpr-content-gating.js");
(() => {
  "use strict";

  // ── Plan-to-tier mapping ──────────────────────────────────────────
  // Hierarchical access: higher tiers include lower tier access.
  const PLAN_TIER_MAP = {
    "pln_foundational-54nx0w9x": ["Foundational"],
    "pln_facilitators-mbo10wwc": ["Foundational", "Facilitators"],
    "pln_cultural-competency-tr3q09av": ["Foundational", "Cultural Competency"]
  };

  // Plan-to-dashboard URL mapping
  const PLAN_DASHBOARD_MAP = {
    "pln_foundational-54nx0w9x": "/foundational-lab",
    "pln_facilitators-mbo10wwc": "/facilitators-lab",
    "pln_cultural-competency-tr3q09av": "/cultural-lab"
  };

  const CONFIG = {
    debug: true,
    detailTierAttr: "data-page-tier",
    fallbackUrl: "/learn-more"
  };

  const log = (msg, data) => {
    if (CONFIG.debug) console.log("[Gating]", msg, data || "");
  };

  // ── Determine which tiers a member can access ─────────────────────
  const getAccessibleTiers = (member) => {
    const tiers = [];
    if (!member || !member.planConnections) return tiers;

    member.planConnections.forEach((conn) => {
      if (conn.status === "ACTIVE") {
        const granted = PLAN_TIER_MAP[conn.planId];
        if (granted) {
          granted.forEach((t) => {
            if (!tiers.includes(t)) tiers.push(t);
          });
        }
      }
    });
    return tiers;
  };

  const hasTierAccess = (tiers, requiredTier) => {
    return tiers.includes(requiredTier);
  };

  // ── Get redirect URL based on member's plans ──────────────────────
  const getRedirectUrl = (member) => {
    if (!member || !member.planConnections) {
      return CONFIG.fallbackUrl;
    }

    // Find the first active plan and redirect to its dashboard
    // Priority: Facilitators > Foundational > Cultural Competency
    const activePlans = member.planConnections
      .filter((conn) => conn.status === "ACTIVE")
      .map((conn) => conn.planId);

    // Check in priority order
    if (activePlans.includes("pln_facilitators-mbo10wwc")) {
      return PLAN_DASHBOARD_MAP["pln_facilitators-mbo10wwc"];
    }
    if (activePlans.includes("pln_foundational-54nx0w9x")) {
      return PLAN_DASHBOARD_MAP["pln_foundational-54nx0w9x"];
    }
    if (activePlans.includes("pln_cultural-competency-tr3q09av")) {
      return PLAN_DASHBOARD_MAP["pln_cultural-competency-tr3q09av"];
    }

    return CONFIG.fallbackUrl;
  };

  // ── Check if user has access to a specific plan ──────────────────
  const hasActivePlan = (member, planId) => {
    if (!member || !member.planConnections) return false;
    return member.planConnections.some(
      (conn) => conn.planId === planId && conn.status === "ACTIVE"
    );
  };

  // ── Apply gating to detail (single-item) pages ────────────────────
  const gateDetailPage = (accessibleTiers, member) => {
    const el = document.querySelector(`[${CONFIG.detailTierAttr}]`);
    if (!el) return;

    const requiredValue = el.getAttribute(CONFIG.detailTierAttr);
    if (!requiredValue) return;

    // Check if it's a plan ID (starts with "pln_") or a tier name
    let hasAccess = false;
    if (requiredValue.startsWith("pln_")) {
      // It's a plan ID - check directly
      hasAccess = hasActivePlan(member, requiredValue);
      log("Checking plan ID:", requiredValue, "- Access:", hasAccess);
    } else {
      // It's a tier name - check against accessible tiers
      hasAccess = hasTierAccess(accessibleTiers, requiredValue);
      log("Checking tier name:", requiredValue, "- Access:", hasAccess);
    }

    if (!hasAccess) {
      log("Access denied — requires:", requiredValue);
      const redirectUrl = getRedirectUrl(member);
      log("Redirecting to:", redirectUrl);
      window.location.href = redirectUrl;
    }
  };

  // ── Init ──────────────────────────────────────────────────────────
  const init = async () => {
    log("Initializing content gating");

    const memberstack = window.$memberstackDom;
    if (!memberstack) {
      log("Memberstack not available");
      return;
    }

    try {
      const response = await memberstack.getCurrentMember();
      const member = response.data;

      if (!member) {
        log("No member logged in — redirecting if gated content accessed");
        gateDetailPage([], null);
        return;
      }

      const tiers = getAccessibleTiers(member);
      log("Accessible tiers:", tiers);

      gateDetailPage(tiers, member);
    } catch (e) {
      log("Gating error:", e);
    }
  };

  if (window.$memberstackReady) {
    init();
  } else {
    document.addEventListener("memberstack.ready", init);
  }
})();
