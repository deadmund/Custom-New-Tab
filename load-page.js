

// Very simple redirect (I have to read from storage so I can't do this in HTML)
chrome.storage.local.get("cnt_url_pref", function(result){
	var URL = result["cnt_url_pref"];
	if(URL == undefined){
		URL = "about:newtab";
	}
	//console.log("URL in load-page.js: " + URL);
	document.location=URL
});

