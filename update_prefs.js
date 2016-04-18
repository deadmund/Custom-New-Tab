function sendUpdateMessage(){
	console.log("sendUpdateMessage() called");
	browser.runtime.sendMessage({"msg":"update_prefs"});
}

chrome.storage.local.get("url_pref", function(obj){
	if(obj.url_pref == null){
		obj.url_pref = "http://www.cs.wm.edu/~ejnovak/cnt"
		chrome.storage.local.set({"url_pref": "http://www.cs.wm.edu/~ejnovak/cnt"});
	}
	var input_box = document.getElementById("url_pref");
	input_box.value = obj.url_pref;
});


chrome.storage.local.get("focus_pref", function(obj){
	//console.log("current preference state: " + obj.focus_pref);
	if(obj.focus_pref != null){
		var rad_butt = document.getElementById(obj.focus_pref);
		rad_butt.checked = true;
	}
});

// For some reason other events (like unload and beforeunload and pagehide) do not fire on this
document.addEventListener("keyup", function(e4){
	//console.log("Key Pressed!");


	var new_pref = document.getElementById("url_pref").value;
	if(new_pref){
		chrome.storage.local.set({"url_pref": new_pref});
		sendUpdateMessage();
	}
	return;
});

document.getElementById("focus_page").addEventListener("click", function(e1){
	console.log("Focus on Page radio button clicked!");
	chrome.storage.local.set({"focus_pref": "focus_page"});
	sendUpdateMessage();
});

document.getElementById("focus_bar").addEventListener("click", function(e2){
	console.log("Focus on the Bar radio button clicked!");
	chrome.storage.local.set({"focus_pref": "focus_bar"});
	sendUpdateMessage();
});