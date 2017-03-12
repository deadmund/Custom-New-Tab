# CNT Makefile
all:
	rm -f CNT.xpi
	zip -r CNT.xpi cmunss.otf manifest.json cnt-main-bg-script.js prefs.html README style.css update_prefs.js cnt_icon_32.png cnt_icon_48.png cnt_icon_64.png index.html load-page.js stall.html
