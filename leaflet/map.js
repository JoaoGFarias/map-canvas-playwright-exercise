// Real-world CRS + OSM basemap, matching the mapbox/ example's SF center/zoom
// so both pages show the same recognizable place.
const center = [37.7749, -122.4194];

const map = L.map('map', { preferCanvas: true }).setView(center, 9);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

// Fire-risk polygon, same footprint as the mapbox/ example.
// preferCanvas makes Leaflet rasterize this to a single shared <canvas>,
// same as a real wildfire-perimeter layer with many features would for performance.
L.polygon(
  [
    [37.70, -122.55],
    [37.70, -122.30],
    [37.85, -122.30],
    [37.85, -122.55],
  ],
  { color: '#b30000', fillColor: '#ff0000', fillOpacity: 0.35, weight: 2 }
).addTo(map);

// DOM marker for contrast: markers stay real DOM nodes even under
// preferCanvas, because Leaflet renders them as positioned <img>/<div>
// icons, not through the vector renderer.
L.marker(center).addTo(map).bindPopup('Fire risk zone center');
