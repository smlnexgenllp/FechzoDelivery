// src/components/Partner/OrderHistoryDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, MapPin, Truck, CheckCircle, XCircle, 
  Clock, DollarSign, Star, User, Phone, Home, CreditCard, 
  AlertCircle, Calendar, Package 
} from 'lucide-react';
import API_BASE_URL from '../../config/api';
  import { useLocation } from 'react-router-dom';

export default function OrderHistoryDetail() {
  const { orderId } = useParams(); // :orderId from URL
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('partnerToken');


// Inside OrderHistoryDetail component (replace your current useEffect)
const location = useLocation();
const passedOrder = location.state?.order;

useEffect(() => {
  if (passedOrder && passedOrder._id === orderId) {
    // Use the data we already have from history list
    setOrder(passedOrder);
    setLoading(false);
  } else {
    // Fallback: fetch if no state or wrong order (rare case)
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_BASE_URL}/delivery-partner/orders/${orderId}`, // ← change to existing endpoint if you have one
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrder(res.data);
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }
}, [orderId, token, passedOrder]);
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const renderStars = (rating) => {
    if (!rating) return <span className="text-gray-400 text-sm">Not yet rated</span>;
    return (
      <div className="flex items-center gap-1">
        {Array(5).fill(0).map((_, i) => (
          <Star
            key={i}
            size={18}
            className={i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}
          />
        ))}
        <span className="ml-2 font-medium">{rating}/5</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center text-gray-700 hover:text-gray-900 font-medium"
          >
            <ArrowLeft size={18} className="mr-2" /> Back to History
          </button>
          
          <div className="bg-white rounded-2xl p-10 text-center shadow border border-gray-200">
            <AlertCircle size={64} className="text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Something went wrong</h2>
            <p className="text-gray-600 mb-8">{error || "Order details could not be loaded"}</p>
            <button 
              onClick={() => navigate(-1)}
              className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isDelivered = order.orderStatus === 'delivered' || order.deliveryPartnerStatus === 'delivered';
  const isCancelled = order.orderStatus === 'cancelled' || order.deliveryPartnerStatus === 'cancelled_by_partner';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            <ArrowLeft size={20} />
            Back to History
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">
              Order #{order.orderId || order._id?.slice(-8)}
            </h1>
            <p className="text-sm text-gray-500">
              {formatDate(order.updatedAt || order.createdAt)}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Status Banner */}
        <div className={`rounded-2xl p-6 mb-8 text-center border shadow-sm ${
          isDelivered ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' :
          isCancelled ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200' :
          'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
        }`}>
          <div className="flex flex-col items-center gap-3">
            {isDelivered && <CheckCircle size={48} className="text-green-600" />}
            {isCancelled && <XCircle size={48} className="text-red-600" />}
            {!isDelivered && !isCancelled && <Truck size={48} className="text-blue-600" />}

            <h2 className={`text-2xl font-bold ${
              isDelivered ? 'text-green-800' :
              isCancelled ? 'text-red-800' : 'text-blue-900'
            }`}>
              {isDelivered ? 'Delivered Successfully' :
               isCancelled ? 'Order Cancelled' :
               formatPartnerStatus(order.deliveryPartnerStatus)}
            </h2>

            {isCancelled && (
              <div className="mt-2 text-red-700 max-w-xl mx-auto">
                <strong>Reason:</strong> {order.cancellationReason || 'No reason provided'}<br />
                <strong>Cancelled by:</strong> {order.cancelledBy === 'partner' ? 'You (Partner)' : 'Restaurant / System'}
              </div>
            )}

            {isDelivered && order.partnerRating && (
              <div className="mt-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {renderStars(order.partnerRating)}
                </div>
                {order.partnerReview && (
                  <p className="text-gray-700 italic max-w-2xl mx-auto">
                    "{order.partnerReview}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Two-column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow border p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Clock size={24} className="text-gray-700" />
                Timeline
              </h3>

              <div className="relative space-y-10 pl-10 before:absolute before:left-5 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-200">
                {[
                  { time: order.delivery?.assignedAt, label: 'Assigned to Partner', icon: User, color: 'blue' },
                  { time: order.delivery?.reachedRestaurantAt, label: 'Reached Restaurant', icon: MapPin, color: 'amber' },
                  { time: order.delivery?.pickedUpAt, label: 'Picked Up Order', icon: Package, color: 'indigo' },
                  { time: order.delivery?.reachedCustomerAt, label: 'Reached Customer', icon: Home, color: 'purple' },
                  { time: order.delivery?.deliveredAt, label: 'Delivered', icon: CheckCircle, color: 'green' },
                  { time: order.cancelledAt, label: 'Cancelled', icon: XCircle, color: 'red', condition: isCancelled }
                ].filter(item => item.time && (!item.condition || item.condition)).map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-10 w-10 h-10 rounded-full bg-${item.color}-100 flex items-center justify-center border-2 border-white shadow`}>
                      <item.icon size={20} className={`text-${item.color}-600`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">{formatDate(item.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Restaurant */}
            <div className="bg-white rounded-2xl shadow border p-6">
              <h3 className="text-xl font-bold mb-5">Restaurant</h3>
              <div className="flex items-start gap-4">
                {order.restaurantImage && (
                  <img
                    src={order.restaurantImage}
                    alt={order.restaurantName}
                    className="w-20 h-20 rounded-xl object-cover border"
                  />
                )}
                <div>
                  <h4 className="font-bold text-lg">{order.restaurantName || 'Restaurant'}</h4>
                  <p className="text-gray-600 mt-1">
                    {order.restaurantAddress?.address || 'Address not available'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Summary Cards */}
          <div className="space-y-6">
            {/* Payment */}
            <div className="bg-white rounded-2xl shadow border p-6">
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                <DollarSign size={20} />
                Payment
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-bold">₹{order.total?.toFixed(2) || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium">
                    {order.paymentMethod === 'cash' || order.paymentMethod === 'cod' 
                      ? 'Cash on Delivery' 
                      : order.paymentMethod || 'Online Payment'}
                  </span>
                </div>
                {order.cashReceived && (
                  <div className="flex justify-between text-green-700 font-medium">
                    <span>Cash Collected</span>
                    <span>₹{order.paymentCollected?.toFixed(2) || order.total?.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer */}
            <div className="bg-white rounded-2xl shadow border p-6">
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                <User size={20} />
                Customer
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-gray-500" />
                  <div>
                    <p className="font-medium">{order.selectedAddress?.name || 'Customer'}</p>
                    <p className="text-gray-600">{order.selectedAddress?.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Home size={16} className="text-gray-500 mt-1" />
                  <p className="text-gray-600 leading-relaxed">
                    {order.selectedAddress?.address || 'No address available'}
                    {order.selectedAddress?.landmark && ` (${order.selectedAddress.landmark})`}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow border p-6">
              <button
                onClick={() => navigate(-1)}
                className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium flex items-center justify-center gap-2 transition"
              >
                <ArrowLeft size={18} />
                Back to History
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper function
function formatPartnerStatus(status) {
  const map = {
    accepted: 'Accepted – Heading to restaurant',
    reached_restaurant: 'Reached Restaurant',
    picked_up: 'Picked Up – On the way',
    reached_customer: 'Reached Customer Location',
    delivered: 'Delivered Successfully',
    cancelled_by_partner: 'Cancelled by Partner',
    failed: 'Delivery Failed'
  };
  return map[status] || status?.replace(/_/g, ' ') || 'Unknown';
}
