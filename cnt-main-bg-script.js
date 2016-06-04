console.log("Some output from cnt-main-bg-script!");


// for debug purposes
function dumpKeys(obj){
	console.log("Dumping: " + obj)
	for(var k in obj){
		console.log(k + " " + obj[k]);
	}
}

function redir(tab){
	// note: I cannot check for user preferences that have not yet been set
	// this is because of a bug in the firefox implementation of storage: 
	// http://stackoverflow.com/questions/37525394/firefox-extension-unable-to-parse-json-data-for-extension-storage

	// Redirect tab to user preference.  This method leaves focus in URL bar
	browser.storage.local.get("url_pref", function(url_data){
		browser.storage.local.get("focus_pref", function(focus_data){
			// Different block, if the setting wasn't already set, we set it
			if(focus_data.focus_pref == "focus_bar"){
				// This method leaves the focus in the URL bar
				browser.tabs.update(tab.id, {"url":url_data.url_pref});
			} 

			else if (focus_data.focus_pref == "focus_page"){
				// This workaround puts the focus on the page (cause of the call to create) instead of in the URL bar
				chrome.tabs.remove(tab.id); // close the new tab that was opened
				chrome.tabs.create({"url":url_data.url_pref, "active":true}); // open our own tab
			}
		});
	});

}

function newTab(newTab){
	console.log("New tab has been opened, before it has finished loading here is the url: " + newTab.tab.url + "  and here is the status: " + newTab.tab.status)
	//dumpKeys(newTab.tab)

	// If browser.newtab.preload is true, this probably occurs, because the tab has already been loaded
	if(newTab.tab.status === "complete" && newTab.tab.url == "about:newtab"){
		redir(newTab.tab)
	}

	// If preload is false, we have to wait for it to load, then we can redirect
	browser.tabs.onUpdated.addListener(function(tabID, info, tab){
		if(info.status == "complete"){
			// After tab has finished loading remove listener
			browser.tabs.onUpdated.removeListener(arguments.callee);

			if(tab.url == "about:newtab"){
				redir(newTab.tab);
			}
		}
	});
}

browser.tabs.onCreated.addListener(newTab);


