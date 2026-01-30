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

  function updateCardStatus(card, video, animate) {
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
          if (animate) {
            progressBar.style.width = "0%";
            setTimeout(function () {
              progressBar.style.width = percent + "%";
            }, 50);
          } else {
            progressBar.style.width = percent + "%";
          }
        }
      }
    }

    statusWrapper.style.setProperty("display", "flex", "important");
  }

  function updateAllCards(videoData, animate) {
    var cards = document.querySelectorAll("[data-video-id]");
    log("Updating " + cards.length + " cards");

    cards.forEach(function (card) {
      var slug = card.getAttribute("data-video-id");
      if (!slug) return;
      var video = findVideo(videoData, slug);
      updateCardStatus(card, video, animate);
    });
  }

  function init() {
    log("Initializing...");

    // STEP 1: Show "Not Started" for all cards immediately
    var cards = document.querySelectorAll("[data-video-id]");
    if (cards.length > 0) {
      log("Showing default state for " + cards.length + " cards");
      updateAllCards({ watched: [] }, false);
    }

    // STEP 2: When Memberstack ready, update with real data
    onMemberstackReady(async function () {
      log("Memberstack ready");

      var memberstack = window.$memberstackDom;
      var response = await memberstack.getCurrentMember();
      var member = response.data;

      if (!member) {
        log("No member");
        return;
      }

      log("Member:", member.id);
      var videoData = getVideoData(member);
      log("Video data:", videoData);

      // Update with real data + animate progress bar
      updateAllCards(videoData, true);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
