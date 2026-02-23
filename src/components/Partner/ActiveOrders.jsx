// src/components/Partner/ActiveOrders.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  AlertCircle, MapPin, Truck, CheckCircle, X, 
  Navigation, Clock, DollarSign ,RefreshCw,Loader
} from 'lucide-react';
import API_BASE_URL from "../../../src/config/api";
export default function ActiveOrders() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('partnerToken');

  const fetchPartnerOrders = useCallback(async () => {
    if (!token) {
      setError('Please login again');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(
        `${API_BASE_URL}/delivery-partner/orders/my-active`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setActiveOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load active orders:', err);
      setError(err?.response?.data?.error || 'Could not load active orders');
      setActiveOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPartnerOrders();
    const interval = setInterval(fetchPartnerOrders, 15000); // refresh every 15 seconds
    return () => clearInterval(interval);
  }, [fetchPartnerOrders]);

  // ──────────────────────────────────────────────────────────────
  // ZOMATO-STYLE PAYMENT & STATUS HANDLING (2025 realistic flow)
  // ──────────────────────────────────────────────────────────────
  const handleStatusUpdate = async (orderId, newStatus) => {
    const order = activeOrders.find(o => o._id === orderId);
    if (!order) return alert("Order not found in current list");

    // ─── COD / Cash on Delivery special flow ──────────────────────
    if (newStatus === 'delivered') {
      const isCashOrder = 
        order.paymentMethod?.toLowerCase() === 'cash' || 
        order.paymentMethod === 'cod' ||
        order.paymentMethod === 'cash_on_delivery';

      if (isCashOrder) {
        const amountDue = Number(order.total) || 0;

        // Modern prompt style (you can replace with modal later)
        const entered = window.prompt(
          `Cash on Delivery\n\n` +
          `Collect ₹${amountDue.toFixed(2)} from customer.\n\n` +
          `Enter amount actually collected (numbers only):`,
          amountDue.toFixed(2)
        );

        if (entered === null) return; // user cancelled

        const collected = Number(entered.trim());
        if (isNaN(collected) || collected < 0) {
          return alert("Please enter a valid amount (e.g. 459 or 459.50)");
        }

        let message = `₹${collected.toFixed(2)} collected.`;
        let tipAmount = 0;
        let shortBy = 0;

        if (collected > amountDue) {
          tipAmount = collected - amountDue;
          message += `\nExtra ₹${tipAmount.toFixed(2)} → treated as tip (you keep 100%)`;
        } else if (collected < amountDue) {
          shortBy = amountDue - collected;
          const shortMsg = `Short by ₹${shortBy.toFixed(2)}.\n` +
                          `Continue anyway? (restaurant will be notified)`;
          if (!window.confirm(shortMsg)) return;
          message += `\nShort by ₹${shortBy.toFixed(2)}`;
        }

        if (!window.confirm(`${message}\n\nConfirm delivery?`)) return;

        try {
          await axios.patch(
            `${API_BASE_URL}/delivery-partner/orders/${orderId}/status`,
            { 
              status: 'delivered',
              cashReceived: true,
              paymentCollected: collected,
              tipAmount,
              shortPayment: shortBy > 0 ? shortBy : undefined,
              paymentConfirmedAt: new Date().toISOString()
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          alert(`Delivered!\n₹${collected} cash collected`);
          fetchPartnerOrders();
        } catch (err) {
          alert(err?.response?.data?.error || "Failed to confirm delivery & cash");
        }
        return;
      }

      // ─── Prepaid / Online / UPI / Wallet ──────────────────────────
      if (window.confirm("Payment was already received online.\nConfirm delivery?")) {
        try {
          await axios.patch(
            `${API_BASE_URL}/delivery-partner/orders/${orderId}/status`,
            { status: 'delivered' },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          alert("Order marked as delivered");
          fetchPartnerOrders();
        } catch (err) {
          alert(err?.response?.data?.error || "Failed to mark delivered");
        }
      }
      return;
    }

    // ─── Normal status updates (non-delivered) ─────────────────────
    const confirmMsg = {
      reached_restaurant: 'Have you reached the restaurant?',
      picked_up: 'Confirm you have picked up the order from the restaurant?',
      reached_customer: 'Have you reached the customer location?',
    }[newStatus] || `Confirm change to "${newStatus}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await axios.patch(
        `${API_BASE_URL}/delivery-partner/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Order updated to ${newStatus.replace('_', ' ')}`);
      fetchPartnerOrders();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to update status');
    }
  };

  // Keep your existing helper functions
  const handleCancelOrder = async (orderId) => {
    const reasons = [
      "Restaurant closed or unavailable",
      "Unable to contact restaurant",
      "Order already picked up by another partner",
      "Wrong/incomplete address",
      "Traffic / too far / cannot deliver on time",
      "Personal reason / emergency",
      "Other"
    ];

    const reason = prompt(
      "Please select cancellation reason:\n\n" + reasons.map((r, i) => `${i+1}. ${r}`).join("\n") + 
      "\n\nEnter number (1-" + reasons.length + ") or type your reason:"
    );

    if (!reason) return;

    let selectedReason = reason;
    const num = parseInt(reason);
    if (!isNaN(num) && num >= 1 && num <= reasons.length) {
      selectedReason = reasons[num - 1];
    }

    if (!window.confirm(`Cancel this order because: "${selectedReason}"?\nThis cannot be undone.`)) return;

    try {
      await axios.post(
        `${API_BASE_URL}/delivery-partner/orders/${orderId}/cancel`,
        { reason: selectedReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Order cancelled successfully");
      fetchPartnerOrders();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to cancel order");
    }
  };

  // Handle reporting delay
  const handleReportDelay = async (orderId) => {
    const reason = prompt("Why is the delivery delayed? (min 5 characters)");

    if (!reason || reason.trim().length < 5) {
      alert("Please provide a valid reason (at least 5 characters)");
      return;
    }

    if (!window.confirm("Report this delay?")) return;

    try {
      await axios.patch(
        `${API_BASE_URL}/delivery-partner/orders/${orderId}/report-delay`,
        { reason: reason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Delay reported successfully");
      fetchPartnerOrders();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to report delay");
    }
  };

  

  const getNextActions = (status) => {
    const actions = [];

    if (status === 'accepted') {
      actions.push({ 
        label: 'Picked Up', 
        value: 'picked_up', 
        color: 'bg-purple-600 hover:bg-purple-700' 
      });
    }

    if (status === 'picked_up') {
      actions.push({ 
        label: 'Delivered', 
        value: 'delivered', 
        color: 'bg-green-600 hover:bg-green-700 font-bold' 
      });
    }

    return actions;
  };

  const getStatusBadge = (status) => {
    if (!status || typeof status !== "string") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium border bg-gray-100 text-gray-800">
          Unknown
        </span>
      );
    }

    const styles = {
      accepted: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      reached_restaurant: 'bg-amber-100 text-amber-800 border-amber-300',
      picked_up: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      reached_customer: 'bg-purple-100 text-purple-800 border-purple-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled_by_partner: 'bg-red-100 text-red-800 border-red-300',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  // ──────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 text-center flex flex-col items-center gap-4">
        <Loader className="animate-spin" size={32} />
        <p className="text-gray-600">Loading your active orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
        <p className="text-red-600 font-medium">{error}</p>
        <button 
          onClick={fetchPartnerOrders} 
          className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Active Orders</h1>
        <button 
          onClick={fetchPartnerOrders}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {activeOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm border">
          <div className="text-6xl mb-4">🛵</div>
          <h2 className="text-xl font-semibold mb-2">No Active Orders</h2>
          <p className="text-gray-500">Accepted orders will appear here. Accept new ones when ready!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeOrders.map((order) => {
            const actions = getNextActions(order.deliveryPartnerStatus);
            const isAccepted = order.deliveryPartnerStatus === 'accepted';
            const isPickedUp = order.deliveryPartnerStatus === 'picked_up';
            const isCashOrder = order.paymentMethod?.toLowerCase() === 'cash' || 
                               order.paymentMethod === 'cod' ||
                               order.paymentMethod === 'cash_on_delivery';

            return (
              <div 
                key={order._id} 
                className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="bg-gray-50 px-5 py-4 flex justify-between items-center border-b">
                  <div>
                    <h3 className="font-bold text-lg">{order.restaurantName}</h3>
                    <p className="text-sm text-gray-600 mt-1">#{order.orderId}</p>
                  </div>
                  {getStatusBadge(order.deliveryPartnerStatus)}
                </div>

                {/* COD Banner */}
                {isCashOrder && (
                  <div className="bg-amber-50 p-3 text-amber-800 text-sm border-b flex items-center gap-3">
                    <AlertCircle size={20} />
                    <div>
                      <strong>Cash on Delivery</strong> — Collect ₹{Number(order.total || 0).toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Pickup</p>
                      <p className="font-medium">{order.restaurantName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Deliver to</p>
                      <p className="font-medium">{order.selectedAddress?.name || 'Customer'}</p>
                      <p className="text-sm text-gray-600 mt-1">{order.selectedAddress?.address}</p>
                    </div>
                  </div>

                  <div className="mb-6 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700 mb-1">Amount</p>
                    <p className="text-3xl font-bold text-green-700">₹{Number(order.total || 0).toFixed(2)}</p>
                  </div>

                  {/* Main Action Buttons */}
                  {actions.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      {actions.map((action) => (
                        <button
                          key={action.value}
                          onClick={() => handleStatusUpdate(order._id, action.value)}
                          className={`flex-1 py-4 rounded-xl text-white font-semibold text-lg transition ${action.color}`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Secondary Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {isAccepted && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium border border-red-200"
                      >
                        Cancel Order
                      </button>
                    )}

                    {(isAccepted || isPickedUp) && (
                      <button
                        onClick={() => handleReportDelay(order._id)}
                        className="flex-1 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg font-medium border border-orange-200"
                      >
                        Report Delay
                      </button>
                    )}
                  </div>

                  {/* Navigation Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        order.restaurantName + ', ' + (order.restaurantAddress?.address || '')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                    >
                      <MapPin size={18} />
                      To Restaurant
                    </a>

                    {isPickedUp && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          (order.selectedAddress?.name || 'Customer') + ', ' + order.selectedAddress?.address + ', ' + order.selectedAddress?.city
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                      >
                        <Truck size={18} />
                        To Customer
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}