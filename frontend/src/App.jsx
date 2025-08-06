import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Icons
const driverIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
});

const userIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [32, 32],
});

// Socket
const socket = io("https://mapper-11ly.onrender.com");

// Route between user and driver
const RouteDisplay = ({ userLocation, driverLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (!userLocation || !driverLocation) return;

    const control = L.Routing.control({
      waypoints: [
        L.latLng(userLocation.lat, userLocation.lng),
        L.latLng(driverLocation.lat, driverLocation.lng),
      ],
      lineOptions: { styles: [{ color: "blue", weight: 4 }] },
      createMarker: () => null,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
    }).addTo(map);

    return () => map.removeControl(control);
  }, [userLocation, driverLocation, map]);

  return null;
};

function App() {
  const [userType, setUserType] = useState(null); // 'driver' or 'user'
  const [driverId, setDriverId] = useState("");
  const [inputId, setInputId] = useState("");
  const [driverLocation, setDriverLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default: India

  const handleRoleSelect = (type) => setUserType(type);
  const handleStart = () => {
    if (inputId.trim() === "") return;
    setDriverId(inputId.trim());
  };

  // Get initial location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setMapCenter(coords);
        if (userType === "user") {
          setUserLocation({ lat: coords[0], lng: coords[1] });
        } else if (userType === "driver") {
          setDriverLocation({ lat: coords[0], lng: coords[1] });
        }
      },
      (err) => console.error("Error fetching location:", err)
    );
  }, [userType]);

  // Socket logic
  useEffect(() => {
    if (!driverId || !userType) return;

    socket.emit("joinRoom", driverId);

    if (userType === "driver") {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setDriverLocation(coords);
          setMapCenter([coords.lat, coords.lng]);

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
      socket.on("sendToUsers", (location) => {
        setDriverLocation(location);
      });

      return () => socket.off("sendToUsers");
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
          <MapContainer center={mapCenter} zoom={15} style={{ height: "90%", width: "100%" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Driver Marker */}
            {driverLocation && (
              <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
                <Popup>Driver {driverId}</Popup>
              </Marker>
            )}

            {/* User Marker */}
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                <Popup>You</Popup>
              </Marker>
            )}

            {/* Route for user */}
            {userType === "user" && userLocation && driverLocation && (
              <RouteDisplay userLocation={userLocation} driverLocation={driverLocation} />
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

export default App;
