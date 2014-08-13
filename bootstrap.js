const Cc = Components.classes;
const Ci = Components.interfaces;
const ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
const wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");


var myPListener = {
    QueryInterface: XPCOMUtils.generateQI(["nsIWebProgressListener", "nsISupportsWeakReference"]),

    onStateChange: function(aWebProgress, aRequest, aFlag, aStatus) { },

    // This is called when about:newtab loads (or if any other page is loaded)
    onLocationChange: function(aWebProgress, aRequest, aURI, aFlag) { 
      //dump("onLocationChange: " + aURI.spec + "\n");
      if(aURI.spec != "about:newtab"){
        aWebProgress.removeProgressListener(this);
      }
    },
    onProgressChange: function(aWebProgress, aRequest, curSelf, maxSelf, curTot, maxTot) { 
      //dump("onProgressChange: " + curSelf + "/" + maxSelf + "\n");
      try{
        var bar = aWebProgress.DOMWindow.document.getElementById("newtab-search-text");
        bar.select();
      }
      catch(err){
        //dump("err caught: " + err + "\n");
      }

      //aWebProgress.removeProgressListener(this);
    },
    onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) { },
    onSecurityChange: function(aWebProgress, aRequest, aState) { },
};

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

If focus() is consolidated then newTab and firstNewWindow both just
set up event, win (respectively), and newTabEvent then focus looks
like this: focus(event, win, newTabEvent

newTab calls: focus(event, win=this.ownerDocument.defaultView, newTabEvent = event);
firstNewWindow calls: focus(event, win=this, newWindowEvent = event)
*/


function focus(win, browser){

  var focus_pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch('extensions.cnt.')
  var url_pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch('browser.newtab.')

  // Special case for about:newtab
  if( url_pref.getCharPref('url') === "about:newtab" && (!focus_pref.getBoolPref('focus')) ){
    //dump("flow for about:newtab\n");
    browser.addProgressListener(myPListener);
  }


  // Sometimes the about:newtab page loads, sometimes it does not.  If the preload
  // flag is true, the page will still load the first one or two times.
  // Then it will not load anymore (unless it's bumped out of cache?)
  // If the flag is flase, it will always load.
  else{
    // Every other website
    browser.addEventListener('load', function(){
      //dump("page finished loading\n");
      //dump("page URL: " + browser.documentURI.spec + "\n");
      //dump("flow for random page\n");

      // This if statement is ideal, except that the URL may change
      // for example: slashdot.org might become beta.slashdot.org
      // becuase of this, I can't reliably check the URL
      //if( browser.documentURI.spec == url_pref.getCharPref('url') ){

      // When testing, do not use yahoo.com, the focus is controlled by that page somehow
      // Focus in the url bar (this is the default behavior, I can remove this entirely?)
      if (focus_pref.getBoolPref('focus')){ // Highlight URL in awesome bar (useful for e.g. yahoo.com)
        var bar = win.document.getElementById('urlbar');
        bar.select();
        //dump("focus in the URL bar\n");
      }
      // When testing, do not use yahoo.com, the focus is controlled by that page somehow
      // Place the focus on the page (fater it has loaded!"
      else {
        // This does not work for tabs which are not the focused tab
        browser.focus();
      }
      //}

      browser.removeEventListener('load', arguments.callee, true);
      //dump("focus done\n");
    }, true);
  }

}


// This sucks a bit because I need to pass window to focus() so I have
// to use an anonymous function
function newTab(event){
  var newTabEvent = event;
  var win = this.ownerDocument.defaultView;
  var browser = win.gBrowser.getBrowserForTab(newTabEvent.originalTarget);

  focus(win, browser);
}

function firstWindow(event){
  var win = this;
  // Even about:newtab loads when it is in the first new window

  // This works if the home page is the same as browser.newtab setting
  win.removeEventListener('load', firstWindow, false);
  var browser = win.gBrowser.selectedTab.linkedBrowser;

  focus(win, browser);
}


function connectToNewWindow(aWindow){
  //dump("connect to window: " + aWindow.document.URL + "\n");

  // Normal windows, normal URL
  if('gBrowser' in aWindow){
    aWindow.gBrowser.tabContainer.addEventListener("TabOpen", newTab, false);
  }
}


function myWinObs() {
  //this.reason = null;

  this.observe = function(aWindow, aEvent){
    //dump("new " + aEvent + "\n");

    if(this.reason == APP_STARTUP){ // First new window!
      this.reason = null;
      aWindow.addEventListener('load', firstWindow, false);
    }

    if(aEvent == "domwindowopened" || aEvent == "domwindowclosed") {
      aWindow.addEventListener('load', function(event){
        connectToNewWindow(aWindow);  
        aWindow.removeEventListener('load', arguments.callee, true);
      }, true);
    }
  }
}



/////////////
// STARTUP //
function startup(data, reason){ 
  //dump("startup   data: " + data + "  reason: " + reason + "\n");

    // All currently open windows
  var enumerator = wm.getEnumerator("navigator:browser")
  num = 1;
  while(enumerator.hasMoreElements()){
    var win = enumerator.getNext();
    connectToNewWindow(win);
  }

  // New windows
  observer = new myWinObs();
  observer.reason = reason;
  ww.registerNotification(observer);

  // Show the about window on upgrade and so on
  //dump("installed reason: " + reason + "\n");
  if(reason == ADDON_INSTALL){
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
  // I had a lot of trouble getting this to do anything useful
  // The problem is the install happens before the browser window
  // has fully loaded when I symlink directly from the extensions/ 
}





///////////////
// UNINSTALL //
function uninstall(data, reason) { 
}


