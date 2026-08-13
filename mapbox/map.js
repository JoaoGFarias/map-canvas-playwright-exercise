// Fire-risk zone location — deliberately NOT the map's initial center/zoom.
// A test must force the view to this via jumpTo before asserting anything,
// same as a real app never boots already looking at the place under test.
const center = [-122.4194, 37.7749];

// Boots at a neutral world view, not the fire-risk zone above.
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [0, 0],
  zoom: 2,
});
window.map = map;

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
