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


// Actually puts the focus in the correct place on the page
function placeFocus(win, browser, internPrefBranch){

  // Highlight URL in awesome bar (useful for e.g. yahoo.com)
  if (internPrefBranch.getBoolPref('focus')){ 
    //dump("focus in bar is true\n");
    var bar = win.document.getElementById('urlbar');
    bar.select();
    //dump("focus in the URL bar\n");
  }

  // Place the focus on the page (after it has loaded!)"
  else {
    // This does not work for tabs which are not the focused tab
    if(browser.documentURI.spec === "about:newtab"){
      var bar = browser.contentDocument.getElementById("newtab-search-text")
      bar.select();
      //dump("focus placed in about:newtab search bar\n");
    }
    else{
      browser.focus();
    }
  }

  // Blank the URL
  if (internPrefBranch.getBoolPref('blankurl')){
    // This does not work for tabs which are not the focused tab
    win.document.getElementById('urlbar').value = "";
  }
}

/*
preload,enabled,enhanced = (before load) and (after load)
000 = about:blank and about:newtab  It works!
001 = about:blank and about:newtab  It works!
010 = about:blank and about:newtab  It works!
011 = about:blank and about:newtab  It works!
100 = about:newtab and NO LOAD HERE!  (Preferences -> ednovak.net)
101 = about:newtab and NO LOAD HERE!
110 = about:newtab and NO LOAD HERE!
111*= about:newtab and NO LOAD HERE!

I put in a default setting of preload = false because pages like
the preferences start as about:blank, and then load their content
but they don't throw a "load" event if preload is true.  
The behaivor in this table otherwise actually makes sense, great!
*/


function newTab(event){
  var newTabEvent = event;
  var win = this.ownerDocument.defaultView;
  var browser = win.gBrowser.getBrowserForTab(newTabEvent.target);

  // Remove event listener
  //win.gBrowser.tabContainer.removeEventListener("TabOpen", newTab, false);
  //focus(win, browser);

  //dump("\nA NEW TAB HAS OPENED\n");


  var int_pref = Components.classes["@mozilla.org/preferences-service;1"].
                  getService(Components.interfaces.nsIPrefService).
                  getBranch('extensions.cnt.')

  var newtabpage_pref = Components.classes["@mozilla.org/preferences-service;1"].
                        getService(Ci.nsIPrefService).
                        getBranch('browser.newtabpage.');


  //var enabled = newtabpage_pref.getBoolPref("enabled");
  //var enhanced = newtabpage_pref.getBoolPref("enhanced");
  //dump("newtabpage enabled: " + enabled + "\n");
  //dump("newtagpage enhanced: " + enhanced + "\n");
  //if(browser.documentURI.spec){
  //  dump("URL: " + browser.documentURI.spec + "\n");
  //}

  // This is a good indicator that this is a new tab
  // the user wants to redirect / alter focus on
  // other tabs (from e.g. middle click) will have 
  // a normal URL
  if(browser.documentURI.spec === "about:newtab" || 
     browser.documentURI.spec === "about:blank"){

    browser.addEventListener('load', function(){
      browser.removeEventListener('load', arguments.callee, true);
      if(browser.documentURI.spec === "about:newtab"){
        browser.loadURI(int_pref.getCharPref("newtaburl"));

        // Becuase I just caused a reload I should wait
        // before selecting the URL bar
        browser.addEventListener('load', function(){
          browser.removeEventListener('load', arguments.callee, true);
          placeFocus(win, browser, int_pref);
        }, true);

      }
    }, true);
  }

  else{
    //dump("Ignore this tab, it has a website URL\n");
    // Ignore this tab, the user opened a new tab
    // by clicking a link or something
  }
}


function connectToNewWindow(aWindow, waitForLoad){
  //dump("connect to window: " + aWindow.document.URL + "\n");

	// If this window already exists (like when they install it) then the 
	// TabOpen event listener is never attached to it, cause it doesn't load
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

    // Place the focus for the new tab in this new window
    var browser = aWindow.gBrowser.selectedTab.linkedBrowser;
    var int_pref = Components.classes["@mozilla.org/preferences-service;1"].
                  getService(Components.interfaces.nsIPrefService).
                  getBranch('extensions.cnt.');
    focus(aWindow, browser, int_pref);
  }
}


function myWinObs() {
  //this.reason = null;
  this.observe = function(aWindow, aEvent){
    //dump("Event: " + aEvent + "\n");
    connectToNewWindow(aWindow, true);
  }
}


function ensureDefaults(newPref){

  
  // Guarantee focus_pref
  var int_branch = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Ci.nsIPrefService).getBranch('extensions.cnt.')

  try{
    url_pref = int_branch.getCharPref("newtaburl")
  }
  catch (excep){
    int_branch.setCharPref('newtaburl', 'about:newtab')
  }

  try{
    focus_pref = int_branch.getBoolPref('focus')
    //dump("cur pref: " + focus_pref + "\n")
  }
  catch (excep){
    int_branch.setBoolPref('focus', false);
  }
  
  try{
    empty_pref = int_branch.getBoolPref('blankurl')
  }
  catch (excep){
    int_branch.setBoolPref('blankurl', false);
  }


  // set preload to false to ease my life
  var preload_branch = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Ci.nsIPrefService).getBranch('browser.newtab.');
  if(preload_branch.getBoolPref("preload")){

    // Turn this off cause it causes weirdness
    preload_branch.setBoolPref("preload", false);
  }
}


/////////////
// STARTUP //
function startup(data, reason){ 
  //dump("startup   data: " + data + "  reason: " + reason + "\n");

  // Guarantees that the focus preference (set by the addon) has some default value (false)
  // This is useful for the first run and was previously fixed by ticking and unticking the prefbox
  ensureDefaults();

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
  if(reason == ADDON_INSTALL || reason == ADDON_DOWNGRADE){
    var t = ww.openWindow(null, "chrome://custom-new-tab/content/cnt-about.xul", "Custom New Tab", "chrome,centerscreen", null);
  }

}


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


