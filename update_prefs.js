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
function checkBox(){
	var box = document.getElementById("url_pref");
	var new_URL = box.value;

	if(new_URL == "about:newtab" || new_URL == "" || new_URL.substring(0, 4) == "file"){
		//console.log("Address not allowed: ", new_URL);
		box.style.backgroundColor="#DD6253";

		return false;
	} else{
		//console.log("Initial color now");
		box.style.backgroundColor="initial";
		return true;
	}
}


// Determine URL preference (and sync with preference HTML)
callWithPref("cnt_url_pref", "about:home", function(URL){
	//console.log("URL on prefs page: " + URL);

	//console.log("url after HTTP stripped:", text);
	var input_box = document.getElementById("url_pref");
	if(input_box != null){
		input_box.value = URL;
	}
});


// So the box is red if it needs to be on the initial load
checkBox();

// For some reason other events (like unload and beforeunload and pagehide) do not fire on this
document.addEventListener("keyup", function(e4){

	var box = document.getElementById("url_pref");
	var new_URL = box.value;
	//console.log("setting: " + new_URL);

	browser.storage.local.set({"cnt_url_pref": new_URL});
	browser.runtime.sendMessage({url: new_URL});
	//console.log("Saving URL:  " + new_URL);
	
	// This is used to avoid an infinite loop??
	//if(new_URL != "about:home"){
	//	browser.storage.local.set({"cnt_url_pref": new_URL});
	//}

	checkBox();

});

