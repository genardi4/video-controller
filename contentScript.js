function start() {
	if (document.getElementsByTagName("video").length+document.getElementsByTagName("embed").length == 0) {
		setTimeout("start();", 1000);
		return;
	}
	videoController = new VideoController("start");
}
function reloaded() {
	videoController = new VideoController("reloaded");
}
function urlChanged() {
	if (document.getElementsByTagName("video").length+document.getElementsByTagName("embed").length == 0) {
		setTimeout("start();", 1000);
		return;
	}
	videoController = new VideoController("urlChanged");
}
var videoController;
function VideoController(reason) {
	this.reason = reason;
	switch(reason) {
	case "start":
		break;
	case "reloaded":
		break;
	case "urlChanged":
		break;
	}
	this.videos = [];
	this.tabId = null;
	var ytPattern = new RegExp("http://[A-Za-z0-9]*\.youtube\.com/[A-Za-z0-9]*");
	var ytPattern2 = new RegExp("http://[A-Za-z0-9]*\.ytimg\.com/[A-Za-z0-9]*");
	var fObjects = document.getElementsByTagName("embed");
	for (i=0; i<fObjects.length; i++) {
		if (ytPattern.test(fObjects[i].getVideoUrl()) || ytPattern2.test(fObjects[i].getVideoUrl())) {
			this.videos[this.videos.length] = new Video(fObjects[i], false, true);
		}
	}
	var hObjects = document.getElementsByTagName("video");
	for (i=0; i<hObjects.length; i++) {
		if (ytPattern.test(hObjects[i].src) || ytPattern2.test(hObjects[i].src)) {
			this.videos[this.videos.length] = new Video(hObjects[i], true, (this.videos.length+hObjects.length==1));
		}
	}
	this.port = chrome.extension.connect({name: "videoController"});
	this.port.postMessage({videos:this.videos, type:this.reason});
	this.port.onMessage.addListener(function(response) {
		switch(response.type) {
		case "pause":
			videoController.pause(response.playerId);
			break;
		case "play":
			videoController.play(response.playerId);
			break;
		case "volume":
			videoController.volume(response.playerId, response.volume);
			break;
		case "mute":
			videoController.mute(response.playerId, response.mute);
			break;
		case "forward":
			videoController.forward();
			break;
		case "back":
			videoController.back();
			break;
		case "toStart":
			videoController.toStart(response.playerId);
			break;
		case "update":
			for (i=0; i<videoController.videos.length; i++) {
				videoController.videos[i].update();
			}
			videoController.port.postMessage({videos:videoController.videos, type:"update"});
			break;
		}
	});
	this.urlChanged = function urlChanged() {
		alert("url");
	};
	this.reloaded = function reloaded() {
		alert("reload");
	};
	this.unload = function unload() {
		this.port.postMessage({type:"disconnect"});
	};
	this.pause = function pause(playerId) {
		try {
			document.getElementById(playerId).pauseVideo()
		}
		catch(err) {
			document.getElementById(playerId).pause();
		}
	};
	this.play = function play(playerId) {
		try {
			document.getElementById(playerId).playVideo()
		}
		catch(err) {
			document.getElementById(playerId).play()
		}
	};
	this.volume = function volume(playerId, volume) {
		try {
			document.getElementById(playerId).setVolume(volume);
		}
		catch(err) {
			document.getElementById(playerId).volume = volume/100
		}
	};
	this.mute = function mute(playerId, mute) {
		try {
			if (mute)
				document.getElementById(playerId).mute();
			else
				document.getElementById(playerId).unMute();
		}
		catch(err) {
			document.getElementById(playerId).muted = mute;
		}
	};
	this.forward = function forward() {
		document.getElementById("playlist-bar-next-button").click();
	};
	this.back = function back() {
		document.getElementById("playlist-bar-prev-button").click();
	};
	this.toStart = function toStart(playerId) {
		try {
			document.getElementById(playerId).seekTo(0, false);
		}
		catch(err) {
			document.getElementById(playerId).seek = 0;
		}
	};
}

function Video(player, html5, singleVideo) {
	this.id = player.id;
	this.html5 = html5;
	if (html5) {
		this.seek = player.length;
		this.playing = !player.paused;
		this.volume = player.volume*100;
		this.mute = player.muted;
		this.url = player.src;
	}
	else {
		this.seek = player.getCurrentTime();
		this.playing = player.getPlayerState()!=1;
		this.volume = player.getVolume();
		this.mute = player.isMuted();
		this.url = player.getVideoUrl();
	}
	this.title = getTitle(this.url, typeof singleVideo == "boolean"?singleVideo:false);
	this.inList = document.getElementById('playlist-bar').className.indexOf("hid") == -1;
	this.update = function update() {
		if (this.html5) {
			this.seek = player.length;
			this.playing = !player.paused;
			this.volume = player.volume*100;
			this.mute = player.muted;
			this.url = player.src;
		}
		else {
			this.seek = player.getCurrentTime();
			this.playing = player.getPlayerState()!=1;
			this.volume = player.getVolume();
			this.mute = player.isMuted();
			this.url = player.getVideoUrl();
		}
	};
}

function getTitle(url, singleVideo) {
	try {
		return document.getElementById("eow-title").innerText;
	}
	catch(err) {
		return document.title.replace("YouTube - ", "");
	}
}