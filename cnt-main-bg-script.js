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





// Callback for when new tabs are opened
// This causes an infinite loop in combination with the browser.tabs.create call above
// I avoid this infinite loop by using the stallpath as the trigger below
// The first time stall.html is opened (thanks to manifest) but then it is never opened again
function newTab(newTab){

	//console.log("New Tab Opened.  ID: " + newTab.id + "\n"   + " status:" + newTab.status + "  url: " + newTab.url + " openerTabId:" + newTab.openerTabId);

	// openerTabId is the id of the tab that opened this one.
	// For "new" tabs (green plus, ctrl+t, etc) this will be undefined
	if( newTab.url=="about:newtab" && (typeof newTab.openerTabId) == "undefined" ){

		if(FOCUS){
			// workaround way, places focus on the page
			// interrupts operation of some other extensions
			var id = newTab.id
			//console.log("URL: " + URL)
			browser.tabs.create({openerTabId: id, url:URL, active: true})
			browser.tabs.remove(id);

		} else { 
			// Normal (preferred) way
			//console.log("preferred way!  URL:" + URL);
			browser.tabs.update(newTab.id, {url:URL, active:true})
		}
	}
}

// This is necessary because we only load the 
// preference once the add-on is started
// This updates it (msg sent from prefs.js)
// Everytime the user changes it
function handleMessage(request, sender, resp){
	//console.log("Updating URL preference on message");
	var url = request.url;
	URL = url;
	//console.log("message got, URL: " + url

	//console.log("Updating focus preference on message");
	var focus = request.focus;
	FOCUS = focus;
}


// Load the preferences when extension is loaded
URL = "not yet set";
FOCUS = "not yet set";

browser.storage.local.get("cnt_url_pref", function(result){
	//console.log("got preference!!");
	URL = result["cnt_url_pref"];
	if(URL == undefined){
		URL = "about:home";
	}
	//console.log("URL set: " + URL)
});

browser.storage.local.get("cnt_focus_pref", function(result){
	FOCUS = result["cnt_focus_pref"];
	if(FOCUS == undefined){
		FOCUS = false;
	}
});

// Listen for new preference of URL
browser.runtime.onMessage.addListener(handleMessage);

// Listen for new tabs
browser.tabs.onCreated.addListener(newTab);



