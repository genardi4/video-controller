// Declare the pop-up object.
var vcPopup = new VCPopup();

// The pop-up constructor.
function VCPopup() {

  var clientsInfo = [];
  var autoLoad = true;

  /**
   * The initialization function of the vcPopup object.<br>
   * Called when the pop-up window is loaded
   */
  function load() {
    if (!autoLoad)
      setTimeout(load, 1000);
    else {
      // Ask the storage for the clients list.
      chrome.storage.local.get("clients", function(items) {
        // This local clients array will hold the stringified version of the
        // storage clients array because the tab ids are kept as numbers inside
        // the array but as strings inside the storage object.
        var clients = [];
        for (i in items.clients)
          clients[i] = "" + items.clients[i];
        // Ask the storage for the information of each of the clients.
        var temp = clients.slice(0);
        temp[temp.length]="clients";
        chrome.storage.local.get(temp, function(items) {
          // Create a player per each client.
          for (i in clients) {
            try {
              chrome.tabs.get(parseInt(clients[i]), function(tab) {
                clientsInfo[clients[i]] = items[clients[i]];
                createPlayer(clients[i]);
              });
            }
            catch (e) {
              delete items.clients[i];
              delete items[clients[i]];
              chrome.storage.local.set(items);
            }
          }
        });
      });

      document.getElementById("youtube-button").onclick = function() {
        chrome.tabs.create({
          url : 'http://youtube.com'
        });
      };

      document.getElementById("feedback").onclick = function() {
        chrome.tabs.create({
          url : "http://code.google.com/p/video-controller/issues/entry"
        });
      };

      setTimeout(load, 500);
    }

  }

  /**
   * This method creates a new player and replaces the old one if exists.
   * 
   * @param info:
   *            The information of the player.
   * @param tabId:
   *            The id of the player's tab.
   */
  function createPlayer(tabId) {
    var info = clientsInfo[tabId];
    var row = document.createElement("tr");
    row.setAttribute("id", tabId);

    var col = document.createElement("td");
    row.appendChild(col);

    var player = document.createElement("div");
    player.setAttribute("class", "player");
    col.appendChild(player);

    var upper = document.createElement("div");
    upper.setAttribute("class", "upper");
    player.appendChild(upper);

    var lower = document.createElement("div");
    lower.setAttribute("class", "lower");
    player.appendChild(lower);

    var close = document.createElement("button");
    close.setAttribute("class", "close");
    close.onclick = vcPopup.close;
    upper.appendChild(close);

    var title = document.createElement("button");
    title.setAttribute("class", "title");
    title.onclick = vcPopup.move;
    title.innerHTML = info.name;
    upper.appendChild(title);

    var playPause = document.createElement("button");
    playPause.setAttribute("class", "play-pause");
    playPause.onclick = vcPopup.playPause;
    if (info.status != 1)
      playPause.className += " play";
    else
      playPause.className += " pause";
    lower.appendChild(playPause);

    var toStart = document.createElement("button");
    toStart.setAttribute("class", "toStart");
    toStart.onclick = vcPopup.toStart;
    lower.appendChild(toStart);

    var mute = document.createElement("button");
    mute.setAttribute("class", "mute");
    mute.onclick = vcPopup.mute;
    if (info.isMuted) mute.className += " on";
    lower.appendChild(mute);

    var volume = element = document.createElement("input");
    volume.setAttribute("class", "volume");
    volume.setAttribute("type", "range");
    volume.onchange = vcPopup.volume;
    volume.onmousedown = vcPopup.pauseAutoLoad;
    volume.onmouseup = vcPopup.continueAutoLoad;
    volume.setAttribute("value", info.volume);
    volume.style.backgroundPositionX = info.volume * 1.3 + 4 + "px, 0px";
    lower.appendChild(volume);

    var back = document.createElement("button");
    back.setAttribute("class", "back");
    back.onclick = vcPopup.back;
    if (info.playlist == null || info.playlist[0] == null) {
      back.disabled = true;
    }
    lower.appendChild(back);

    var forward = document.createElement("button");
    forward.setAttribute("class", "forward");
    forward.onclick = vcPopup.forward;
    if (info.playlist == null || info.playlist[1] == null) {
      forward.disabled = true;
    }
    lower.appendChild(forward);

    document.getElementById("no_player_row").className = "hidden";
    if (document.getElementById(tabId) != null)
      document.getElementById("players").replaceChild(row,
        document.getElementById(tabId));
    else
      document.getElementById("players").insertBefore(row,
        document.getElementById("no_player_row"));
  }

  function getTabId(player) {
    return parseInt(player.parentNode.parentNode.parentNode.parentNode.id);
  }
  this.close = function close() {
    var tabId = getTabId(this);
    chrome.tabs.remove(tabId);
  };
  this.move = function move() {
    var tabId = getTabId(this);
    chrome.tabs.update(tabId, {
      active : true
    });
  };
  this.playPause = function playPause() {
    var tabId = getTabId(this);
    chrome.tabs.sendMessage(tabId, {
      action : "playPause"
    });
  };
  this.toStart = function toStart() {
    var tabId = getTabId(this);
    chrome.tabs.sendMessage(tabId, {
      action : "toStart"
    });
  };
  this.mute = function mute() {
    var tabId = getTabId(this);
    chrome.tabs.sendMessage(tabId, {
      action : "mute"
    });
  };
  this.volume = function volume() {
    var tabId = getTabId(this);
    chrome.tabs.sendMessage(tabId, {
      action : "volume",
      value : this.valueAsNumber
    });
    this.style.backgroundPositionX = this.value * 1.3 + 4 + "px, 0px";
  };
  this.back = function back() {
    var tabId = getTabId(this);
    var playlist = clientsInfo[tabId].playlist;
    var videoId = clientsInfo[tabId].url.substr(clientsInfo[tabId].url
      .indexOf("v=")
      + "v=".length);
    if (videoId.indexOf("&") > -1)
      videoId = videoId.substr(0, videoId.indexOf("&"));
    chrome.tabs.update(tabId, {
      url : clientsInfo[tabId].url.replace(videoId, playlist[0]),
    });
    window.close();
  };
  this.forward = function forward() {
    var tabId = getTabId(this);
    var playlist = clientsInfo[tabId].playlist;
    var videoId = clientsInfo[tabId].url.substr(clientsInfo[tabId].url
      .indexOf("v=")
      + "v=".length);
    if (videoId.indexOf("&") > -1)
      videoId = videoId.substr(0, videoId.indexOf("&"));
    chrome.tabs.update(tabId, {
      url : clientsInfo[tabId].url.replace(videoId, playlist[1]),
    });
    window.close();
  };

  this.pauseAutoLoad = function pauseAutoLoad() {
    autoLoad = false;
  };

  this.continueAutoLoad = function continueAutoLoad() {
    autoLoad = true;
  };

  window.onload = load;
}
