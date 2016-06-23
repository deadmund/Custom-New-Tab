//    Copyright 2016 Ed Novak

//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.

//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.

//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.


// This file contains the logic for the preferences page
// It has to set defaults for these preferences because there
// is no "default" feature for the browser local storage API


// Not actually used
function sendUpdateMessage(){
	//console.log("sendUpdateMessage() called");
	browser.runtime.sendMessage({"msg":"update_prefs"});
}


function flipWarning(onOff){

	var warning = document.getElementById("warning");
	if(onOff){
		warning.style.visibility = "visible"
	} else{
		warning.style.visibility = "hidden"
	}

}


// Get / set the URL preference
chrome.storage.local.get("url_pref", function(obj){
	if(obj.url_pref == null){
		obj.url_pref = "http://www.cs.wm.edu/~ejnovak/cnt"
		chrome.storage.local.set({"url_pref": "http://www.cs.wm.edu/~ejnovak/cnt"});
	}
	var input_box = document.getElementById("url_pref");
	input_box.value = obj.url_pref;

	var filePattern = new RegExp("^file://")
	flipWarning(filePattern.test(input_box.value))
});


// Get / set the focus preference
chrome.storage.local.get("focus_pref", function(obj){
	//console.log("current preference state: " + obj.focus_pref);
	if(obj.focus_pref != null){
		var rad_butt = document.getElementById(obj.focus_pref);
	} else{
		var rad_butt = document.getElementById("focus_page")
		chrome.storage.local.set({"focus_pref": "focus_page"})
	}
	rad_butt.checked = true;
});

// For some reason other events (like unload and beforeunload and pagehide) do not fire on this
document.addEventListener("keyup", function(e4){
	//console.log("Key Pressed!");


	var new_pref = document.getElementById("url_pref").value;
	if(new_pref){
		chrome.storage.local.set({"url_pref": new_pref});
		sendUpdateMessage();

		var filePattern = new RegExp("^file://")
		flipWarning(filePattern.test(new_pref))
	}
	return;
});


// Update the preference if the radio buttons are clicked.
document.getElementById("focus_page").addEventListener("click", function(e1){
	//console.log("Focus on Page radio button clicked!");
	chrome.storage.local.set({"focus_pref": "focus_page"});
	sendUpdateMessage();
});

document.getElementById("focus_bar").addEventListener("click", function(e2){
	//console.log("Focus on the Bar radio button clicked!");
	chrome.storage.local.set({"focus_pref": "focus_bar"});
	sendUpdateMessage();
});