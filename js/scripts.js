// Load the Google Maps API
const script = document.createElement('script');
script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDJYHmPJhnM8ZQEYHOtBijrBqGHz7t8ic8&callback=initMap&libraries=places";
script.async = true; // Ensure async is set to true
document.head.appendChild(script);

const db = firebase.firestore();
let map;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -34.397, lng: 150.644 }, // Default center location
        zoom: 8,
    });

    // Load existing events from Firebase and add to the map
    loadEventsFromFirebase();
}

function loadEventsFromFirebase() {
    db.collection("events").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const eventData = doc.data();
            addEventToMap(eventData);
        });
    });
}

function addEventToMap(eventData) {
    const eventLocation = { lat: eventData.lat, lng: eventData.lng };

    const marker = new google.maps.Marker({
        position: eventLocation,
        map: map,
        title: eventData.name
    });
}

const geocodeAddress = (address, callback) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
        if (status === "OK") {
            const latLng = results[0].geometry.location;
            callback(latLng);
        } else {
            console.error("Geocode was not successful: " + status);
        }
    });
};

const createEvent = (eventData) => {
    db.collection("events").add(eventData)
    .then((docRef) => {
        console.log("Event added with ID: ", docRef.id);
        addEventToMap(eventData); // Add the newly created event to the map
    })
    .catch((error) => {
        console.error("Error adding event: ", error);
    });
};

const eventForm = document.getElementById("event-form");

eventForm.addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent form reload

    const eventName = document.getElementById("event-name").value;
    const eventLocation = document.getElementById("event-location").value;

    // Geocode the address to get lat/lng
    geocodeAddress(eventLocation, (latLng) => {
        const eventData = {
            name: eventName,
            date: document.getElementById("event-date").value,
            time: document.getElementById("event-time").value,
            lat: latLng.lat(),
            lng: latLng.lng(),
            description: document.getElementById("event-description").value,
        };

        // Send event data to Firebase
        createEvent(eventData);
    });
});

// Set up real-time listener for Firebase updates
db.collection("events").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            const eventData = change.doc.data();
            addEventToMap(eventData);
        }
    });
});

google.maps.event.addDomListener(window, 'load', initMap);
