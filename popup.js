var videoController;
if (typeof videoController == "undefined") {
	initVC();
}
function initVC() {
	if (document.body != null) {
		events = new Events();
		videoController = new VideoController();
		videoController.bgPage.videoController.popup = this;
		preloader();
	}
	else {
		setTimeout("initVC()", 200);
	}
}
function preloader() {
	var hover = "icons/hover/";
	var pressed = "icons/pressed/";
	var regular = "icons/regular/";
	var imgs = ["back.png", 
	              "forward.png", 
	              "pause.png", 
	              "play.png", 
	              "reload.png", 
	              "volume-mute.png", 
	              "volume-on.png", 
	              "x.png"];
	var images = ["icons/disabled/back.png", 
	              "icons/disabled/forward.png",
	              "icons/volume-bar/volume-bar-gray.png",
	              "icons/volume-bar/volume-bar-handle.png",
	              "icons/volume-bar/volume-bar-purple.png"];
	for (i=0; i<imgs.length; i++) {
		images.push(hover+imgs[i]);
		images.push(pressed+imgs[i]);
		images.push(regular+imgs[i]);
	}
	var tempImg = new Image();
	for (i=0; i<images.length; i++) {
		tempImg.src=images[i];
	}
}
window.onunload = function() {
	videoController.bgPage.videoController.popup = null;
}
function VideoController() {
	this.bgPage = chrome.extension.getBackgroundPage();
	this.addPlayer = function addPlayer(player, first) {
		var playerNode = new PlayerNode(player, first);
		document.getElementById("players").appendChild(playerNode);
	};
	this.pauseVideo = function pauseVideo(tabId, playerId) {
		this.bgPage.videoController.pauseVideo(tabId, playerId);
	};
	this.playVideo = function playVideo(tabId, playerId) {
		this.bgPage.videoController.playVideo(tabId, playerId);
	};
	this.volume = function volume(tabId, playerId, vol) {
		this.bgPage.videoController.volume(tabId, playerId, vol);
	};
	this.mute = function mute(tabId, playerId, mute) {
		this.bgPage.videoController.mute(tabId, playerId, mute);
	};
	this.forward = function forward(tabId, playerId) {
		this.bgPage.videoController.forward(tabId, playerId);
	};
	this.back = function back(tabId, playerId) {
		this.bgPage.videoController.back(tabId, playerId);
	};
	this.toStart = function toStart(tabId, playerId) {
		this.bgPage.videoController.toStart(tabId, playerId);
	};
	this.toTab = function toTab(tabId, playerId) {
		this.bgPage.videoController.toTab(tabId);
	};
	this.close = function close(tabId) {
		chrome.tabs.remove(tabId);
	};
	this.removeTab = function removeTab(tabId, playerId) {
		row = document.getElementById(tabId+"_"+playerId+"_row");
		player = row.firstChild.firstChild;
		if (player.className.indexOf(" first") != -1)
			if (row.nextElementSibling != null)
				row.nextElementSibling.firstChild.firstChild.className+=" first";
		row.parentNode.removeChild(row);
		chrome.tabs.remove(parseInt(tabId));
	};
	this.updateTab = function updateTab(players, tabId) {
		for (i=0; i<players.length; i++) {
			players[i].tabId = tabId;
			r = document.getElementById(tabId+"_"+players[i].id+"_"+"row");
			r.parentNode.replaceChild(new PlayerNode(players[i], false), r);
		}
	};
	var tabs = this.bgPage.videoController.tabs;
	if (tabs.index.length == 0) {
		//TODO no videos...
		return;
	}
	for (i=0; i<tabs.index.length; i++) {
		var players = tabs[tabs.index[i]].players;
		if (players.index.length != 0) {
			document.getElementById("no_player_row").className = "hidden";
		}
		for (j=0; j<players.index.length; j++) {
			var player = players[players.index[j]];
			player.tabId = tabs.index[i];
			this.addPlayer(player, j+i==0);
		}
	}
}
function getPlayerId(element) {
	var temp = element.parentElement.parentElement.parentElement.id;
	return temp.substring(temp.indexOf("_")+1, temp.lastIndexOf("_"));
}
function getTabId(element) {
	var temp = element.parentElement.parentElement.parentElement.id;
	return temp.substring(0,temp.indexOf("_"));
}
function Events() {
	this.pausePlay = function pausePlay(event) {
		tabId = getTabId(this);
		playerId = getPlayerId(this);
		if (this.className.indexOf(" play") != -1) {
			this.className = this.className.substring(0, this.className.indexOf(" play"))+" pause";
			videoController.playVideo(tabId, playerId);
		}
		else if (this.className.indexOf(" pause") != -1) {
			this.className = this.className.substring(0, this.className.indexOf(" pause"))+" play";
			videoController.pauseVideo(tabId, playerId);
		}
	};
	this.volume = function volume(event) {
		tabId = getTabId(this);
		playerId = getPlayerId(this);
		this.style.backgroundPositionX = this.value*1.3+4+"px, 0px";
		videoController.volume(tabId, playerId, this.value);
	};
	this.mute = function mute(event) {
		tabId = getTabId(this);
		playerId = getPlayerId(this);
		if (this.className.indexOf(" mute_on") != -1) {
			this.className = this.className.substring(0, this.className.indexOf(" mute_on"));
			videoController.mute(tabId, playerId, false);
		}
		else {
			this.className += " mute_on";
			videoController.mute(tabId, playerId, true);
		}
	};
	this.forward = function forward(event) {
		tabId = getTabId(this);
		playerId = getPlayerId(this);
		videoController.forward(tabId, playerId);
	};
	this.back = function back(event) {
		tabId = getTabId(this);
		playerId = getPlayerId(this);
		videoController.back(tabId, playerId);
	};
	this.toStart = function toStart(event) {
		tabId = getTabId(this);
		playerId = getPlayerId(this);
		videoController.toStart(tabId, playerId);
	};
	this.toTab = function toTab(event) {
		tabId = getTabId(this);
		playerId = getPlayerId(this);
		videoController.toTab(tabId, playerId);
	};
	this.close = function close(event) {
		tabId = getTabId(this);
		playerId = getPlayerId(this);
		videoController.removeTab(tabId, playerId);
		videoController.close(tabId, playerId);
	};
}
function PlayerNode(info, first) {
	var row = document.createElement("tr");
	row.setAttribute("id", info.tabId+"_"+info.id+"_row");
	
	var col = document.createElement("td");
	col.setAttribute("id", info.tabId+"_"+info.id+"_col");
	row.appendChild(col);
	
	var player = new Element({type:"div", className:"player", playerId:info.id});
	if (first) player.className+=" first";
	col.appendChild(player);
	
	var upper  = new Element({type:"div", className:"upper", playerId:info.id});
	player.appendChild(upper);
	
	var lower  = new Element({type:"div", className:"lower", playerId:info.id});
	player.appendChild(lower);
	
	var close  = new Element({type:"button", clickEvent:events.close, className:"close button", playerId:info.id});
	upper.appendChild(close);
		
	var title  = new Element({type:"button", clickEvent:events.toTab, className:"button title", text:info.title, playerId:info.id});
	upper.appendChild(title);
	
	var pausePlay = new Element({type:"button", clickEvent:events.pausePlay, className:"button lower_button", playerId:info.id});
	if (info.playing) pausePlay.className+=" play";
	else pausePlay.className+=" pause";
	lower.appendChild(pausePlay);
	
	var toStart  = new Element({type:"button", clickEvent:events.toStart, className:"toStart button lower_button", playerId:info.id});
	lower.appendChild(toStart);
	
	var mute  = new Element({type:"button", clickEvent:events.mute, className:"mute button lower_button", playerId:info.id});
	if (info.mute) mute.className+=" mute_on";
	lower.appendChild(mute);
	
	var volume  = new Element({type:"volume", event:events.volume, className:"volume lower_button", playerId:info.id, value:info.volume});
	lower.appendChild(volume);
	
	var back  = new Element({type:"button", clickEvent:events.back, className:"back button lower_button", playerId:info.id});
	lower.appendChild(back);
	
	var forward  = new Element({type:"button", clickEvent:events.forward, className:"forward button lower_button", playerId:info.id});
	lower.appendChild(forward);
	
	return row;
}
function Element(info) {
	if (typeof info.type != "string") {
		return null;
	}
	var element = document.createElement(info.type);
	if (info.type == "volume") {
		element = document.createElement("input");
		element.setAttribute("type", "range");
		if (typeof info.event != "undefined") 
			element.addEventListener("change", info.event)
		if (typeof info.value != "undefined") {
			element.setAttribute("value", info.value);
			element.style.backgroundPositionX = info.value*1.3+4+"px, 0px";
		}
	}
	if (typeof info.className == "string") {
		element.className = info.className;
	}
	if (typeof info.text == "string") {
		element.innerHTML = info.text;
	}
	if (typeof info.clickEvent == "function") {
		element.addEventListener("click", info.clickEvent);
	}
	return element;
}