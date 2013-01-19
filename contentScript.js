// Declare the client object.
var vcClient = new VCClient();

// The constructor for the client object.
function VCClient() {
  // A reference to the object.
  var self = this;

  // The YouTube player object.
  this.player = null;

  var playlist = null;

  // The id of this tab.
  var tabId = -1;

  // Ask the background page for this tab tabId.
  chrome.extension.sendMessage({
    type : "tabId"
  }, function(response) {
    tabId = response.tabId;
  });

  // Add a listener to the extension messaging system.
  chrome.extension.onMessage.addListener(messageListener);

  /**
   * Initializes the YouTube player.<br>
   * Sometimes the JavaScript loads before the DOM has the time to finish
   * loading and the YouTube player can't be found. To solve this, this function
   * will try 10 times to find it each try is separated by 1000ms.
   * 
   * @param tries:
   *            The current number of tries.
   */
  function initPlayer(tries) {

    // If tries was not set, set it to 0.
    if (tries == undefined) tries = 0;

    // Try to fetch the YouTube player object.
    self.player = document.getElementById("movie_player");

    // Check if the player element was found & it started playing.
    try {

      if (self.player.getPlayerState() > -1) {

        // Favorites are not supported.
        if (playlist == null && window.location.href.indexOf("list=") != -1
          && window.location.href.indexOf("list=F") == -1) {
          var listStart = window.location.href.indexOf("list=")
            + "list=".length;
          var playlistName = window.location.href.substr(listStart);
          if (playlistName.indexOf("&") > -1)
            playlistName = playlistName.substr(0, playlistName.indexOf("&"));
          var xhr = new XMLHttpRequest();
          xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
              var json = JSON.parse(xhr.responseText);
              if (self.player.getPlaylistIndex() > 0) {
                playlist = [json.data.items[0].video.id, null];
                if (json.data.items.length > 2)
                  playlist[1] = json.data.items[2].video.id;
              }
              else if (json.data != null)
                playlist = [null, json.data.items[1].video.id];
            }
          };
          xhr.open("GET", "http://gdata.youtube.com/feeds/api/playlists/"
            + playlistName
            + "?v=2&alt=jsonc&max-results=3&start-index="
            + (self.player.getPlaylistIndex() > 1 ? self.player
              .getPlaylistIndex() : 1), true);
          xhr.send();
          throw null;
        }
        else {
          // start updating the extension local storage.
          updateStorage();
        }
      }
      else
        throw null;
    }
    catch (e) {
      if (tries < 10) window.setTimeout(function() {
        initPlayer(tries + 1);
      }, 1000);
    }
  }

  /**
   * Updates the local storage to include this player information. This method
   * is recalled every 1000ms to keep the player updated.
   */
  function updateStorage() {
    // Ask the storage for the clients list and the information for this tab.
    chrome.storage.local.get(["clients", "" + tabId], function(items) {
      // Add the id for this tab to the clients list.
      if (items.clients == undefined) items.clients = [];
      if (items.clients.indexOf("" + tabId) == -1)
        items.clients[items.clients.length] = "" + tabId;

      // Add the information object for this tab's player.
      if (items[tabId] == undefined) items[tabId] = {};

      items[tabId] = {
        // The name of this video (its the content of the meta-tag title).
        name : document.getElementsByName("title")[0].content,
        // Ask the player for the volume, status & check if it is muted.
        volume : self.player.getVolume(),
        isMuted : self.player.isMuted(),
        status : self.player.getPlayerState(),
        playlist : playlist,
        url : window.location.href,
      };

      // Update the storage accordingly and recall this method in 1000ms.
      chrome.storage.local.set(items, function() {
        // window.setTimeout(updateStorage, 1000);
      });
    });

  }

  /**
   * Listens to messages from the pop-up object.
   * 
   * @param request
   * @param sender
   * @param sendResponse
   */
  function messageListener(request, sender, sendResponse) {
    switch (request.action) {
    case "playPause":

      if (self.player.getPlayerState() != 2)
        self.player.pauseVideo();
      else if (self.player.getPlayerState() == 0) {
        self.player.seekTo(0);
        self.player.playVideo();
      }
      else
        self.player.playVideo();
      updateStorage();
      break;
    case "toStart":
      self.player.seekTo(0);
      if (self.player.getPlayerState() != 1) self.player.playVideo();
      updateStorage();
      break;
    case "mute":
      if (self.player.isMuted())
        self.player.unMute();
      else
        self.player.mute();
      updateStorage();
      break;
    case "volume":
      self.player.setVolume(request.value);
      updateStorage();
      break;
    }
  }

  // Initialize the YouTube player when the window finishes loading.
  window.addEventListener('load', function() {
    initPlayer();
  });
}
