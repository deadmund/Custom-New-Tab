
// cnt object for good namespace-ing
var cnt = {

  // This places the tabOpen listener on the gBrowser AFTER IT EXISTS
  // (i.e. after the browser has fully loaded)
  setup : function(event){
    gBrowser.tabContainer.addEventListener('TabOpen', cnt.focus, false)
    
    // This is here to fix the bug that Silvan Benz brought up.
    var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab)
    browser.addEventListener('load', cnt.focus_helper, true)
  }, // End of setup

  // Handler for tab opened
  focus : function(event) {
    //dump("a tab was opened\n")
    var browser = gBrowser.getBrowserForTab(event.originalTarget)
    // Have to wait for the page to finish loading before placing the focus
    browser.addEventListener("load", cnt.focus_helper, true)     
  }, // End of focus
    
  // Handler for the page to finish loading and then drop the focus on that page
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
    if (!prefs.getBoolPref('focus')){ // Place focus on page
      browser.focus()
      //dump("the focus was placed on the page\n")
    }
    
    else{ // Highlight URL in awesome bar
      var bar = window.document.getElementById('urlbar')
      bar.select()
      //dump("the focus was placed in the url bar\n")
    }
    
    // Remove the event listener
    browser.removeEventListener('load', cnt.focus_helper, true)
  }, // End of focus_helper

} // End of cnt

window.addEventListener('load', cnt.setup, false)
