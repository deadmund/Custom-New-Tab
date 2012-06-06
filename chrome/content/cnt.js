
// cnt object for good namespace-ing
var cnt = {

  // Listen for a tab opened
  focus : function(event) {
    var browser = gBrowser.getBrowserForTab(event.originalTarget)
    // Have to wait for the page to finish loading before placing the focus
    browser.addEventListener("load", cnt.focus_helper, true)
      
  }, // End of focus
    
  // Listen for the page to finish loading and then slam the focus on the page
  focus_helper : function (event){
    
    // Get their pref
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch('extensions.cnt.')
    
    // Place the focus (if it's their pref)
    // I can't place the focus on a tab if it isn't the selectedTab so this is
    // as good as it gets.  Opening many tabs very quickly causes many of the
    // tabs to not get the correct focus but oh well.
    // We have to place the focus on the browser for the selected tab.
    // Placing the focus in other things (e.g. contentDocument) doesn't work
    var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab)
    if (!prefs.getBoolPref('focus')){
      browser.focus()
    }
    
    // Remove the event listener
    browser.removeEventListener('load', cnt.focus_helper, true)
  }, // End of focus_helper

} // End of cnt

gBrowser.tabContainer.addEventListener('TabOpen', cnt.focus, false)
