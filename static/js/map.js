const urlParams = new URLSearchParams(window.location.search);
const initialLat = parseFloat(urlParams.get('lat'));
const initialLon = parseFloat(urlParams.get('lon'));
let destination = urlParams.get('destination'); 

const map = L.map('map').setView([initialLat, initialLon], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let userMarker = L.marker([initialLat, initialLon]).addTo(map)
    .bindPopup("You are here!")
    .openPopup();

let destinationMarker;
let destinationCircle;
let destinationsData = []; 

document.addEventListener('DOMContentLoaded', function () {
    fetch('/static/destinations.json')
        .then(response => response.json())
        .then(data => {
            destinationsData = data.destinations;

            let destination = urlParams.get('destination'); 
            if (destination === "null" || !destination) {
                destination = null;  
            }

            const destinationSelect = document.getElementById('destination-select');
            destinationsData.forEach(dest => {
                const option = document.createElement('option');
                option.value = dest.name.toLowerCase().trim();  
                option.textContent = dest.name;
                destinationSelect.appendChild(option);
            });

            if (destination) {
                destinationSelect.value = destination.toLowerCase().trim();
            }

            destinationSelect.addEventListener('change', (event) => {
                updateDestination(event.target.value);
            });

            if (destination) {
                updateDestination(destination.toLowerCase().trim());
            } else {
                alert("If There are no Destination Specified, Please Select Your Desire Destination.");
            }

            function updateDestination(destinationName) {
                if (!destinationName) {
                    return;  
                }

                const normalizedDestinationName = destinationName.toLowerCase().trim();

                const destinationData = destinationsData.find(dest => {
                    const normalizedNames = [dest.name.toLowerCase().trim(), ...dest.othername.map(n => n.toLowerCase().trim())];
                    return normalizedNames.includes(normalizedDestinationName);
                });

                if (destinationData) {
                    const destinationLat = destinationData.destinationlat;
                    const destinationLon = destinationData.destinationlon;
                    const accuracy = destinationData.accuracy || 30;

                    if (destinationMarker) {
                        destinationMarker.remove();
                    }
                    if (destinationCircle) {
                        destinationCircle.remove();
                    }

                    const imagePath = `/static/images/${destinationData.name.replace(/\s+/g, '_')}.jpg`;
                    const popupContent = `
                        <div>
                            <h4>Destination: ${destinationData.name}</h4>
                            <img src="${imagePath}" alt="${destinationData.name}" style="width:100px;height:auto;cursor:pointer;" onclick="openLightbox('${imagePath}')">
                        </div>
                    `;

                    destinationMarker = L.marker([destinationLat, destinationLon])
                        .addTo(map)
                        .bindPopup(popupContent)
                        .openPopup();

                    destinationCircle = L.circle([destinationLat, destinationLon], { radius: accuracy })
                        .addTo(map);

                    const bounds = L.latLngBounds(
                        [[initialLat, initialLon], [destinationLat, destinationLon]]
                    );
                    map.fitBounds(bounds, { padding: [50, 50] });
                } else {
                    alert("Destination not found.");
                }
            }


            window.openLightbox = function(imagePath) {
                const lightbox = document.getElementById('lightbox');
                const lightboxImage = document.getElementById('lightbox-image');
                lightboxImage.src = imagePath;  
                lightbox.style.display = 'flex'; 
            }

            document.getElementById('close-lightbox').addEventListener('click', function() {
                const lightbox = document.getElementById('lightbox');
                lightbox.style.display = 'none';  
            });
        })
        .catch(error => {
            console.error("Error fetching destinations:", error);
        });

    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;

            userMarker.setLatLng([latitude, longitude]);

            map.setView([latitude, longitude], map.getZoom());

            sessionStorage.setItem("currentLocation", JSON.stringify({ latitude, longitude }));
        },
        (error) => {
            console.error("Error getting location:", error);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 10000,  
            timeout: 5000,      
        }
    );
});
