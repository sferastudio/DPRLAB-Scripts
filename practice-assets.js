(function () {
  "use strict";

  // ============ CONFIGURATION ============
  var CONFIG = {
    completionThreshold: 90,
    saveInterval: 10,
    resumeThreshold: 5,
    fieldKey: "video-data",
    debug: true
  };

  function log(msg, data) {
    if (CONFIG.debug) console.log("[VideoTrack]", msg, data || "");
  }

  function getVideoSlug() {
    var slug = window.location.pathname.split("/").pop();
    log("Video slug:", slug);
    return slug;
  }

  function onMemberstackReady(callback) {
    if (window.$memberstackReady) {
      callback();
    } else {
      document.addEventListener("memberstack.ready", callback);
    }
  }

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

  function formatTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
  }

  // ============ PARSE VIMEO URL ============
  function parseVimeoUrl(url) {
    // Handle various Vimeo URL formats:
    // https://vimeo.com/1154941604/fb7da4d87b
    // https://vimeo.com/1154941604
    // https://player.vimeo.com/video/1154941604?h=fb7da4d87b
    
    var match = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/|\?h=)?(\w+)?/);
    if (match) {
      return {
        id: match[1],
        hash: match[2] || null
      };
    }
    return null;
  }

  // ============ CREATE VIMEO IFRAME ============
  function createVimeoIframe() {
    var container = document.querySelector('.vimeo-player');
    if (!container) {
      log("No .vimeo-player container found");
      return null;
    }

    var vimeoUrl = container.getAttribute('data-vimeo-url');
    if (!vimeoUrl) {
      log("No data-vimeo-url attribute found");
      return null;
    }

    var videoInfo = parseVimeoUrl(vimeoUrl);
    if (!videoInfo) {
      log("Could not parse Vimeo URL:", vimeoUrl);
      return null;
    }

    log("Vimeo ID:", videoInfo.id);
    log("Vimeo Hash:", videoInfo.hash);

    // Build embed URL
    var embedUrl = "https://player.vimeo.com/video/" + videoInfo.id;
    if (videoInfo.hash) {
      embedUrl += "?h=" + videoInfo.hash;
    }

    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;";
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');

    // Clear container and add iframe
    container.innerHTML = '';
    container.appendChild(iframe);

    log("Vimeo iframe created");
    return iframe;
  }

  // ============ MEMBERSTACK DATA FUNCTIONS ============
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
      // Still create iframe for non-members
      createVimeoIframe();
      return;
    }

    log("Member:", member.id);

    // Create Vimeo iframe from URL
    var iframe = createVimeoIframe();
    if (!iframe) {
      log("Could not create Vimeo iframe");
      return;
    }

    // Wait a moment for iframe to load
    setTimeout(function() {
      // Initialize Vimeo player
      var player = new Vimeo.Player(iframe);
      var videoSlug = getVideoSlug();
      var videoData = getVideoData(member);
      var savedPosition = getSavedPosition(videoData, videoSlug);

      log("Saved position:", savedPosition);

      var state = {
        hasResumed: false,
        lastSaveTime: 0,
        duration: 0
      };

      player.getDuration().then(function (d) {
        state.duration = d;
        log("Duration:", d);
      });

      player.on("play", function () {
        if (!state.hasResumed && savedPosition > CONFIG.resumeThreshold) {
          state.hasResumed = true;
          player.setCurrentTime(savedPosition).then(function () {
            showToast("Resuming from " + formatTime(savedPosition));
          });
        }
        updateVideo(videoSlug, { started: true });
      });

      player.on("timeupdate", function (data) {
        var currentTime = data.seconds;
        var percent = Math.round(data.percent * 100);

        if (currentTime - state.lastSaveTime >= CONFIG.saveInterval) {
          state.lastSaveTime = currentTime;
          updateVideo(videoSlug, {
            last_position: currentTime,
            percent_watched: percent
          });
        }

        if (percent >= CONFIG.completionThreshold && !isCompleted(videoSlug)) {
          updateVideo(videoSlug, {
            completed: true,
            last_position: 0,
            percent_watched: 100
          });
          showToast("Video completed! ✓");
        }
      });

      player.on("pause", function (data) {
        updateVideo(videoSlug, {
          last_position: data.seconds,
          percent_watched: Math.round(data.percent * 100)
        });
      });

      player.on("ended", function () {
        updateVideo(videoSlug, {
          completed: true,
          last_position: 0,
          percent_watched: 100
        });
      });

      function isCompleted(slug) {
        var video = videoData.watched.find(function (v) {
          return v.id === slug;
        });
        return video && video.completed;
      }

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

        Object.keys(updates).forEach(function (key) {
          video[key] = updates[key];
        });

        log("Updated:", video);
        saveVideoData(memberstack, videoData);
      }
    }, 500);
  }

  // ============ INITIALIZE ============
  waitForVimeo(function () {
    onMemberstackReady(function () {
      initTracking();
    });
  });
})();
