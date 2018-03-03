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


function callWithPref(name, defaultVal, callback){
	// This function is a wrapper
	// It allows for easy calling of a function
	// with a paramter that is a user preference
	// (user preferences are read asynchronously)
	// It also allows for specifying a deafult value
	// if the user has not yet set this preference

	browser.storage.local.get(name, function(ans){
		if(ans[name] == null){ // set the value of this preference (name) is not yet set
			//console.log("setting default value for ", name, " -- ", defaultVal);
			ans[name] = defaultVal;
			browser.storage.local.set(ans);
		}

		//console.log("callWithPref for", name, " sending: ", ans[name], "  ans: ", ans, "  name: ", name);

		callback(ans[name]);
	});
};



// Colors the box red for invalid URIs
function verifyBox(){
	var box = document.getElementById("url_pref");
	var new_URL = box.value;

	//console.log("verifying box url: ", new_URL);

	if(new_URL == "about:newtab" || new_URL == "" || new_URL.substring(0, 4) == "file"){
		//console.log("Address not allowed: ", new_URL);
		box.style.backgroundColor="#DD6253";

		//console.log("INVALID URL: " + new_URL);

		return false;
	} else{
		//console.log("Initial color now");
		box.style.backgroundColor="initial";
		return true;
	}

	verifyBox();
}


function updatePrefs(){
	var urlbox = document.getElementById("url_pref");
	var focusbox = document.getElementById("focus_pref");

	browser.storage.local.set({"cnt_url_pref": urlbox.value});
	browser.storage.local.set({"cnt_focus_pref": focusbox.checked});

	browser.runtime.sendMessage({url: urlbox.value, focus: focusbox.checked});

	verifyBox();
}


// Determine URL preference (and sync with preference HTML)
callWithPref("cnt_url_pref", "about:home", function(URL){
	//console.log("URL on prefs page: " + URL);

	//console.log("url after HTTP stripped:", text);
	var input_box = document.getElementById("url_pref");
	if(input_box != null){
		input_box.value = URL;
	}

	verifyBox();
});


// Determine focus preference (and sync with preferenct HTML)
callWithPref("cnt_focus_pref", false, function(focus){

	var check_box = document.getElementById("focus_pref")
	if(check_box != null){
		check_box.checked = focus
	}

	verifyBox();
})




// Update settings whne user makes changes
// For some reason other events (like unload and beforeunload and pagehide) do not fire on this
document.addEventListener("keyup", function(e4){
	updatePrefs();
});

// Update settings when user makes changes
document.addEventListener("click", function(e4){
	updatePrefs();
});




