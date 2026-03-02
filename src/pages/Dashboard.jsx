// src/pages/PartnerDashboard.jsx
import React, { useState, useEffect } from "react";
import { usePartnerAuth } from "../context/PartnerAuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PartnerOrders from "../components/Partner/PartnerOrders";
import ActiveOrders from "../components/Partner/ActiveOrders";
import PartnerOrderHistory from "../components/Partner/PartnerOrderHistory";
import EarningsPage from "../components/Partner/EarningsPage";
import API_BASE_URL from "../config/api";
import {
  IndianRupee,
  Package,
  Star,
  Clock,
  Settings,
  LogOut,
  User,
  FileText,
  HelpCircle,
} from "lucide-react";

export default function Dashboard() {
  const { partner, logout, isOnline, toggleAvailability } = usePartnerAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active");

  // Earnings & stats state
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [partnerRating, setPartnerRating] = useState("—");
  const [totalRatings, setTotalRatings] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Online time tracking
  const [onlineSince, setOnlineSince] = useState(null);
  const [sessionOnlineMs, setSessionOnlineMs] = useState(0);

  const formatTime = (ms) => {
    if (ms <= 0) return "0h 0m";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  useEffect(() => {
    let interval = null;

    if (isOnline) {
      const now = Date.now();
      if (!onlineSince) setOnlineSince(now);

      interval = setInterval(() => {
        const current = Date.now();
        const elapsed = current - (onlineSince || now);
        setSessionOnlineMs((prev) => prev + elapsed);
        setOnlineSince(current);
      }, 30000);
    } else {
      setOnlineSince(null);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
        if (isOnline && onlineSince) {
          const finalElapsed = Date.now() - onlineSince;
          setSessionOnlineMs((prev) => prev + finalElapsed);
        }
      }
    };
  }, [isOnline]);

  // Fetch earnings + partner rating
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("partnerToken");
        if (!token) return;

        const [todayRes, totalRes, profileRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/delivery-partner/orders/earnings/today`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/delivery-partner/orders/earnings/total`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/delivery-partner/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setTodayEarnings(todayRes.data.todayEarnings || 0);
        setTodayDeliveries(todayRes.data.completedDeliveries || 0);
        setTotalEarnings(totalRes.data.totalEarnings || 0);

        const profile = profileRes.data;
        setPartnerRating(profile.rating || "—");
        setTotalRatings(profile.totalRatings || 0);
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/partner/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header - Navy Blue Theme */}
      <header className="bg-white shadow-sm px-4 py-4 sm:px-6 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo - Navy Blue */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow">
              F
            </div>
            <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">
              Fechzo Partner
            </h1>
          </div>

          {/* Online/Offline Toggle */}
          <div className="flex flex-col items-center gap-1">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={toggleAvailability}
                className="sr-only peer"
              />
              <div
                className={`w-20 h-10 rounded-full transition-all duration-300 ease-in-out peer-focus:ring-4 peer-focus:ring-blue-300 ${
                  isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-8 h-8 bg-white rounded-full shadow-lg transition-transform duration-300 ease-in-out ${
                    isOnline ? "translate-x-10" : "translate-x-0"
                  }`}
                ></div>
              </div>
            </label>
            <span
              className={`text-lg font-bold ${
                isOnline ? "text-green-600" : "text-gray-600"
              }`}
            >
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          {/* Today's Earnings */}
          <div className="text-center sm:text-right">
            <p className="text-sm text-gray-600">Today's Earnings</p>
            {loadingStats ? (
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mx-auto sm:mx-0 mt-1"></div>
            ) : (
              <p className="text-2xl font-bold text-blue-900">
                ₹{todayEarnings.toLocaleString()}
              </p>
            )}
          </div>

          {/* Logout Button - Navy Blue */}
          <button
            onClick={handleLogout}
            className="bg-blue-900 hover:bg-blue-950 text-white px-6 py-2.5 rounded-lg font-medium transition hidden sm:block"
          >
            <LogOut size={18} className="inline mr-2" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 pb-24 max-w-6xl mx-auto w-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {/* Earnings */}
          <div className="bg-white p-5 rounded-2xl shadow border border-gray-100 text-center hover:shadow-md transition">
            <div className="inline-flex p-3 rounded-full bg-green-100 mb-3">
              <IndianRupee size={24} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Today's Earnings</p>
            {loadingStats ? (
              <div className="h-10 bg-gray-200 rounded animate-pulse mt-2"></div>
            ) : (
              <p className="text-3xl font-bold text-blue-900 mt-1">
                ₹{todayEarnings.toLocaleString()}
              </p>
            )}
          </div>

          {/* Deliveries */}
          <div className="bg-white p-5 rounded-2xl shadow border border-gray-100 text-center hover:shadow-md transition">
            <div className="inline-flex p-3 rounded-full bg-blue-100 mb-3">
              <Package size={24} className="text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Deliveries Today</p>
            {loadingStats ? (
              <div className="h-10 bg-gray-200 rounded animate-pulse mt-2"></div>
            ) : (
              <p className="text-3xl font-bold text-blue-900 mt-1">
                {todayDeliveries}
              </p>
            )}
          </div>

          {/* Rating */}
          <div className="bg-white p-5 rounded-2xl shadow border border-gray-100 text-center hover:shadow-md transition">
            <div className="inline-flex p-3 rounded-full bg-purple-100 mb-3">
              <Star size={24} className="text-purple-600" fill="currentColor" />
            </div>
            <p className="text-sm text-gray-600">Your Rating</p>
            {loadingStats ? (
              <div className="h-10 bg-gray-200 rounded animate-pulse mt-2"></div>
            ) : (
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-3xl font-bold text-blue-900">
                  {partnerRating === "0.0" ? "New" : partnerRating}
                </span>
                {partnerRating !== "—" && partnerRating !== "New" && (
                  <Star size={20} className="text-yellow-500 fill-yellow-500" />
                )}
                <span className="text-sm text-gray-500 ml-1">
                  ({totalRatings} {totalRatings === 1 ? "rating" : "ratings"})
                </span>
              </div>
            )}
          </div>

          {/* Online Time */}
          <div className="bg-white p-5 rounded-2xl shadow border border-gray-100 text-center hover:shadow-md transition">
            <div className="inline-flex p-3 rounded-full bg-orange-100 mb-3">
              <Clock size={24} className="text-orange-600" />
            </div>
            <p className="text-sm text-gray-600">Online Today</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">
              {formatTime(sessionOnlineMs)}
            </p>
          </div>
        </div>

        {/* Tabs Navigation - Navy Blue Active */}
        <div className="bg-white rounded-2xl shadow border overflow-hidden mb-8">
          <div className="flex border-b overflow-x-auto scrollbar-hide">
            {[
              { id: "active", label: "Active", icon: "🚚" },
              { id: "new", label: "New", icon: "🔔" },
              { id: "history", label: "History", icon: "📜" },
              { id: "earnings", label: "Earnings", icon: "₹" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-6 text-center font-medium text-base flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "border-b-4 border-blue-900 text-blue-900 font-bold"
                    : "text-gray-700 hover:text-blue-900 hover:bg-gray-50"
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-8">
            {activeTab === "active" && <ActiveOrders />}
            {activeTab === "new" && <PartnerOrders />}
            {activeTab === "history" && <PartnerOrderHistory />}
            {activeTab === "earnings" && <EarningsPage />}
          </div>
        </div>

        {/* Quick Actions - Navy Blue Hover */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/partner/profile")}
            className="bg-white border border-gray-200 hover:border-blue-900 p-6 rounded-2xl text-center transition-all shadow-sm hover:shadow-md"
          >
            <User size={40} className="mx-auto mb-3 text-blue-900" />
            <p className="font-medium text-gray-800">Profile</p>
          </button>

          <button
            onClick={() => navigate("/partner/documents")}
            className="bg-white border border-gray-200 hover:border-blue-900 p-6 rounded-2xl text-center transition-all shadow-sm hover:shadow-md"
          >
            <FileText size={40} className="mx-auto mb-3 text-blue-900" />
            <p className="font-medium text-gray-800">Documents</p>
          </button>

          <button
            onClick={() => navigate("/partner/settings")}
            className="bg-white border border-gray-200 hover:border-blue-900 p-6 rounded-2xl text-center transition-all shadow-sm hover:shadow-md"
          >
            <Settings size={40} className="mx-auto mb-3 text-blue-900" />
            <p className="font-medium text-gray-800">Settings</p>
          </button>

          <button
            onClick={() => navigate("/partner/support")}
            className="bg-white border border-gray-200 hover:border-blue-900 p-6 rounded-2xl text-center transition-all shadow-sm hover:shadow-md"
          >
            <HelpCircle size={40} className="mx-auto mb-3 text-blue-900" />
            <p className="font-medium text-gray-800">Support</p>
          </button>
        </div>
      </main>

      {/* Mobile Bottom Navigation - Navy Blue Active */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
        <div className="flex justify-around items-center py-3">
          {[
            { id: "active", icon: "🚚", label: "Active" },
            { id: "new", icon: "🔔", label: "New" },
            { id: "history", icon: "📜", label: "History" },
            { id: "earnings", icon: "₹", label: "Earnings" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center flex-1 p-2 transition-colors ${
                activeTab === item.id ? "text-blue-900" : "text-gray-600"
              }`}
            >
              <span className="text-3xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
