# Leaflet Canvas Exercise

A minimal Leaflet page for eyeballing how `preferCanvas: true` renders a
polygon (simulated fire-risk zone) alongside a regular DOM marker.

## Install

```bash
npm install
```

## Run

```bash
npm start
```

Open [http://localhost:5173](http://localhost:5173) in a browser.

You should see a red square (the canvas-rendered "fire risk zone" polygon)
and a marker pin to its upper right — click the marker for a popup. There is
no basemap; the page uses `L.CRS.Simple` so it renders without any tile
network dependency.
