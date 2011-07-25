// newTab object variable thing
var newTab = {
  onLoad : function (){
    this.initialized = true
    this.strings = document.getElementById('CNT-strings');
    gBrowser.tabContainer.addEventListener('TabOpen', newTab.swap, false)
  }, // End of onLoad
  
  swap : function(event){
    var browser = gBrowser.getBrowserForTab(event.target)
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch('extensions.cnt.')
    var url = prefs.getCharPref('newURL')
    browser.loadURI(url)
  } // End of swap function
}

window.addEventListener('load', newTab.onLoad, false)
