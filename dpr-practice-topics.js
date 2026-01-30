console.log("hi");
(function () {
  "use strict";

  var CONFIG = {
    fieldKey: "video-data",
    debug: true
  };

  function log(msg, data) {
    if (CONFIG.debug) console.log("[Progress]", msg, data || "");
  }

  // Wait for Memberstack
  function onMemberstackReady(callback) {
    if (window.$memberstackReady) {
      callback();
    } else {
      document.addEventListener("memberstack.ready", callback);
    }
  }

  // Get video data from Memberstack
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

  // Find video by slug
  function findVideo(videoData, slug) {
    if (!videoData.watched) return null;
    return videoData.watched.find(function (v) {
      return v.id === slug;
    });
  }

  // Update a single card's status display
  function updateCardStatus(card, video) {
    // Find the status wrapper
    var statusWrapper = card.querySelector(".video-status");
    if (!statusWrapper) {
      log("No .video-status found in card");
      return;
    }

    // Find all 3 status elements
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

    // Hide all first
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

        // Update percentage text (find the div that contains the number)
        var textDivs = inProgressEl.querySelectorAll("div");
        textDivs.forEach(function (div) {
          // Skip icon block and progress bar
          if (
            !div.classList.contains("asset_progress-icon-block") &&
            !div.classList.contains("asset_progress-bar") &&
            !div.querySelector(".asset_progress-bar")
          ) {
            // This should be the percentage text
            if (!isNaN(parseInt(div.textContent))) {
              div.textContent = percent + "%";
            }
          }
        });

        // Update progress bar width
        var progressBar = inProgressEl.querySelector(".div-block-4");
        if (progressBar) {
          progressBar.style.width = percent + "%";
        }

        log("→ In progress: " + percent + "%");
      }
    }
  }

  // Update all cards on page
  function updateAllCards(member) {
    var videoData = getVideoData(member);
    log("Video data:", videoData);

    // Find all cards with data-video-id
    var cards = document.querySelectorAll("[data-video-id]");
    log("Found " + cards.length + " cards");

    cards.forEach(function (card) {
      var slug = card.getAttribute("data-video-id");
      if (!slug) return;

      log("Card: " + slug);
      var video = findVideo(videoData, slug);
      updateCardStatus(card, video);
    });
  }

  // Initialize
  function init() {
    log("Initializing...");

    onMemberstackReady(async function () {
      log("Memberstack ready");

      var memberstack = window.$memberstackDom;
      var response = await memberstack.getCurrentMember();
      var member = response.data;

      if (!member) {
        log("No member - showing all as Not Started");
        // Show "Not started" for all
        document.querySelectorAll("[data-video-id]").forEach(function (card) {
          updateCardStatus(card, null);
        });
        return;
      }

      log("Member:", member.id);
      updateAllCards(member);
    });
  }

  // Run when page loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
