const Cc = Components.classes;
const Ci = Components.interfaces;


function focus(event, window){
  //dump("focus\n");
  
  /*
  dump("event.originalTarget: " + event.originalTarget + "\n");
  let doc = event.originalTarget;
  //useful if we want to modify the HTML document loaded
  if (doc instanceof HTMLDocument){
    if(doc.defaultView.frameElement){
      while(doc.defaultView.frameElement){
        doc = doc.defaultView.frameElement
      }
    }
  }
  */
  
  
  // Place the focus (if it's their pref)
  // I can't place the focus on a tab if it isn't the selectedTab so this is
  // as good as it gets.  Opening many tabs very quickly causes many of the
  // tabs to not get the correct focus but oh well.
  // We have to place the focus on the browser for the selected tab.
  // Placing the focus in other things (e.g. contentDocument) doesn't work
  
  var gBrowser = window.gBrowser; // window used below
  var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
  
  // Get their pref
  var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch('extensions.cnt.')
  // When testing, do not use yahoo.com, the focus is controlled by that page somehow
  if (!prefs.getBoolPref('focus')){
    browser.focus();
    //browser.contentDocument.body.innerHTML.getElementById('top')
    //dump("the focus was placed on the page\n")
  }
  
  
  // This is the default behavior so I probably don't need this else anymore
  else{ // Highlight URL in awesome bar (useful for e.g. yahoo.com)
    var bar = window.document.getElementById('urlbar')
    bar.select()
    //dump("the focus was placed in the url bar\n")
  }
}



function newTab(event){
  //dump("attempt: " + this.ownerDocument.defaultView + "\n");
  var window = this.ownerDocument.defaultView;
  var gBrowser = window.gBrowser;
  var browser = gBrowser.getBrowserForTab(event.originalTarget);
  browser.addEventListener('load', function(event){
    focus(event, window)
    browser.removeEventListener('load', arguments.callee, true);
  }, true);

}



function aSubjectLoaded(event){
  var window = this; // This is the thing that the listener is attached too
  if('gBrowser' in window){
    window.gBrowser.tabContainer.addEventListener('TabOpen', newTab, false);
  }
}



function setURL(newURL){
  var branch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch('browser.newtab.')
  branch.setCharPref('url', newURL);

}



function myWinObs() {
  this.observe = function(aSubject, aTopic, aData){
    //dump("Window Activity, Topic: " + aTopic + "\n");;
    aSubject.addEventListener('load', aSubjectLoaded, false);
  }
}



/////////////
// STARTUP //
function startup(data, reason){ 
  //dump("startup   data: " + data + "  reason: " + reason + "\n");

  // New windows
  var ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
  observer = new myWinObs();
  ww.registerNotification(observer);
  
  // All currently open windows
  var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
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
  var ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
  ww.unregisterNotification(observer);

 // All currently open windows
  var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
  var enumerator = wm.getEnumerator(null)
  while(enumerator.hasMoreElements()){
    var win = enumerator.getNext();
    // I have no way to remove the event listener because it was added as an anon function
    win.gBrowser.tabContainer.removeEventListener('TabOpen', newTab, false);
  }
  
}



/////////////
// INSTALL //
function install(data, reason) { 
  //dump("install   data: " + data + "  reason: " + reason + "\n");

  // I had a lot of trouble getting this to do anything useful

  var branch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch('extensions.cnt.')
  branch.setBoolPref('focus', false);

  wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
  var win = wm.getMostRecentWindow(null)
  win.gBrowser.addTab("www.ednovak.net/cnt");

}



///////////////
// UNINSTALL //
function uninstall(data, reason) { 
  //dump("uninstall   data: " + data + "  reason: " + reason + "\n");
  
  setURL('about:newtab');
  
}
