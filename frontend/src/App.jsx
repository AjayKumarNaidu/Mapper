import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Use standard Leaflet marker icon (CDN)
const defaultIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Initialize socket
const socket = io("https://mapper-11ly.onrender.com");

function App() {
  const [userType, setUserType] = useState(null); // 'driver' or 'user'
  const [driverId, setDriverId] = useState("");
  const [inputId, setInputId] = useState("");
  const [driverLocation, setDriverLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default: India

  const handleRoleSelect = (type) => {
    setUserType(type);
  };

  const handleStart = () => {
    if (inputId.trim() === "") return;
    setDriverId(inputId.trim());
  };

  // Get map center on load
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error("Error fetching location:", err)
    );
  }, []);

  // Socket connection logic
  useEffect(() => {
    if (!driverId || !userType) return;

    if (userType === "driver") {
      socket.emit("joinRoom", driverId); // Driver joins their room

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setDriverLocation(coords);

          // Emit to the server
          socket.emit("driverLocation", {
            roomId: driverId,
            location: coords,
          });
        },
        (err) => console.error("Error watching position:", err),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }

    if (userType === "user") {
      socket.emit("joinRoom", driverId); // User joins same room as driver

      socket.on("sendToUsers", (location) => {
        setDriverLocation(location); // Update map marker
      });

      // Cleanup on unmount
      return () => {
        socket.off("sendToUsers");
      };
    }
  }, [driverId, userType]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      {!userType && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h2>Select Role</h2>
          <button onClick={() => handleRoleSelect("driver")} style={buttonStyle}>
            I'm a Driver
          </button>
          <button onClick={() => handleRoleSelect("user")} style={buttonStyle}>
            I'm a User
          </button>
        </div>
      )}

      {userType && !driverId && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h2>Enter Driver ID</h2>
          <input
            type="text"
            placeholder="Enter unique driver ID"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleStart} style={buttonStyle}>
            Start
          </button>
        </div>
      )}

      {userType && driverId && (
        <>
          <h3 style={{ textAlign: "center" }}>{userType} View - ID: {driverId}</h3>
          <MapContainer center={mapCenter} zoom={13} style={{ height: "90%", width: "100%" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {driverLocation && (
              <Marker position={driverLocation} icon={defaultIcon}>
                <Popup>Driver {driverId} is here</Popup>
              </Marker>
            )}
          </MapContainer>
        </>
      )}
    </div>
  );
}

const buttonStyle = {
  margin: "10px",
  padding: "12px 24px",
  fontSize: "16px",
  cursor: "pointer",
};

const inputStyle = {
  padding: "10px",
  fontSize: "16px",
  marginBottom: "10px",
};