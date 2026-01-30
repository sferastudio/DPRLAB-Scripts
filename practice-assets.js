(function () {
  "use strict";

  var CONFIG = {
    fieldKey: "video-data",
    debug: true,
    finsweetDelay: 1000 // Wait for Finsweet to load
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

    // Fade out all first
    allItems.forEach(function (item) {
      item.style.transition = "opacity 0.3s ease";
      item.style.opacity = "0";
    });

    // After fade out, hide and show correct one
    setTimeout(function () {
      allItems.forEach(function (item) {
        item.style.display = "none";
      });

      var showEl = null;

      if (!video || !video.started) {
        showEl = notStartedEl;
        log("→ Not started");
      } else if (video.completed) {
        showEl = completedEl;
        log("→ Completed");
      } else {
        showEl = inProgressEl;
        if (inProgressEl) {
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

          // Set progress bar to 0 first, then animate
          var progressBar = inProgressEl.querySelector(".div-block-4");
          if (progressBar) {
            progressBar.style.width = "0%";
          }
        }
        log("→ In progress: " + (video.percent_watched || 0) + "%");
      }

      // Show correct element
      if (showEl) {
        showEl.style.display = "flex";
        showEl.style.opacity = "0";

        // Trigger reflow
        showEl.offsetHeight;

        // Fade in
        showEl.style.opacity = "1";

        // Animate progress bar after fade in
        if (showEl === inProgressEl && video) {
          setTimeout(function () {
            var progressBar = inProgressEl.querySelector(".div-block-4");
            if (progressBar) {
              progressBar.style.width = video.percent_watched + "%";
            }
          }, 100);
        }
      }
    }, 300);
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
