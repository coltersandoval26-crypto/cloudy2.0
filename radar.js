export function createRadar(lat, lon){

const map =
L.map("radar").setView([lat,lon],7);

L.tileLayer(
"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
).addTo(map);

const radar =
L.tileLayer(
"https://tilecache.rainviewer.com/v2/radar/latest/256/{z}/{x}/{y}/2/1_1.png"
);

radar.addTo(map);

}
