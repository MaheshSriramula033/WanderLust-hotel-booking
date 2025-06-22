function initMap(lat, lng, title) {
  const map = L.map('map', {
    center: [lat, lng],
    zoom: 12,
    scrollWheelZoom: false,
    attributionControl: false
  });

  // OpenStreetMap base tiles (still external unless you self-host tiles)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  // Red marker icon with locally hosted images
  const redIcon = new L.Icon({
    iconUrl: '/leaflet/images/marker-icon-red.png',     // local path
    shadowUrl: '/leaflet/images/marker-shadow.png',     // local path
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Place marker
  L.marker([lat, lng], { icon: redIcon })
    .addTo(map)
    .bindPopup(`<strong>${title}</strong><br>This is the location.`)
    .openPopup();

  // Disable scroll zoom on mouse out
  map.on('mouseout', function () {
    map.scrollWheelZoom.disable();
  });
}

// Initialize map on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const mapDiv = document.getElementById("map");
  if (mapDiv) {
    const lat = parseFloat(mapDiv.dataset.lat);
    const lng = parseFloat(mapDiv.dataset.lng);
    const title = mapDiv.dataset.title;
    initMap(lat, lng, title);
  }
});


