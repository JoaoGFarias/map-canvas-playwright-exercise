import maplibregl from '/node_modules/maplibre-gl/dist/maplibre-gl.js';

const center = [-122.4194, 37.7749];

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center,
  zoom: 9,
});

new maplibregl.Marker({ color: '#d64545' }).setLngLat(center).addTo(map);

const fireRiskZone = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-122.55, 37.70],
      [-122.30, 37.70],
      [-122.30, 37.85],
      [-122.55, 37.85],
      [-122.55, 37.70],
    ]],
  },
};

map.on('load', () => {
  map.addSource('fire-risk-zone', { type: 'geojson', data: fireRiskZone });

  map.addLayer({
    id: 'fire-risk-zone-fill',
    type: 'fill',
    source: 'fire-risk-zone',
    paint: { 'fill-color': '#ff6b35', 'fill-opacity': 0.35 },
  });

  map.addLayer({
    id: 'fire-risk-zone-outline',
    type: 'line',
    source: 'fire-risk-zone',
    paint: { 'line-color': '#d64545', 'line-width': 2 },
  });
});
