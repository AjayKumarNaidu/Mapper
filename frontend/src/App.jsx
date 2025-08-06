import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ Replace with actual backend URL
const socket = io("https://mapper-11ly.onrender.com");

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const driverIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/484/484167.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 13);
    }
  }, [lat, lng]);
  return null;
}

function App() {
  const [role, setRole] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [userLocations, setUserLocations] = useState([]);

  const roomId = "driver-room";

  // Handle incoming socket events
  useEffect(() => {
    socket.on("sendToUsers", (location) => setDriverLocation(location));
    socket.on("userLocations", (users) => {
      const onlyLocations = users.map((u) => u.location);
      setUserLocations(onlyLocations);
    });

    return () => {
      socket.off("sendToUsers");
      socket.off("userLocations");
    };
  }, []);

  // Get current location on load
  useEffect(() => {
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition((position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setUserLocation(location);

        if (role === "user") {
          socket.emit("joinRoom", roomId);
          socket.emit("userLocation", { roomId, location });
        } else if (role === "driver") {
          socket.emit("joinRoom", roomId);
          socket.emit("driverLocation", { roomId, location });
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [role]);

  return (
    <div>
      {!role && (
        <div style={{ textAlign: "center", margin: 20 }}>
          <button onClick={() => setRole("driver")}>Login as Driver</button>
          <button onClick={() => setRole("user")}>Login as User</button>
        </div>
      )}

      {(role === "driver" || role === "user") && (
        <MapContainer
          center={userLocation || [17.385044, 78.486671]} // Hyderabad fallback
          zoom={13}
          style={{ height: "90vh", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* User's Marker */}
          {userLocation && role === "user" && (
            <Marker position={userLocation} icon={userIcon}>
              <Popup>You (User)</Popup>
              <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />
            </Marker>
          )}

          {/* Driver's Marker */}
          {driverLocation && (
            <Marker position={driverLocation} icon={driverIcon}>
              <Popup>Driver</Popup>
              {role === "driver" && (
                <RecenterMap
                  lat={driverLocation.lat}
                  lng={driverLocation.lng}
                />
              )}
            </Marker>
          )}

          {/* All user markers visible to driver */}
          {role === "driver" &&
            userLocations.map((loc, idx) => (
              <Marker key={idx} position={loc} icon={userIcon}>
                <Popup>User {idx + 1}</Popup>
              </Marker>
            ))}
        </MapContainer>
      )}
    </div>
  );
}

export default App;
