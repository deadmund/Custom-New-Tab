// newTab object variable thing
var customNewTab = {
  onLoad : function (){
    this.initialized = true
    gBrowser.tabContainer.addEventListener('TabOpen', customNewTab.swap, false)
  }, // End of onLoad
  
  swap : function(event){
    var browser = gBrowser.getBrowserForTab(event.target)
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch('extensions.custom-new-tab.')
    var url = prefs.getCharPref('newURL')
    browser.loadURI(url)
  } // End of swap function
}

window.addEventListener('load', customNewTab.onLoad, false)
