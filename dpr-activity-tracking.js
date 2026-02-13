// dpr-activity-tracking.js
// Tracks worksheet downloads and external publication link clicks
// Saves to Memberstack custom field "activity-data"

(function () {
  "use strict";

  var CONFIG = {
    fieldKey: "activity-data",
    debug: true,
  };

  function log(msg, data) {
    if (CONFIG.debug) console.log("[ActivityTrack]", msg, data || "");
  }

  function onMemberstackReady(callback) {
    if (window.$memberstackReady) {
      callback();
    } else {
      document.addEventListener("memberstack.ready", callback);
    }
  }

  function getActivityData(member) {
    var data = { downloads: [], clicks: [] };
    try {
      if (member.customFields && member.customFields[CONFIG.fieldKey]) {
        data = JSON.parse(member.customFields[CONFIG.fieldKey]);
      }
    } catch (e) {
      log("Error parsing:", e);
    }
    if (!data.downloads) data.downloads = [];
    if (!data.clicks) data.clicks = [];
    return data;
  }

  async function saveActivityData(memberstack, data) {
    try {
      await memberstack.updateMember({
        customFields: {
          [CONFIG.fieldKey]: JSON.stringify(data),
        },
      });
      log("Saved to Memberstack");
    } catch (e) {
      log("Save error:", e);
    }
  }

  // Auto-detect topic slugs from [data-topic-slug] elements on the page
  // Same pattern as practice-assets.js — works with CMS-bound topic lists
  function getTopicSlugs() {
    var slugs = [];
    document.querySelectorAll("[data-topic-slug]").forEach(function (el) {
      var slug = el.getAttribute("data-topic-slug");
      if (slug && slugs.indexOf(slug) === -1) slugs.push(slug);
    });
    log("Topic slugs found on page:", slugs);
    return slugs;
  }

  function showToast(message) {
    var toast = document.createElement("div");
    toast.style.cssText =
      "position:fixed;bottom:20px;right:20px;background:#4A3AFF;color:white;padding:12px 24px;border-radius:8px;z-index:9999;font-family:sans-serif;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.15);";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, 3000);
  }

  function trackDownload(el, activityData, memberstack, topicSlugs) {
    var slug =
      el.getAttribute("data-track-slug") ||
      window.location.pathname.split("/").pop();
    var name = el.getAttribute("data-track-name") || document.title;
    var topic = topicSlugs[0] || "";
    var timestamp = new Date().toISOString();

    var entry = activityData.downloads.find(function (d) {
      return d.slug === slug;
    });

    if (entry) {
      entry.count = (entry.count || 1) + 1;
      entry.lastDownloaded = timestamp;
    } else {
      activityData.downloads.push({
        slug: slug,
        name: name,
        topic: topic,
        count: 1,
        firstDownloaded: timestamp,
        lastDownloaded: timestamp,
      });
    }

    log("Download tracked:", slug);
    saveActivityData(memberstack, activityData);
    showToast("Download tracked ✓");
  }

  function trackClick(el, activityData, memberstack, topicSlugs) {
    var slug =
      el.getAttribute("data-track-slug") ||
      window.location.pathname.split("/").pop();
    var name = el.getAttribute("data-track-name") || document.title;
    var topic = topicSlugs[0] || "";
    var url = el.getAttribute("href") || el.getAttribute("data-track-url") || "";
    var timestamp = new Date().toISOString();

    var entry = activityData.clicks.find(function (c) {
      return c.slug === slug;
    });

    if (entry) {
      entry.count = (entry.count || 1) + 1;
      entry.lastClicked = timestamp;
    } else {
      activityData.clicks.push({
        slug: slug,
        name: name,
        topic: topic,
        url: url,
        count: 1,
        firstClicked: timestamp,
        lastClicked: timestamp,
      });
    }

    log("External link tracked:", slug);
    saveActivityData(memberstack, activityData);
  }

  async function initTracking() {
    var memberstack = window.$memberstackDom;
    var response = await memberstack.getCurrentMember();
    var member = response.data;

    if (!member) {
      log("No member logged in — skipping activity tracking");
      return;
    }

    log("Member:", member.id);

    var activityData = getActivityData(member);
    var topicSlugs = getTopicSlugs();

    // Track downloads: elements with data-track="download"
    var downloadEls = document.querySelectorAll("[data-track='download']");
    log("Download elements found:", downloadEls.length);

    downloadEls.forEach(function (el) {
      el.addEventListener("click", function () {
        trackDownload(el, activityData, memberstack, topicSlugs);
      });
    });

    // Track external link clicks: elements with data-track="external-link"
    var clickEls = document.querySelectorAll("[data-track='external-link']");
    log("External link elements found:", clickEls.length);

    clickEls.forEach(function (el) {
      el.addEventListener("click", function () {
        trackClick(el, activityData, memberstack, topicSlugs);
      });
    });

    log("Activity tracking initialized");
  }

  onMemberstackReady(function () {
    initTracking();
  });
})();
