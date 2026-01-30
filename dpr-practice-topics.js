console.log("dpr-practice-topics.js");
(function () {
  "use strict";

  var CONFIG = {
    fieldKey: "video-data",
    debug: true
  };

  function log(msg, data) {
    if (CONFIG.debug) console.log("[Progress]", msg, data || "");
  }

  function onMemberstackReady(callback) {
    if (window.$memberstackReady) {
      callback();
    } else {
      document.addEventListener("memberstack.ready", callback);
    }
  }

  function getVideoData(member) {
    var data = { watched: [] };
    try {
      if (member.customFields && member.customFields[CONFIG.fieldKey]) {
        data = JSON.parse(member.customFields[CONFIG.fieldKey]);
      }
    } catch (e) {
      log("Error parsing:", e);
    }
    return data;
  }

  function findVideo(videoData, slug) {
    if (!videoData.watched) return null;
    return videoData.watched.find(function (v) {
      return v.id === slug;
    });
  }

  function updateCardStatus(card, video) {
    var statusWrapper = card.querySelector(".video-status");
    if (!statusWrapper) return;

    var allItems = statusWrapper.querySelectorAll(".asset_progress-item");
    var notStartedEl = null;
    var inProgressEl = null;
    var completedEl = null;

    allItems.forEach(function (item) {
      if (item.classList.contains("is-in-progress")) {
        inProgressEl = item;
      } else if (item.classList.contains("is-complete")) {
        completedEl = item;
      } else {
        notStartedEl = item;
      }
    });

    allItems.forEach(function (item) {
      item.style.setProperty("display", "none", "important");
    });

    if (!video || !video.started) {
      if (notStartedEl) notStartedEl.style.setProperty("display", "flex", "important");
    } else if (video.completed) {
      if (completedEl) completedEl.style.setProperty("display", "flex", "important");
    } else {
      if (inProgressEl) {
        inProgressEl.style.setProperty("display", "flex", "important");
        var percent = video.percent_watched || 0;

        var textDivs = inProgressEl.querySelectorAll("div");
        textDivs.forEach(function (div) {
          if (
            !div.classList.contains("asset_progress-icon-block") &&
            !div.classList.contains("asset_progress-bar") &&
            !div.querySelector(".asset_progress-bar")
          ) {
            if (!isNaN(parseInt(div.textContent))) {
              div.textContent = percent + "%";
            }
          }
        });

        var progressBar = inProgressEl.querySelector(".div-block-4");
        if (progressBar) {
          progressBar.style.width = percent + "%";
        }
      }
    }

    statusWrapper.style.setProperty("display", "flex", "important");
  }

  function updateAllCards(member) {
    var videoData = getVideoData(member);
    log("Video data:", videoData);

    var cards = document.querySelectorAll("[data-video-id]");
    log("Found " + cards.length + " cards");

    cards.forEach(function (card) {
      var slug = card.getAttribute("data-video-id");
      if (!slug) return;
      var video = findVideo(videoData, slug);
      updateCardStatus(card, video);
    });
  }

  function init() {
    log("Initializing...");

    onMemberstackReady(async function () {
      log("Memberstack ready");

      var memberstack = window.$memberstackDom;
      var response = await memberstack.getCurrentMember();
      var member = response.data;

      if (!member) {
        log("No member - showing all as Not Started");
      } else {
        log("Member:", member.id);
      }

      // Wait for Finsweet CMS Nest
      window.fsAttributes = window.fsAttributes || [];
      window.fsAttributes.push([
        "cmsnest",
        function (nestInstances) {
          log("Finsweet CMS Nest ready");
          updateAllCards(member);
        }
      ]);

      // Fallback: if Finsweet already loaded or no nesting on page
      setTimeout(function () {
        var cards = document.querySelectorAll("[data-video-id]");
        if (cards.length > 0) {
          log("Fallback: updating cards");
          updateAllCards(member);
        }
      }, 100);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
