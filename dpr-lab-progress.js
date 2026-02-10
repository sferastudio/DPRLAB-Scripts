console.log("dpr-lab-progress.js");
(function ($) {
  "use strict";

  var CONFIG = {
    fieldKey: "video-data",
    debug: true
  };

  var lastUpdate = 0;

  function log(msg, data) {
    if (CONFIG.debug) console.log("[LabProgress]", msg, data || "");
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
    if (!data.watched) data.watched = [];
    if (!data.topic_totals) data.topic_totals = {};
    return data;
  }

  function updateTopicStatuses(videoData) {
    var $topics = $("[data-topic-status]");
    if (!$topics.length) return;
    log("Updating " + $topics.length + " topic statuses");

    $topics.each(function () {
      var $topicWrapper = $(this);
      var $card = $topicWrapper.closest(".w-dyn-item");
      if (!$card.length) $card = $topicWrapper.parent();

      var topicSlug =
        $card.find("[data-topic-slug]").attr("data-topic-slug") ||
        $card.attr("data-topic-slug");

      if (!topicSlug) {
        log("No topic slug found for card");
        return;
      }

      // Filter watched videos that belong to this topic
      var topicVideos = videoData.watched.filter(function (v) {
        return v.topics && v.topics.indexOf(topicSlug) !== -1;
      });

      var completedCount = 0;
      var startedCount = 0;
      var totalPercent = 0;

      topicVideos.forEach(function (video) {
        if (video.completed) {
          completedCount++;
          totalPercent += 100;
        } else if (video.started) {
          startedCount++;
          totalPercent += (video.percent_watched || 0);
        }
      });

      var total = (videoData.topic_totals && videoData.topic_totals[topicSlug]) || topicVideos.length;

      var $notStarted = $topicWrapper
        .find(".asset_progress-item")
        .not(".is-in-progress, .is-complete");
      var $inProgress = $topicWrapper.find(".is-in-progress");
      var $completed = $topicWrapper.find(".is-complete");

      $topicWrapper.find(".asset_progress-item").hide();

      if (total > 0 && completedCount === total) {
        $completed.css("display", "flex");
      } else if (completedCount === 0 && startedCount === 0) {
        $notStarted.css("display", "flex");
      } else {
        var avgPercent = total > 0 ? Math.round(totalPercent / total) : 0;

        $inProgress.css("display", "flex");

        $inProgress
          .find("div")
          .not(".asset_progress-icon-block, .asset_progress-bar")
          .each(function () {
            if (!isNaN(parseInt($(this).text()))) {
              $(this).text(avgPercent + "% (" + completedCount + "/" + total + ")");
            }
          });

        var $progressBar = $inProgress.find(".div-block-5");
        $progressBar.css("width", avgPercent + "%");
      }

      $topicWrapper.css("display", "flex");
    });
  }

  async function loadAndUpdate() {
    var now = Date.now();
    if (now - lastUpdate < 1000) return;
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
        updateTopicStatuses({ watched: [] });
        return;
      }

      log("Member:", member.id);
      var videoData = getVideoData(member);
      log("Video data:", videoData);
      updateTopicStatuses(videoData);
    } catch (e) {
      log("Error loading member:", e);
    }
  }

  function init() {
    log("Initializing...");

    updateTopicStatuses({ watched: [] });

    onMemberstackReady(function () {
      log("Memberstack ready");
      loadAndUpdate();
    });

    $(window).on("pageshow", function () {
      loadAndUpdate();
    });

    $(window).on("focus", function () {
      loadAndUpdate();
    });

    $(document).on("visibilitychange", function () {
      if (document.visibilityState === "visible") loadAndUpdate();
    });
  }

  $(document).ready(init);
})(jQuery);
