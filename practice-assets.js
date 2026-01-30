(function () {
  "use strict";

  var CONFIG = {
    fieldKey: "video-data",
    debug: true,
    finsweetDelay: 1000
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
    if (!statusWrapper) {
      log("No .video-status found in card");
      return;
    }

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

    // Hide all status items first
    allItems.forEach(function (item) {
      item.style.display = "none";
    });

    // Determine which to show
    if (!video || !video.started) {
      // NOT STARTED
      if (notStartedEl) notStartedEl.style.display = "flex";
      log("→ Not started");
    } else if (video.completed) {
      // COMPLETED
      if (completedEl) completedEl.style.display = "flex";
      log("→ Completed");
    } else {
      // IN PROGRESS
      if (inProgressEl) {
        inProgressEl.style.display = "flex";
        var percent = video.percent_watched || 0;

        // Update percentage text
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

        // Set progress bar to 0 first
        var progressBar = inProgressEl.querySelector(".div-block-4");
        if (progressBar) {
          progressBar.style.transition = "none";
          progressBar.style.width = "0%";
        }
      }
      log("→ In progress: " + (video.percent_watched || 0) + "%");
    }

    // Show the wrapper with fade in
    statusWrapper.style.transition = "opacity 0.3s ease";
    statusWrapper.style.opacity = "0";
    statusWrapper.style.display = "flex";

    // Trigger reflow
    statusWrapper.offsetHeight;

    // Fade in
    statusWrapper.style.opacity = "1";

    // Animate progress bar after wrapper is visible
    if (video && !video.completed && video.started && inProgressEl) {
      setTimeout(function () {
        var progressBar = inProgressEl.querySelector(".div-block-4");
        if (progressBar) {
          progressBar.style.transition = "width 0.5s ease";
          progressBar.style.width = video.percent_watched + "%";
        }
      }, 300);
    }
  }

  function updateAllCards(member) {
    var videoData = getVideoData(member);
    log("Video data:", videoData);

    var cards = document.querySelectorAll("[data-video-id]");
    log("Found " + cards.length + " cards");

    if (cards.length === 0) {
      log("⚠️ No cards found - Finsweet may still be loading, retrying...");
      setTimeout(function () {
        updateAllCards(member);
      }, 500);
      return;
    }

    cards.forEach(function (card) {
      var slug = card.getAttribute("data-video-id");
      if (!slug) return;

      log("Card: " + slug);
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
        setTimeout(function () {
          document.querySelectorAll("[data-video-id]").forEach(function (card) {
            updateCardStatus(card, null);
          });
        }, CONFIG.finsweetDelay);
        return;
      }

      log("Member:", member.id);

      // Wait for Finsweet to load content
      setTimeout(function () {
        updateAllCards(member);
      }, CONFIG.finsweetDelay);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
