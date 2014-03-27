const Cc = Components.classes;
const Ci = Components.interfaces;
const ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
const wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);


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

function focus(event, window){
  // Place the focus (if it's their pref)
  // I can't place the focus on a tab if it isn't the selectedTab so this is
  // as good as it gets.  Opening many tabs very quickly causes many of the
  // tabs to not get the correct focus but oh well.  I'm not going to 
  // radily focus() each page to place the curosr in the right place
  // We have to place the focus on the browser for the selected tab.
  // Placing the focus in other things (e.g. contentDocument) doesn't work
  
  var gBrowser = window.gBrowser; // window used below
  var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
  
  // Get their pref
  var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch('extensions.cnt.')
  // When testing, do not use yahoo.com, the focus is controlled by that page somehow
  if (!prefs.getBoolPref('focus')){
    browser.focus();
  }
  
  // This is the default behavior so I probably don't need this else anymore
  else{ // Highlight URL in awesome bar (useful for e.g. yahoo.com)
    var bar = window.document.getElementById('urlbar')
    bar.select()
  }
}


// This sucks a bit because I need to pass window to focus so I have
// to use an anonymous function
function newTab(event){
  var newTabEvent = event;
  var win = this.ownerDocument.defaultView;
  var gBrowser = win.gBrowser;
  var browser = gBrowser.getBrowserForTab(newTabEvent.originalTarget);
  browser.addEventListener('load', function(event){
    if(gBrowser.selectedTab == newTabEvent.originalTarget){ // This is the foreground tab
      focus(event, win);
      browser.removeEventListener('load', arguments.callee, true);
    }
  }, true);
}


// This sucks a bit because I need to pass window to focus so I have
// to use an anonymous function
function firstNewWindow(event){
  var win = this;
  var browser = win.gBrowser.selectedTab.linkedBrowser;
  browser.addEventListener('load', function(event){
    browser.removeEventListener('load', arguments.callee, true);
    focus(event, win)
  }, true);
}



function newWindow(event){
  var win = this; // This is the thing that the listener is attached too
  if('gBrowser' in win){
    win.gBrowser.tabContainer.addEventListener('TabOpen', newTab, false);
  }
}


function setFocus(newPref){
  var branch = Components.classes["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch('extensions.cnt.')
  branch.setBoolPref('focus', newPref);
}



function setURL(newURL){
  var branch = Components.classes["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch('browser.newtab.')
  branch.setCharPref('url', newURL);

}

function setPreload(newPreload){
  var branch = Components.classes["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch('browser.newtab.');
  branch.setBoolPref('preload', newPreload);
}



function myWinObs() {
  //this.reason = null;

  this.observe = function(aWindow, aEvent){
    if(aEvent == "domwindowopened"){
      aWindow.addEventListener('load', newWindow, false);
      //dump("this.reason: " + this.reason + "\n");

      if(this.reason == APP_STARTUP){
        this.reason = null;
        aWindow.addEventListener('load', firstNewWindow, false);
      }

      if(this.reason == ADDON_INSTALL || this.reason == ADDON_UPGRADE || this.reason == ADDON_DOWNGRADE || this.reason == ADDON_ENABLE){
        this.reason = null;
        var t = ww.openWindow(null, "chrome://custom-new-tab/content/cnt-about.xul", "Custom New Tab", "chrome,centerscreen", null);
      }
    }
  }
}


/////////////
// STARTUP //
function startup(data, reason){ 
  //dump("startup   data: " + data + "  reason: " + reason + "\n");

  // New windows
  observer = new myWinObs();
  observer.reason = reason;
  ww.registerNotification(observer);
  
  // All currently open windows
  var enumerator = wm.getEnumerator(null)
  while(enumerator.hasMoreElements()){
    var win = enumerator.getNext();
    win.gBrowser.tabContainer.addEventListener('TabOpen', newTab, false);
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

  if(reason == ADDON_DISABLE){
    setURL('about:newtab');
    setPreload(false);
  }

  dump("shutdown reason: " + reason + "\n");
  
}



/////////////
// INSTALL //
function install(data, reason) { 
  //dump("install   data: " + data + "  reason: " + reason + "\n");
  // I had a lot of trouble getting this to do anything useful
  // The problem is the install happens before the browser window
  // has fully loaded when I symlink direction from the extensions/ 
  setFocus(false);
  setPreload(true);
  //wm.addListener(myWinListener);
  observer = new myWinObs();
  observer.reason = reason;
  ww.registerNotification(observer);
}



///////////////
// UNINSTALL //
function uninstall(data, reason) { 
  setURL('about:newtab');
  setFocus(false);
  setPreload(false);
}
