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

// This is the primary logic for the CNT app

//console.log("Some output from cnt-main-bg-script!");


// for debug purposes
//function dumpKeys(obj){
//	console.log("Dumping: " + obj)
//	for(var k in obj){
//		console.log(k + " " + obj[k]);
//	}
//}


// Redirect the given tab to the user prefered URL
function redir(tab){
	// console.log("redir happened");
	// note: I cannot check for user preferences that have not yet been set
	// this is because of a bug in the firefox implementation of storage: 
	// http://stackoverflow.com/questions/37525394/firefox-extension-unable-to-parse-json-data-for-extension-storage

	// Redirect tab to user preference.  This method leaves focus in URL bar
	browser.storage.local.get("cnt_url_pref", function(url_data){
		browser.storage.local.get("cnt_focus_pref", function(focus_data){
			//console.log("inside redir url: ", url_data.cnt_url_pref, "  focus: ", focus_data.cnt_focus_pref, "  which is from this object: ", focus_data);

			// Different block, if the setting wasn't already set, we set it
			if(focus_data.cnt_focus_pref == "focus_bar"){
				// This method leaves the focus in the URL bar
				browser.tabs.update(tab.id, {"url":url_data.cnt_url_pref});
			} 

			else if (focus_data.cnt_focus_pref == "focus_page"){
				// This workaround puts the focus on the page (cause of the call to create) instead of in the URL bar
				browser.tabs.remove(tab.id); // close the new tab that was opened
				browser.tabs.create({"url":url_data.cnt_url_pref, "active":true}); // open our own tab
			}
		});
	});

}


// Callback for when new tabs are opened
function newTab(newTab){
	//console.log("New tab has been opened, before it has finished loading here is the url: " + newTab.url + "  and here is the status: " + newTab.status)
	//dumpKeys(newTab.tab)

	var tab = newTab;

	// If browser.newtab.preload is true, this probably occurs, because the tab has already been loaded
	if(tab.status === "complete" && tab.url == "about:newtab"){
		redir(tab)
	}

	// If preload is false, we have to wait for it to load, then we can redirect
	browser.tabs.onUpdated.addListener(function(tabID, info, _tab){
		if(info.status == "complete"){
			// After tab has finished loading remove listener
			browser.tabs.onUpdated.removeListener(arguments.callee);

			if(_tab.url == "about:newtab"){
				redir(tab);
			}
		}
	});
}


function setDefault(name, defaultVal){
	browser.storage.local.get(name, function(res){
		if(res[name] == null){
			//console.log("setting default value for ", name, " -- ", defaultVal, "{", name, ": ", defaultVal, "}");
			res[name] = defaultVal;
			browser.storage.local.set(res);
		}
	});
}

// Check if this is the first run
// If this is a fresh install, then launch the preferences dialog
browser.storage.local.get("cnt_first_time", function(ans){
	// There is actually no way that it should be == true
	// at the end of the function I set it to false (nowhere is it set to true)
	if(ans["cnt_first_time"] == null || ans["cnt_first_time"] == true){
		//setDefault("cnt_url_pref", "about:home");
		//setDefault("cnt_focus_pref", "focus_page");

		// There is a race condition here (cause the previous call is async)
		// so I have to set defaults in both places! (weird)
		browser.runtime.openOptionsPage();

		// It's not the first time anymore
		ans["cnt_first_time"] = false
		browser.storage.local.set({"cnt_first_time": false})
	}
});


browser.tabs.onCreated.addListener(newTab);


