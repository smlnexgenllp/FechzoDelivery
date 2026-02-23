// src/components/Partner/PartnerOrderHistory.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import API_BASE_URL from "../../config/api";
export default function PartnerOrderHistory() {
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("partnerToken");

  const fetchHistoryOrders = useCallback(async () => {
    if (!token) {
      setError("Please login again");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(
        `${API_BASE_URL}/delivery-partner/orders/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const orders = Array.isArray(res.data) ? res.data : [];
      console.log("Received history orders:", orders);
      setHistoryOrders(orders);
    } catch (err) {
      console.error("Failed to load order history:", err);
      setError(
        err?.response?.data?.error ||
        "Could not load your order history. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistoryOrders();
    const interval = setInterval(fetchHistoryOrders, 60000);
    return () => clearInterval(interval);
  }, [fetchHistoryOrders]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (orderStatus, deliveryPartnerStatus, cancelledBy) => {
    const isDelivered = orderStatus === "delivered" || deliveryPartnerStatus === "delivered";
    const isCancelled = orderStatus === "cancelled" || 
                       deliveryPartnerStatus === "cancelled_by_partner" || 
                       deliveryPartnerStatus === "failed";

    let bg = "bg-gray-100 text-gray-800";
    let text = orderStatus || deliveryPartnerStatus || "Unknown";

    if (isDelivered) {
      bg = "bg-green-100 text-green-800 border-green-300";
      text = "Delivered";
    } else if (isCancelled) {
      bg = "bg-red-100 text-red-800 border-red-300";
      text = cancelledBy === "partner" ? "Cancelled by You" : "Cancelled / Failed";
    }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${bg}`}>
        {text}
      </span>
    );
  };

  // Star rating component
  const renderStars = (rating) => {
    if (!rating) return <span className="text-gray-400">Not rated</span>;
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 animate-pulse">Loading order history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchHistoryOrders}
          className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Order History</h1>

      {historyOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-200">
          <div className="text-6xl mb-4 opacity-70">📜</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Orders Yet
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Completed or cancelled orders will appear here once you finish deliveries.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {historyOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="bg-gray-50 px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b">
                <div>
                  <h3 className="font-bold text-lg">
                    {order.restaurantName || "Restaurant"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Order #{order.orderId || order._id.slice(-8)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(order.updatedAt || order.createdAt)}
                  </p>
                </div>
                {getStatusBadge(order.orderStatus, order.deliveryPartnerStatus, order.cancelledBy)}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <div>
                    <p className="text-sm text-gray-500">Delivered To</p>
                    <p className="font-medium">
                      {order.selectedAddress?.name || "Customer"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.selectedAddress?.address}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="text-xl font-bold text-green-700">
                      ₹{order.total?.toFixed(2) || "—"}
                    </p>
                  </div>
                </div>

                {/* Prominent cancellation info */}
                {(order.orderStatus === "cancelled" || 
                  order.deliveryPartnerStatus === "cancelled_by_partner") && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-semibold text-red-800 mb-2">Cancelled Order</p>
                    <p className="text-sm text-red-700">
                      <strong>Reason:</strong> {order.cancellationReason || "No reason provided"}
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      <strong>Cancelled by:</strong>{" "}
                      {order.cancelledBy === "partner" 
                        ? "You (Delivery Partner)" 
                        : order.cancelledBy || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Cancelled on {formatDate(order.cancelledAt || order.updatedAt)}
                    </p>
                  </div>
                )}

                {/* Rating & Review (Zomato style) */}
                {order.orderStatus === "delivered" && order.partnerRating && (
                  <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-800">Your Rating</h4>
                      {renderStars(order.partnerRating)}
                      <span className="text-sm text-gray-600 ml-2">
                        {order.partnerRating}/5
                      </span>
                    </div>

                    {order.partnerReview && (
                      <p className="text-sm text-gray-700 italic">
                        "{order.partnerReview}"
                      </p>
                    )}

                    {order.partnerRatedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Rated on {formatDate(order.partnerRatedAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* View Details */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => alert("Order details coming soon...")}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}