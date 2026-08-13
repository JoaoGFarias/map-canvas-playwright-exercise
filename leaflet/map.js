// CRS.Simple + no tile layer: coordinates are plain [y, x] pixels at zoom 0,
// so this renders without any basemap tile network dependency.
const map = L.map('map', {
  crs: L.CRS.Simple,
  preferCanvas: true,
  zoomControl: false,
});

map.setView([0, 0], 2);

// Fire-risk polygon. preferCanvas makes Leaflet rasterize this to a single
// shared <canvas>, same as a real wildfire-perimeter layer with many
// features would for performance.
L.polygon(
  [
    [40, -40],
    [40, 40],
    [-40, 40],
    [-40, -40],
  ],
  { color: '#b30000', fillColor: '#ff0000', fillOpacity: 1, weight: 0 }
).addTo(map);

// DOM marker for contrast: markers stay real DOM nodes even under
// preferCanvas, because Leaflet renders them as positioned <img>/<div>
// icons, not through the vector renderer.
L.marker([60, 80]).addTo(map).bindPopup('Evacuation point');
