console.log("Some output from cnt-main-bg-script!");


// for debug purposes
function dumpKeys(obj){
	for(var k in obj){
		console.log(k + " " + obj[k]);
	}
}

function newTab(newTab){
	browser.tabs.onUpdated.addListener(function(tabID, info, tab){
		if(info.status == "complete"){
			// After tab has finished loading remove listener
			browser.tabs.onUpdated.removeListener(arguments.callee);

			if(tab.url == "about:newtab"){

				// Redirect tab to user preference.  This method leaves focus in URL bar
				browser.storage.local.get("url_pref", function(url_data){
					browser.storage.local.get("focus_pref", function(focus_data){
						if(focus_data.focus_pref == "focus_bar"){
							// This method leaves the focus in the URL bar
							browser.tabs.update(tabID, {"url":url_data.url_pref});
						} 

						else if (focus_data.focus_pref == "focus_page"){
							// This workaround puts the focus on the page (cause of the call to create) instead of in the URL bar
							chrome.tabs.remove(tab.id); // close the new tab that was opened
							chrome.tabs.create({"index":30, "url":url_data.url_pref, "active":true}); // open our own tab

						}
					});
				});
			}
		}
	});
}


browser.tabs.onCreated.addListener(newTab);

