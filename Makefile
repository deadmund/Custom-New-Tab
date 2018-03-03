# CNT Makefile
all:
	rm -f CNT.xpi
	zip -r CNT.xpi cmunss.otf manifest.json cnt-main-bg-script.js prefs.html prefs.css prefs.js README cnt_icon_32.png cnt_icon_48.png cnt_icon_64.png
