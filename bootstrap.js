const Cc = Components.classes;
const Ci = Components.interfaces;
const ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
const wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function deepDump(obj){
  for(attrib in obj){
    dump(attrib + " " + obj[attrib] + "\n");
  }
}

/*
const APP_STARTUP = 1; //The application is starting up.
const APP_SHUTDOWN = 2; //The application is shutting down.
const ADDON_ENABLE = 3; //The add-on is being enabled.
const ADDON_DISABLE = 4; //The add-on is being disabled.
const ADDON_INSTALL = 5; //The add-on is being installed.
const ADDON_UNINSTALL = 6; //The add-on is being uninstalled.
const ADDON_UPGRADE = 7; //The add-on is being upgraded.
const ADDON_DOWNGRADE = 8; //The add-on is being downgraded.
*/


/*
Focus() can be consolidated so that it does the 'load'
event listener.  However, I learned recently that firefox will fuck
with the URL bar after a page is loaded.  SO, whether the user
wants the focus on the page, or in the url bar, they must wait
until the page in the new tab (or new window) has finished loading
*/

function deepFocus(win, browser, pref, override_fg){
  var fg = browser === win.gBrowser.mCurrentTab.linkedBrowser;
  //dump('fg: ' + fg + "   override: " + override_fg + "\n");
  if(!override_fg){
    if(!fg){
      return null;
    }
  }


  if (pref.getBoolPref('focus')){ // Highlight URL in awesome bar (useful for e.g. yahoo.com)
    //dump("focus is true\n");
    var bar = win.document.getElementById('urlbar');
    bar.select();
    //dump("focus in the URL bar\n");
  }

  // Place the focus on the page (after it has loaded!)"
  else {
    // This does not work for tabs which are not the focused tab
    //dump("focus is false\n");
    if(browser.documentURI.spec === "about:newtab"){
      var bar = browser.contentDocument.getElementById("newtab-search-text")
      bar.select();
      //dump("focus placed in about:newtab search bar\n");
    }
    else{
      browser.focus();
    }
  }


  if (pref.getBoolPref('blankurl')){
	var newtab_pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch('browser.newtab.');
    // This does not work for tabs which are not the focused tab
	if (win.document.getElementById('urlbar').value == newtab_pref.getCharPref('url'))
	{
		win.document.getElementById('urlbar').value = "";
	}
  }
}



function focus(win, browser){

  var pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch('extensions.cnt.')

  //  There is a bug here, the load event will not be fired
  // Note: about:blank and about:config both will fire load events
  var newtab_pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch('browser.newtab.')
  if(newtab_pref.getBoolPref("preload") && newtab_pref.getCharPref('url') === "about:newtab"){
    //dump("preload and about:newtab\n");
    //deepFocus(win, browser, pref, true); // doesn't work cause page is not loaded
    return;
  }
  

  browser.addEventListener('load', function(){
    browser.removeEventListener('load', arguments.callee, true);
    deepFocus(win, browser, pref, false);
    }, true);
}


/*
// Special cases for about:newtab
// about:newtab never fires a load event
// If preload is true, it usually does not fire anything, and it sometimes throws a generic error
// when attaching a progresslistener
// System JS : ERROR chrome://global/content/bindings/browser.xml:518 - NS_ERROR_FAILURE: Component returned failure code: 0x80004005 (NS_ERROR_FAILURE) [nsIWebProgress.addProgressListener]
if( newtab_pref.getCharPref('url') === "about:newtab" && 
 (!pref.getBoolPref('focus'))){ 
  browser.addProgressListener(myPListener);
}


// These both get the URL of the new tab
// If called before the load event, they will be about:blank regardless of what page is loading
//dump("new tab: " + browser.contentDocument.URL + "\n");
//dump("new tab: " + browser.documentURI.spec + "\n");
// Careful becuase while loading the URL may change
// for example: slashdot.org might become beta.slashdot.org (duckduckgo.com -> https://duckduckgo.com/)
// because of this, I can't reliably check the URL
//if( browser.documentURI.spec == url_pref.getCharPref('url') ){ }
*/


// This sucks a bit because I need to pass window to focus() so I have
// to use an anonymous function
function newTab(event){
  var newTabEvent = event;
  var win = this.ownerDocument.defaultView;
  var browser = win.gBrowser.getBrowserForTab(newTabEvent.target);
  focus(win, browser);
}


function connectToNewWindow(aWindow, waitForLoad){
  //dump("connect to window: " + aWindow.document.URL + "\n");

	// If this window already exists (like when they install it) then the 
	// TabOpen event listener is never attached to it cause it doesn't load

  if(waitForLoad){
    aWindow.addEventListener('load', function(){
      aWindow.removeEventListener('load', arguments.callee, false);
      deepConnectToNewWindow(aWindow);
    }, false);
  }
  else{
    deepConnectToNewWindow(aWindow);
  }

}


function deepConnectToNewWindow(aWindow){
  if('gBrowser' in aWindow){
    aWindow.gBrowser.tabContainer.addEventListener('TabOpen', newTab, false);

    var browser = aWindow.gBrowser.selectedTab.linkedBrowser;
    focus(aWindow, browser);
  }
}


function myWinObs() {
  //this.reason = null;
  this.observe = function(aWindow, aEvent){
    //dump("Event: " + aEvent + "\n");
    connectToNewWindow(aWindow, true);
  }
}


function ensureFocus(newPref){
  var branch = Components.classes["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch('extensions.cnt.')
  try{
    focus_pref = branch.getBoolPref('focus')
    //dump("cur pref: " + focus_pref + "\n")
  }
  catch (excep){
    focus_pref = false;
  }
  branch.setBoolPref('focus', focus_pref);
}


/////////////
// STARTUP //
function startup(data, reason){ 
  //dump("startup   data: " + data + "  reason: " + reason + "\n");

  // Guarantees that the focus preference (set by the addon) has some default value (false)
  // This is useful for the first run and was previously fixed by ticking and unticking the prefbox
  ensureFocus()

    // All currently open windows
  var enumerator = wm.getEnumerator("navigator:browser")
  num = 1;
  while(enumerator.hasMoreElements()){
    var win = enumerator.getNext();
    connectToNewWindow(win, false);
  }

  // New windows
  observer = new myWinObs();
  observer.reason = reason;
  ww.registerNotification(observer);

  // Show the about window on upgrade and so on
  //dump("installed reason: " + reason + "\n");
  if(reason == ADDON_INSTALL || reason == ADDON_UPGRADE || reason == ADDON_DOWNGRADE){
    var t = ww.openWindow(null, "chrome://custom-new-tab/content/cnt-about.xul", "Custom New Tab", "chrome,centerscreen", null);
  }

}

// Bug: When the first window starts, the url is not placed in the URL bar of about:newtab





//////////////
// SHUTDOWN //
function shutdown(data, reason) { 
  //dump("shutdown   data: " + data + "  reason: " + reason + "\n");
  
  // Turn this bad boy off
  // stop listening for new windows
  ww.unregisterNotification(observer);

 // All currently open windows
 // Remove event listener from all current windows
  var enumerator = wm.getEnumerator(null)
  while(enumerator.hasMoreElements()){
    var win = enumerator.getNext();
    // I have no way to remove the event listener because it was added as an anon function
    win.gBrowser.tabContainer.removeEventListener('TabOpen', newTab, false);
  }

  //dump("shutdown reason: " + reason + "\n");
}




/////////////
// INSTALL //
function install(data, reason) { 
  //dump("install   data: " + data + "  reason: " + reason + "\n");
  // I had a lot of trouble getting this function to do anything useful
  // The problem is the install happens before the browser window
  // has fully loaded when I symlink directly from the extensions/
  // Also, it fires with reason=8 (ADDON_DOWNGRADE) if it's 
  // the same version number (annoyingly)
}





///////////////
// UNINSTALL //
function uninstall(data, reason) { 
}


