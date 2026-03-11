import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import API_BASE_URL from "../../config/api";

export default function PartnerOrders() {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  const token = localStorage.getItem("partnerToken");

  /* ------------------------------------
     0️⃣ CHECK PARTNER ONLINE STATUS
  -------------------------------------*/
  useEffect(() => {
    const status = localStorage.getItem("partnerOnlineStatus");
    setIsOnline(status === "online");
  }, []);

  /* ------------------------------------
     1️⃣ GET LIVE PARTNER LOCATION
  -------------------------------------*/
  useEffect(() => {

    if (!navigator.geolocation) {
      setError("Geolocation not supported by browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setPartnerLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        console.error(err);
        setError("Location permission denied");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);

  }, []);

  /* ------------------------------------
     2️⃣ FETCH NEARBY ORDERS
  -------------------------------------*/
  const fetchNearbyOrders = useCallback(async () => {

    // ❌ STOP IF OFFLINE
    if (!isOnline) {
      setOrders([]);
      return;
    }

    if (!partnerLocation) return;

    setLoading(true);
    setError("");

    try {

      const res = await axios.get(
        `${API_BASE_URL}/food/order/available-orders`,
        {
          params: {
            lat: partnerLocation.lat,
            lng: partnerLocation.lng,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders(Array.isArray(res.data) ? res.data : []);

    } catch (err) {

      console.error("Fetch orders error:", err);
      setError("Failed to fetch nearby orders");
      setOrders([]);

    } finally {
      setLoading(false);
    }

  }, [partnerLocation, token, isOnline]);

  /* ------------------------------------
     3️⃣ FETCH WHEN LOCATION CHANGES
  -------------------------------------*/
  useEffect(() => {

    if (partnerLocation && isOnline) {
      fetchNearbyOrders();
    }

  }, [partnerLocation, isOnline, fetchNearbyOrders]);

  /* ------------------------------------
     4️⃣ AUTO REFRESH EVERY 15 SECONDS
  -------------------------------------*/
  useEffect(() => {

    if (!partnerLocation || !isOnline) return;

    const interval = setInterval(fetchNearbyOrders, 15000);

    return () => clearInterval(interval);

  }, [partnerLocation, isOnline, fetchNearbyOrders]);

  /* ------------------------------------
     5️⃣ ACCEPT ORDER
  -------------------------------------*/
  const handleAccept = async (orderId) => {

    try {

      const res = await axios.post(
        `${API_BASE_URL}/delivery-partner/orders/${orderId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        alert("Order accepted successfully!");
        fetchNearbyOrders();
      } else {
        alert("Accept failed: " + (res.data.error || "Unknown error"));
      }

    } catch (err) {

      console.error("Accept request failed:", err.response?.data || err);

      alert(
        err.response?.data?.error ||
        "Failed to accept order (check console)"
      );

    }

  };

  /* ------------------------------------
     6️⃣ REJECT ORDER
  -------------------------------------*/
  const handleReject = async (orderId) => {

    if (!window.confirm("Are you sure you want to reject this order?")) return;

    try {

      const response = await axios.post(
        `${API_BASE_URL}/delivery-partner/orders/${orderId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Reject success:", response.data);

      alert("Order rejected");

      fetchNearbyOrders();

    } catch (err) {

      console.error("Reject error:", err?.response?.data || err.message);

      alert(
        err?.response?.data?.error ||
        "Failed to reject order – check console"
      );

    }

  };

  /* ------------------------------------
     UI
  -------------------------------------*/

  // 🔴 OFFLINE MESSAGE
  if (!isOnline) {
    return (
      <div className="p-6 text-center">

        <h2 className="text-xl font-bold mb-2 text-orange-600">
          You are Offline
        </h2>

        <p className="text-gray-600">
          Please switch <b>ONLINE</b> to receive delivery orders.
        </p>

      </div>
    );
  }

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">
        Nearby Available Orders
      </h1>

      {partnerLocation && (
        <p className="text-sm text-gray-500 mb-3">
          📍 Your Location: {partnerLocation.lat.toFixed(4)},{" "}
          {partnerLocation.lng.toFixed(4)}
        </p>
      )}

      {loading && <p>Loading orders...</p>}

      {error && (
        <p className="text-red-600">{error}</p>
      )}

      {!loading && orders.length === 0 && (
        <p>No orders available within 6 km</p>
      )}

      <div className="space-y-4">

        {orders.map((order) => (

          <div
            key={order._id}
            className="border rounded-lg p-4 shadow flex flex-col gap-2"
          >

            <div>

              <h2 className="font-semibold text-lg">
                {order.restaurantName}
              </h2>

              <p>Order ID: {order.orderId}</p>

              <p>Total: ₹{order.total}</p>

              <p>
                Address: {order.selectedAddress?.address},{" "}
                {order.selectedAddress?.city}
              </p>

              {order.distanceKm && (
                <p className="text-sm text-gray-600">
                  Distance: {order.distanceKm.toFixed(2)} km
                </p>
              )}

            </div>

            <div className="flex gap-2 mt-2">

              <button
                onClick={() => handleAccept(order._id)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Accept
              </button>

              <button
                onClick={() => handleReject(order._id)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Reject
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}