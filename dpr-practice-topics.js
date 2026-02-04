console.log("dpr-practice-topics.js");
(function ($) {
  "use strict";

  var CONFIG = {
    fieldKey: "video-data",
    debug: true
  };

  var lastUpdate = 0;

  function log(msg, data) {
    if (CONFIG.debug) console.log("[Progress]", msg, data || "");
  }

  function onMemberstackReady(callback) {
    if (window.$memberstackReady) {
      callback();
    } else {
      $(document).on("memberstack.ready", callback);
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

  function updateCardStatus($card, video, animate) {
    // Show/hide content type badge
    var $assetType = $card.find("[content-type]");
    var contentType = $assetType.text().trim();

    if (contentType !== "") {
      $assetType.css("display", "flex");
    } else {
      $assetType.hide();
    }

    // Handle video status
    var $statusWrapper = $card.find(".video-status");
    if (!$statusWrapper.length) return;

    var $notStarted = $statusWrapper
      .find(".asset_progress-item")
      .not(".is-in-progress, .is-complete");
    var $inProgress = $statusWrapper.find(".is-in-progress");
    var $completed = $statusWrapper.find(".is-complete");

    // Hide all first
    $statusWrapper.find(".asset_progress-item").hide();

    if (!video || !video.started) {
      $notStarted.css("display", "flex");
    } else if (video.completed) {
      $completed.css("display", "flex");
    } else {
      $inProgress.css("display", "flex");
      var percent = video.percent_watched || 0;

      // Update percentage text
      $inProgress
        .find("div")
        .not(".asset_progress-icon-block, .asset_progress-bar")
        .each(function () {
          if (!isNaN(parseInt($(this).text()))) {
            $(this).text(percent + "%");
          }
        });

      // Update progress bar
      var $progressBar = $inProgress.find(".div-block-4");
      if (animate) {
        $progressBar.css("width", "0%");
        setTimeout(function () {
          $progressBar.css("width", percent + "%");
        }, 50);
      } else {
        $progressBar.css("width", percent + "%");
      }
    }

    $statusWrapper.css("display", "flex");
  }

  function updateAllCards(videoData, animate) {
    var $cards = $("[data-video-id]");
    log("Updating " + $cards.length + " cards");

    $cards.each(function () {
      var $card = $(this);
      var slug = $card.attr("data-video-id");
      if (!slug) return;
      var video = findVideo(videoData, slug);
      updateCardStatus($card, video, animate);
    });
  }

  function waitForCards(callback, attempts) {
    attempts = attempts || 0;
    var $cards = $("[data-video-id]");

    if ($cards.length > 0) {
      log("Found " + $cards.length + " cards after " + attempts * 100 + "ms");
      callback();
    } else if (attempts < 50) {
      setTimeout(function () {
        waitForCards(callback, attempts + 1);
      }, 100);
    } else {
      log("No cards found after 5 seconds");
    }
  }

  async function loadAndUpdate(animate) {
    var now = Date.now();
    if (now - lastUpdate < 1000) {
      log("Skipping update - too soon");
      return;
    }
    lastUpdate = now;

    var memberstack = window.$memberstackDom;
    if (!memberstack) {
      log("Memberstack not available");
      return;
    }

    try {
      var response = await memberstack.getCurrentMember();
      var member = response.data;

      if (!member) {
        log("No member");
        waitForCards(function () {
          updateAllCards({ watched: [] }, animate);
        });
        return;
      }

      log("Member:", member.id);
      var videoData = getVideoData(member);
      log("Video data:", videoData);

      waitForCards(function () {
        updateAllCards(videoData, animate);
      });
    } catch (e) {
      log("Error loading member:", e);
    }
  }

  function init() {
    log("Initializing...");

    waitForCards(function () {
      updateAllCards({ watched: [] }, false);
    });

    onMemberstackReady(function () {
      log("Memberstack ready");
      loadAndUpdate(true);
    });

    $(window).on("pageshow", function () {
      log("Pageshow event");
      loadAndUpdate(true);
    });

    $(window).on("focus", function () {
      log("Window focus");
      loadAndUpdate(false);
    });

    $(document).on("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        log("Page visible");
        loadAndUpdate(false);
      }
    });
  }

  $(document).ready(init);
})(jQuery);
