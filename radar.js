let map;
let radarLayer;

export function createRadar(lat, lon) {
  if (!map) {
    map = L.map("radar").setView([lat, lon], 7);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
  } else {
    map.setView([lat, lon], 7);
  }

  if (radarLayer) {
    map.removeLayer(radarLayer);
  }

  radarLayer = L.tileLayer(
    "https://tilecache.rainviewer.com/v2/radar/latest/256/{z}/{x}/{y}/2/1_1.png"
  );

  radarLayer.addTo(map);
}
