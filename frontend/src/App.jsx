import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for marker icon not displaying correctly
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const socket = io("http://localhost:5000"); // Replace with your deployed backend URL when needed

function App() {
  const [userType, setUserType] = useState(null); // 'driver' or 'user'
  const [driverLocation, setDriverLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default center (India)

  // When user selects their role
  const handleRoleSelect = (type) => {
    setUserType(type);
  };

  useEffect(() => {
    // Get user's current location once on load (for centering map)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.error("Error fetching location:", err);
      }
    );
  }, []);

  useEffect(() => {
    if (userType === "driver") {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setDriverLocation(coords);
          socket.emit("driverLocation", coords);
        },
        (err) => {
          console.error("Error watching position:", err);
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }

    if (userType === "user") {
      socket.on("sendToUsers", (location) => {
        setDriverLocation(location);
      });
    }
  }, [userType]);

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

      {userType && (
        <>
          <h3 style={{ textAlign: "center" }}>{userType === "driver" ? "Driver" : "User"} View</h3>

          <MapContainer center={mapCenter} zoom={13} style={{ height: "90%", width: "100%" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {driverLocation && (
              <Marker position={driverLocation}>
                <Popup>Driver is here</Popup>
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

export default App;
