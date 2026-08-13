.PHONY: up down reload test

up:
	cd mapbox && npm install && (npm start > /tmp/technosylva-mapbox.log 2>&1 & echo $$! > /tmp/technosylva-mapbox.pid)
	cd leaflet && npm install && (npm start > /tmp/technosylva-leaflet.log 2>&1 & echo $$! > /tmp/technosylva-leaflet.pid)
	@sleep 1
	@echo "mapbox:  http://localhost:8080"
	@echo "leaflet: http://localhost:5173"

down:
	-kill $$(cat /tmp/technosylva-mapbox.pid 2>/dev/null) 2>/dev/null
	-kill $$(cat /tmp/technosylva-leaflet.pid 2>/dev/null) 2>/dev/null
	-pkill -f "node server.js" 2>/dev/null
	@rm -f /tmp/technosylva-mapbox.pid /tmp/technosylva-leaflet.pid
	@echo "stopped"

reload: down up

test:
	cd mapbox && npm test
	cd leaflet && npm test
