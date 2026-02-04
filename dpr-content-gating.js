console.log("dpr-content-gating.js");
(function () {
  "use strict";

  // ── Plan-to-tier mapping ──────────────────────────────────────────
  // Facilitators is hierarchical: includes Foundational access.
  // Cultural Competency is an add-on: purchased independently.
  var PLAN_TIER_MAP = {
    "pln_foundational-54nx0w9x": ["Foundational"],
    "pln_facilitators-mbo10wwc": ["Foundational", "Facilitators"],
    "pln_cultural-competency-tr3q09av": ["Cultural Competency"]
  };

  var CONFIG = {
    debug: true,
    cardSelector: "[data-tier]",
    detailTierAttr: "data-page-tier",
    upgradeUrl: "/learn-more",
    lockClass: "dpr-tier-lock",
    paywallClass: "dpr-tier-paywall"
  };

  function log(msg, data) {
    if (CONFIG.debug) console.log("[Gating]", msg, data || "");
  }

  // ── Determine which tiers a member can access ─────────────────────
  function getAccessibleTiers(member) {
    var tiers = [];
    if (!member || !member.planConnections) return tiers;

    member.planConnections.forEach(function (conn) {
      if (conn.status === "ACTIVE") {
        var granted = PLAN_TIER_MAP[conn.planId];
        if (granted) {
          granted.forEach(function (t) {
            if (tiers.indexOf(t) === -1) tiers.push(t);
          });
        }
      }
    });
    return tiers;
  }

  function hasTierAccess(tiers, requiredTier) {
    return tiers.indexOf(requiredTier) !== -1;
  }

  // ── Lock overlay for listing-page cards ───────────────────────────
  function createLockOverlay(tierName) {
    var overlay = document.createElement("div");
    overlay.className = CONFIG.lockClass;
    overlay.innerHTML =
      '<div class="dpr-lock-inner">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round">' +
      '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>' +
      '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>' +
      "</svg>" +
      "<span>" +
      tierName +
      " Plan</span>" +
      "</div>";
    return overlay;
  }

  function lockCard(card, tierName) {
    if (card.querySelector("." + CONFIG.lockClass)) return;
    card.style.position = "relative";
    card.appendChild(createLockOverlay(tierName));

    // If the card itself is an <a>, strip its href
    if (card.tagName === "A") {
      card.setAttribute("data-href-backup", card.getAttribute("href") || "");
      card.removeAttribute("href");
    }

    // Also strip any child links
    card.querySelectorAll("a").forEach(function (link) {
      link.setAttribute("data-href-backup", link.getAttribute("href") || "");
      link.removeAttribute("href");
    });

    // Block all clicks on the card
    card.addEventListener(
      "click",
      function (e) {
        e.preventDefault();
        e.stopPropagation();
      },
      true
    );
  }

  // ── Paywall banner for detail pages ───────────────────────────────
  function showPaywall(tierName) {
    var existing = document.querySelector("." + CONFIG.paywallClass);
    if (existing) return;

    // Hide the main-wrapper content (everything between nav and footer)
    var mainWrapper = document.querySelector(".main-wrapper");
    if (mainWrapper) {
      mainWrapper.style.display = "none";
    }

    var paywall = document.createElement("div");
    paywall.className = CONFIG.paywallClass;
    paywall.innerHTML =
      '<div class="dpr-paywall-inner">' +
      '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round">' +
      '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>' +
      '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>' +
      "</svg>" +
      "<h3>This content requires the " +
      tierName +
      " plan</h3>" +
      "<p>Upgrade your membership to unlock this resource.</p>" +
      "</div>";

    // Insert the paywall where main-wrapper was
    if (mainWrapper) {
      mainWrapper.parentElement.insertBefore(paywall, mainWrapper);
    } else {
      document.body.appendChild(paywall);
    }
  }

  // ── Apply gating to listing pages ─────────────────────────────────
  function gateListingCards(accessibleTiers) {
    var cards = document.querySelectorAll(CONFIG.cardSelector);
    log("Found " + cards.length + " tier-gated cards");

    cards.forEach(function (card) {
      var tier = card.getAttribute("data-tier");
      if (!tier) return;
      if (!hasTierAccess(accessibleTiers, tier)) {
        lockCard(card, tier);
        log("Locked card — requires:", tier);
      }
    });
  }

  // ── Apply gating to detail (single-item) pages ────────────────────
  function gateDetailPage(accessibleTiers) {
    var el = document.querySelector("[" + CONFIG.detailTierAttr + "]");
    if (!el) return;

    var tier = el.getAttribute(CONFIG.detailTierAttr);
    if (!tier) return;

    if (!hasTierAccess(accessibleTiers, tier)) {
      log("Detail page locked — requires:", tier);
      showPaywall(tier);
    }
  }

  // ── Inject minimal CSS ────────────────────────────────────────────
  function injectStyles() {
    var css =
      "." +
      CONFIG.lockClass +
      "{" +
      "position:absolute;top:0;left:0;width:100%;height:100%;" +
      "background:rgba(0,0,0,.55);display:flex;align-items:center;" +
      "justify-content:center;border-radius:inherit;z-index:10;" +
      "cursor:pointer;transition:background .2s}" +
      "." +
      CONFIG.lockClass +
      ":hover{background:rgba(0,0,0,.72)}" +
      ".dpr-lock-inner{color:#fff;text-align:center;font-size:13px;" +
      "font-family:inherit}" +
      ".dpr-lock-inner svg{display:block;margin:0 auto 6px}" +
      "." +
      CONFIG.paywallClass +
      "{display:flex;align-items:center;justify-content:center;" +
      "min-height:360px;padding:40px}" +
      ".dpr-paywall-inner{text-align:center;max-width:460px;" +
      "font-family:inherit}" +
      ".dpr-paywall-inner svg{margin:0 auto 16px;color:#888}" +
      ".dpr-paywall-inner h3{font-size:22px;margin-bottom:10px}" +
      ".dpr-paywall-inner p{color:#666;margin-bottom:20px;font-size:15px}" +
      ".dpr-upgrade-btn{display:inline-block;background:#4A3AFF;color:#fff;" +
      "padding:10px 28px;border-radius:8px;text-decoration:none;" +
      "font-weight:600;transition:background .2s}" +
      ".dpr-upgrade-btn:hover{background:#3a2ad9}";

    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── Wait for CMS cards to render ──────────────────────────────────
  function waitForCards(callback, attempts) {
    attempts = attempts || 0;
    if (document.querySelectorAll(CONFIG.cardSelector).length > 0) {
      callback();
    } else if (attempts < 100) {
      setTimeout(function () {
        waitForCards(callback, attempts + 1);
      }, 100);
    } else {
      log("No tier-gated cards found on this page");
    }
  }

  // ── Watch for dynamically loaded cards (nested collections, tabs) ──
  function watchForDynamicCards(accessibleTiers) {
    var observer = new MutationObserver(function () {
      var cards = document.querySelectorAll(CONFIG.cardSelector);
      cards.forEach(function (card) {
        // Only lock if not already locked
        if (card.querySelector("." + CONFIG.lockClass)) return;
        var tier = card.getAttribute("data-tier");
        if (!tier) return;
        if (!hasTierAccess(accessibleTiers, tier)) {
          lockCard(card, tier);
          log("Locked dynamically loaded card — requires:", tier);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // ── Init ──────────────────────────────────────────────────────────
  async function init() {
    log("Initializing content gating");
    injectStyles();

    var memberstack = window.$memberstackDom;
    if (!memberstack) {
      log("Memberstack not available");
      return;
    }

    try {
      var response = await memberstack.getCurrentMember();
      var member = response.data;

      if (!member) {
        log("No member logged in — locking all gated content");
        waitForCards(function () {
          gateListingCards([]);
        });
        watchForDynamicCards([]);
        gateDetailPage([]);
        return;
      }

      var tiers = getAccessibleTiers(member);
      log("Accessible tiers:", tiers);

      waitForCards(function () {
        gateListingCards(tiers);
      });
      watchForDynamicCards(tiers);
      gateDetailPage(tiers);
    } catch (e) {
      log("Gating error:", e);
    }
  }

  if (window.$memberstackReady) {
    init();
  } else {
    document.addEventListener("memberstack.ready", init);
  }
})();
