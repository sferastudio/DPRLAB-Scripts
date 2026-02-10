console.log("dpr-practice-topics.js");
(function ($) {
  "use strict";

  var CONFIG = {
    fieldKey: "video-data",
    debug: true
  };

  var lastUpdate = 0;
  var cachedVideoData = null;

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

  function getTopicSlug() {
    return window.location.pathname.split("/").pop();
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
    if (!data.watched) data.watched = [];
    if (!data.topic_totals) data.topic_totals = {};
    return data;
  }

  function saveTopicTotal(videoData, topicSlug, count) {
    if (!topicSlug || !count) return;
    if (videoData.topic_totals[topicSlug] === count) return;

    videoData.topic_totals[topicSlug] = count;
    var memberstack = window.$memberstackDom;
    if (!memberstack) return;

    memberstack.updateMember({
      customFields: {
        [CONFIG.fieldKey]: JSON.stringify(videoData)
      }
    }).then(function () {
      log("Saved topic total:", topicSlug + " = " + count);
    }).catch(function (e) {
      log("Error saving topic total:", e);
    });
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
        cachedVideoData = { watched: [] };
        waitForCards(function () {
          updateAllCards(cachedVideoData, animate);
        });
        return;
      }

      log("Member:", member.id);
      var videoData = getVideoData(member);
      cachedVideoData = videoData;
      log("Video data:", videoData);

      waitForCards(function () {
        updateAllCards(videoData, animate);
        saveTopicTotal(videoData, getTopicSlug(), $("[data-video-id]").length);
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

    // Watch for dynamically added cards (e.g. nested Finsweet CMS)
    var observer = new MutationObserver(function (mutations) {
      if (!cachedVideoData) return;
      var hasNewCards = false;
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.hasAttribute && node.hasAttribute("data-video-id")) {
            hasNewCards = true;
          } else if (node.querySelectorAll) {
            var nested = node.querySelectorAll("[data-video-id]");
            if (nested.length > 0) hasNewCards = true;
          }
        });
      });
      if (hasNewCards) {
        log("New cards detected via MutationObserver");
        updateAllCards(cachedVideoData, true);
        saveTopicTotal(cachedVideoData, getTopicSlug(), $("[data-video-id]").length);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  $(document).ready(init);
})(jQuery);
