(function () {
  "use strict";

  // ============ CONFIGURATION ============
  var CONFIG = {
    completionThreshold: 90, // Mark complete at 90%
    saveInterval: 10, // Save every 10 seconds
    resumeThreshold: 5, // Resume if watched more than 5 seconds
    fieldKey: "video-data", // Memberstack custom field key
    debug: true // Set false to disable console logs
  };

  // ============ HELPER FUNCTIONS ============

  function log(msg, data) {
    if (CONFIG.debug) console.log("[VideoTrack]", msg, data || "");
  }

  // Get slug from current page URL
  // URL: /practice-assets/low-trust-safety-affecting-the-capacity-for-dialogue
  // Returns: "low-trust-safety-affecting-the-capacity-for-dialogue"
  function getVideoSlug() {
    var slug = window.location.pathname.split("/").pop();
    log("Video slug:", slug);
    return slug;
  }

  // Wait for Memberstack to be ready
  function onMemberstackReady(callback) {
    if (window.$memberstackReady) {
      callback();
    } else {
      document.addEventListener("memberstack.ready", callback);
    }
  }

  // Wait for Vimeo SDK to load
  function waitForVimeo(callback, attempts) {
    attempts = attempts || 0;
    if (typeof Vimeo !== "undefined") {
      callback();
    } else if (attempts < 50) {
      setTimeout(function () {
        waitForVimeo(callback, attempts + 1);
      }, 100);
    }
  }

  // Show toast notification
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

  // Format seconds to MM:SS
  function formatTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
  }

  // ============ MEMBERSTACK DATA FUNCTIONS ============

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
    if (!data.watched) data.watched = [];
    return data;
  }

  // Save video data to Memberstack
  async function saveVideoData(memberstack, data) {
    try {
      await memberstack.updateMember({
        customFields: {
          [CONFIG.fieldKey]: JSON.stringify(data)
        }
      });
      log("Saved to Memberstack");
    } catch (e) {
      log("Save error:", e);
    }
  }

  // Get saved position for this video
  function getSavedPosition(videoData, slug) {
    var video = videoData.watched.find(function (v) {
      return v.id === slug;
    });
    return video ? video.last_position || 0 : 0;
  }

  // ============ MAIN TRACKING FUNCTION ============

  async function initTracking() {
    var memberstack = window.$memberstackDom;
    var response = await memberstack.getCurrentMember();
    var member = response.data;

    if (!member) {
      log("No member logged in");
      return;
    }

    log("Member:", member.id);

    // Find Vimeo iframe on page
    var iframe = document.querySelector('iframe[src*="vimeo.com"]');
    if (!iframe) {
      log("No Vimeo iframe found");
      return;
    }

    // Initialize Vimeo player
    var player = new Vimeo.Player(iframe);
    var videoSlug = getVideoSlug();
    var videoData = getVideoData(member);
    var savedPosition = getSavedPosition(videoData, videoSlug);

    log("Saved position:", savedPosition);

    // Track state
    var state = {
      hasResumed: false,
      lastSaveTime: 0,
      duration: 0
    };

    // Get video duration
    player.getDuration().then(function (d) {
      state.duration = d;
    });

    // -------- EVENT: Play --------
    player.on("play", function () {
      // Resume from saved position
      if (!state.hasResumed && savedPosition > CONFIG.resumeThreshold) {
        state.hasResumed = true;
        player.setCurrentTime(savedPosition).then(function () {
          showToast("Resuming from " + formatTime(savedPosition));
        });
      }

      // Mark as started
      updateVideo(videoSlug, { started: true });
    });

    // -------- EVENT: Time Update --------
    player.on("timeupdate", function (data) {
      var currentTime = data.seconds;
      var percent = Math.round(data.percent * 100);

      // Save every X seconds
      if (currentTime - state.lastSaveTime >= CONFIG.saveInterval) {
        state.lastSaveTime = currentTime;
        updateVideo(videoSlug, {
          last_position: currentTime,
          percent_watched: percent
        });
      }

      // Check for completion
      if (percent >= CONFIG.completionThreshold && !isCompleted(videoSlug)) {
        updateVideo(videoSlug, {
          completed: true,
          last_position: 0,
          percent_watched: 100
        });
        showToast("Video completed! ✓");
      }
    });

    // -------- EVENT: Pause --------
    player.on("pause", function (data) {
      updateVideo(videoSlug, {
        last_position: data.seconds,
        percent_watched: Math.round(data.percent * 100)
      });
    });

    // -------- EVENT: Ended --------
    player.on("ended", function () {
      updateVideo(videoSlug, {
        completed: true,
        last_position: 0,
        percent_watched: 100
      });
    });

    // -------- Helper: Check if completed --------
    function isCompleted(slug) {
      var video = videoData.watched.find(function (v) {
        return v.id === slug;
      });
      return video && video.completed;
    }

    // -------- Helper: Update video record --------
    function updateVideo(slug, updates) {
      var video = videoData.watched.find(function (v) {
        return v.id === slug;
      });

      if (!video) {
        video = {
          id: slug,
          title: document.title,
          started: false,
          completed: false,
          percent_watched: 0,
          last_position: 0
        };
        videoData.watched.push(video);
      }

      // Apply updates
      Object.keys(updates).forEach(function (key) {
        video[key] = updates[key];
      });

      log("Updated:", video);
      saveVideoData(memberstack, videoData);
    }
  }

  // ============ INITIALIZE ============

  waitForVimeo(function () {
    onMemberstackReady(function () {
      initTracking();
    });
  });
})();
