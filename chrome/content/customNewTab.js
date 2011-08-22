
// newTab object (for the good namespaces)
var customNewTab = {
  onLoad : function (){
    gBrowser.tabContainer.addEventListener('TabOpen', customNewTab.swap, false)
  }, // End of onLoad
  
  swap : function(event){
    // New tabs that are caused from the green plus or control + T 
    // are this way.  Best way to catch I could find.
    if ( event.explicitOriginalTarget.id == "" ){
      //dump("This is a tab I want!\n")
      
      customNewTab.browser = gBrowser.getBrowserForTab(event.target)
      var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch('extensions.custom-new-tab.')
      var url = prefs.getCharPref('newURL')
      //getAttributes(event.originalTarget)
    
      // This is not a good flag for how the tab was opened.
      // All new tabs start as 'about:blank' then they get some
      // content loaded in the and the URL changes. (not in that order)
      //dump("contentDoc URL: " + customNewTab.browser.contentDocument.URL + "\n")
    
      customNewTab.browser.addEventListener('load', customNewTab.highlight, true)
      customNewTab.browser.loadURI(url)
    }
  }, // End of swap function
  
  
  // Highlights the URL (we have to wait for the content to load first
  highlight : function(event){
  
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch('extensions.custom-new-tab.')
    
    var check = prefs.getBoolPref('focus')
    
    if (check) {
      // This works because I look at the explicitOriginalTarget
      // of the TabOpen event in the previous function
      var bar = window.document.getElementById('urlbar')
      bar.select()
      //dump("Focus to bar\n")
    }
    
    else {
      customNewTab.browser.focus()
      //dump("Focus to browser\n")
    }
    
    customNewTab.browser.removeEventListener('load', customNewTab.highlight, true)

  } // End of highlight function
}

window.addEventListener('load', customNewTab.onLoad, false)
