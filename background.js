function destroy(tab) {
	setTimeout("chrome.tabs.remove("+tab.id+")", 500);
}
function sendFeedback() {
	chrome.tabs.create({selected:true, url:"http://code.google.com/p/video-controller/issues/entry"});
}
var videoController;
if (typeof videoController == "undefined") {
	videoController = new VideoController();
}
chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
	if (testUrl(tab.url)) {
		if (typeof videoController != "undefined") {
			if (videoController.tabs[tabId]) {
				if (videoController.tabs[tabId].url != tab.url) {
					chrome.tabs.executeScript(tabId, {file:"contentScript.js"});
					chrome.tabs.executeScript(tabId, {code:"setTimeout('urlChanged();', 1500);"});
				}
				else if (info.status == "loading") {
					chrome.tabs.executeScript(tabId, {file:"contentScript.js"});
					chrome.tabs.executeScript(tabId, {code:"setTimeout('reloaded();', 1500);"});
				}
			}
			else if (info.status == "loading") {
				chrome.tabs.executeScript(tabId, {file:"contentScript.js"});
				chrome.tabs.executeScript(tabId, {code:"setTimeout('start();', 1500);"});
			}
		}
	}
});
function testUrl(url) {
	var tester = new RegExp("http://[A-Za-z0-9]*\.youtube\.com/[A-Za-z0-9]*");
	return tester.test(url);
}
chrome.extension.onConnect.addListener(function(port) {
	if (typeof videoController == "undefined") {
		videoController = new VideoController();
	}
	console.assert(port.name == "videoController");
	port.onDisconnect.addListener(function(port) {
		setTimeout("videoController.removeTab("+port.sender.id+")", 3000);
	});
	port.onMessage.addListener(function(msg, sender) {
		if (msg.type == "start") {
			videoController.addPlayers(msg.videos, sender);
		}
		else if (msg.type == "urlChanged") {
			if (testUrl(sender.tab.url)) {
				videoController.updateTab(msg.videos, sender);
			}
		}
		else if (msg.type == "reloaded") {
			videoController.tabReloaded(msg.videos, sender);
		}
	});
});
function VideoController() {
	this.tabs = {index:[]};
	this.popup = null;
	this.addPlayers = function addPlayers(players, port) {
		if (!this.tabs[port.sender.id])
			this.tabs.index[this.tabs.index.length] = port.sender.id;
		this.tabs[port.sender.id] = new Tab(port.sender.id, port, port.sender.url);
		this.tabs[port.sender.id].addPlayers(players);
	};
	this.updateTab = function updateTab(players, port) {
		this.tabs[port.sender.id].updatePlayers(players);
		this.tabs[port.sender.id].port = port;
		if (this.popup != null) {
			this.popup.videoController.updateTab(players, port.sender.id);
		}
	};
	this.tabReloaded = function tabReloaded(players, port) {
		this.tabs[port.sender.id].port = port;
		if (this.popup != null) {
			this.popup.videoController.updateTab(players, port.sender.id);
		}
	};
	this.updateAll = function updateAll() {
		for (i=0; i<this.tabs.index.length; i++) {
			this.tabs[this.tabs.index[i]].port.postMessage({type:"update"});
		}
	};
	this.removeTab = function removeTab(tabId) {
		try {
			this.tabs[tabId].port.postMessage({type:"test"});
		}
		catch(err) {
			var tab = this.tabs[tabId];
			this.close(tabId);
			for (i=0; i<tab.players.index; i++) {
				var playerId = tab.players[tab.players.index[i]].id;
				if (this.popup != null) {
					this.popup.videoController.removeTab(tabId, playerId);
				}
			}
		}
	};
	this.pauseVideo = function pauseVideo(tabId, playerId) {
		this.tabs[tabId].players[playerId].playing = false;
		this.tabs[tabId].port.postMessage({type:"pause", playerId:playerId});
	};
	this.playVideo = function playVideo(tabId, playerId) {
		this.tabs[tabId].players[playerId].playing = true;
		this.tabs[tabId].port.postMessage({type:"play", playerId:playerId});
	};
	this.volume = function volume(tabId, playerId, vol) {
		this.tabs[tabId].players[playerId].volume = vol;
		this.tabs[tabId].port.postMessage({type:"volume", playerId:playerId, volume:vol});
	};
	this.mute = function mute(tabId, playerId, mute) {
		this.tabs[tabId].players[playerId].mute = mute;
		this.tabs[tabId].port.postMessage({type:"mute", playerId:playerId, mute:mute});
	};
	this.forward = function forward(tabId) {
		this.tabs[tabId].port.postMessage({type:"forward"});
	};
	this.back = function back(tabId) {
		this.tabs[tabId].port.postMessage({type:"back"});
	};
	this.toTab = function toTab(tabId) {
		chrome.tabs.update(parseInt(tabId), {selected:true});
	};
	this.toStart = function toStart(tabId, playerId) {
		this.tabs[tabId].port.postMessage({type:"toStart", playerId:playerId});
	};
	this.close = function close(tabId) {
		this.tabs[tabId] = null;
		this.tabs.index.splice(this.tabs.index.indexOf(parseInt(tabId)),1);
	};
}
function Tab(tabId, port) {
	this.players = {index:[]};
	this.id = tabId;
	this.port = port;
	this.url = port.sender.url;
	this.addPlayers = function addPlayers(players) {
		for (i=0; i<players.length; i++) {
			this.players.index[this.players.index.length] = players[i].id;
			players[i].tabId = tabId;
			this.players[players[i].id] = players[i];
		}
	}
	this.updatePlayers = function updatePlayers(players) {
		for (i=0; i<players.length; i++) {
			this.players[players[i].id] = players[i];
		}
	};
}