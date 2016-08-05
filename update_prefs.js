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
};


function callWithPref(name, defaultVal, callback){
	browser.storage.local.get(name, function(ans){
		if(ans[name] == null){ // set the value of this preference (name) is not yet set
			console.log("setting default value for ", name, " -- ", defaultVal);
			ans[name] = defaultVal;
			browser.storage.local.set(ans);
		}

		console.log("callWithPref for", name, " sending: ", ans[name], "  ans: ", ans, "  name: ", name);

		callback(ans[name]);
	});
};


// Determine URL preference (and sync with preference HTML)
callWithPref("cnt_url_pref", "about:home", function(URL){
	console.log("url_pref: ", URL);

	// This is not a problem (even for about:newtab) because there is no http:// to strip
	text = URL.replace(/^(http:\/\/)/,""); // Strip HTML if necessary
	console.log("url after HTTP stripped:", text);
	var input_box = document.getElementById("url_pref");
	if(input_box != null){ // occurs becuase this page is loaded in the background section of the manifest
		input_box.value = text;
	}
});



callWithPref("cnt_focus_pref", "focus_page", function(pref){
	var rad_butt = document.getElementById(pref);
	if(rad_butt != null){  // occures because this page is loaded in the background section of the manifest (at launch)
		rad_butt.checked = true;
	}
});


// For some reason other events (like unload and beforeunload and pagehide) do not fire on this
document.addEventListener("keyup", function(e4){
	//console.log("Key Pressed!");
	var box = document.getElementById("url_pref");
	var new_URL = box.value;
	if(new_URL == "about:blank" || new_URL == "about:newtab" || new_URL == ""){
		console.log("Address not allowed: ", new_URL);
		box.style.backgroundColor="red";

		return
	} else{
		console.log("Initial color now");
		box.style.backgroundColor="initial";
	}

	if(new_URL != "about:home"){
		new_URL = "http://" + new_URL;
	}

	browser.storage.local.set({"cnt_url_pref": new_URL});
	sendUpdateMessage();
});


// Update the preference if the radio buttons are clicked.
document.getElementById("focus_page").addEventListener("click", function(e1){
	//console.log("Focus on Page radio button clicked!");
	browser.storage.local.set({"cnt_focus_pref": "focus_page"});
	sendUpdateMessage();
});

document.getElementById("focus_bar").addEventListener("click", function(e2){
	//console.log("Focus on the Bar radio button clicked!");
	browser.storage.local.set({"cnt_focus_pref": "focus_bar"});
	sendUpdateMessage();
});