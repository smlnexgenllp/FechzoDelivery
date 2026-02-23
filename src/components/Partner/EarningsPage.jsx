// src/components/Partner/EarningsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import API_BASE_URL from '../../config/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

import {
  IndianRupee,
  Package,
  TrendingUp,
  Calendar,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function EarningsPage() {
  const [earnings, setEarnings] = useState({
    today: 0,
    todayDeliveries: 0,
    weekly: 0,
    monthly: 0,
    total: 0,
    pendingBalance: 0,
  });

  const [recentEarnings, setRecentEarnings] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]); // ← new state for requests
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all earnings + payout requests
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('partnerToken');
        if (!token) {
          setError('Please login again');
          return;
        }

        const [
          todayRes,
          totalRes,
          monthRes,
          recentRes,
          payoutRes,
          requestsRes,
        ] = await Promise.all([
          axios.get(`${API_BASE_URL}/delivery-partner/orders/earnings/today`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/delivery-partner/orders/earnings/total`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/delivery-partner/orders/earnings/month`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/delivery-partner/orders/earnings/recent?days=7`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/delivery-partner/payout/requests`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/delivery-partner/payout/requests`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const weeklySum =
          recentRes.data.recent?.reduce((sum, day) => sum + (day.amount || 0), 0) || 0;

        setEarnings({
          today: todayRes.data.todayEarnings || 0,
          todayDeliveries: todayRes.data.completedDeliveries || 0,
          weekly: weeklySum,
          monthly: monthRes.data.monthlyEarnings || 0,
          total: totalRes.data.totalEarnings || 0,
          pendingBalance: payoutRes.data.pendingBalance || 0,
        });

        setRecentEarnings(recentRes.data.recent || []);
        setPayoutRequests(requestsRes.data.requests || []);

      } catch (err) {
        console.error('Failed to fetch earnings/payouts:', err);
        setError('Could not load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle withdrawal request
  const handleWithdrawRequest = async () => {
    if (!window.confirm(`Request withdrawal of ₹${earnings.total}?`)) return;

    try {
      const res = await axios.post(
        `${API_BASE_URL}/delivery-partner/payout/requests`,
        { amount: earnings.total },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('partnerToken')}` },
        }
      );

      alert(res.data.message || 'Withdrawal request submitted successfully!');
      
      // Refresh data after successful request
      window.location.reload();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to submit withdrawal request. Please try again.';
      alert(errorMsg);
      console.error('Withdrawal request failed:', err);
    }
  };

  // Chart setup
  const chartLabels = recentEarnings
    .map((item) => new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short' }))
    .reverse();

  const chartDataValues = recentEarnings.map((item) => item.amount || 0).reverse();

  const chartData = {
    labels: chartLabels.length ? chartLabels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Earnings (₹)',
        data: chartDataValues.length ? chartDataValues : [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#1e40af',
        backgroundColor: 'rgba(30, 64, 175, 0.2)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#1e40af',
        pointBorderColor: '#fff',
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        borderColor: '#1e40af',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#334155' },
        ticks: { color: '#94a3b8' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading earnings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-900 text-white px-8 py-3 rounded-xl hover:bg-blue-950 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const canWithdraw = earnings.total >= 500;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Earnings Overview</h1>
          <p className="text-gray-600 mt-2">
            Track your daily, weekly, monthly, and lifetime earnings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 text-center hover:shadow-xl transition">
            <div className="inline-flex p-4 rounded-full bg-green-100 mb-4">
              <IndianRupee size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-1">Today</h3>
            <p className="text-4xl font-extrabold text-blue-900">
              ₹{earnings.today.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {earnings.todayDeliveries} deliveries
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 text-center hover:shadow-xl transition">
            <div className="inline-flex p-4 rounded-full bg-blue-100 mb-4">
              <Package size={32} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-1">This Week</h3>
            <p className="text-4xl font-extrabold text-blue-900">
              ₹{earnings.weekly.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">Last 7 days</p>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 text-center hover:shadow-xl transition">
            <div className="inline-flex p-4 rounded-full bg-purple-100 mb-4">
              <Calendar size={32} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-1">This Month</h3>
            <p className="text-4xl font-extrabold text-blue-900">
              ₹{earnings.monthly.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">Current month</p>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 text-center hover:shadow-xl transition">
            <div className="inline-flex p-4 rounded-full bg-amber-100 mb-4">
              <TrendingUp size={32} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-1">Lifetime</h3>
            <p className="text-4xl font-extrabold text-blue-900">
              ₹{earnings.total.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">Total earned</p>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 text-center hover:shadow-xl transition">
            <div className="inline-flex p-4 rounded-full bg-orange-100 mb-4">
              <Clock size={32} className="text-orange-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-1">Pending</h3>
            <p className="text-4xl font-extrabold text-blue-900">
              ₹{earnings.pendingBalance.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">Carried forward</p>
          </div>
        </div>

        {/* Earnings Trend Chart */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-blue-900">Earnings Trend (Last 7 Days)</h3>
            <span className="text-sm text-gray-600">
              Total: ₹{earnings.weekly.toLocaleString()}
            </span>
          </div>
          <div className="h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent Earnings */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-blue-900">Recent Earnings</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentEarnings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
                No recent earnings data available
              </div>
            ) : (
              recentEarnings.map((item, index) => {
                const dateObj = new Date(item.date);
                let formattedDate = dateObj.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                });

                if (index === 0) formattedDate = 'Today';
                if (
                  index === 1 &&
                  new Date().toDateString() ===
                    new Date(dateObj.getTime() + 86400000).toDateString()
                ) {
                  formattedDate = 'Yesterday';
                }

                return (
                  <div
                    key={index}
                    className="p-6 flex justify-between items-center hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{formattedDate}</p>
                      <p className="text-sm text-gray-600">
                        {item.deliveries || 0} deliveries
                      </p>
                    </div>
                    <p className="text-xl font-bold text-green-700">
                      +₹{Math.round(item.amount || 0).toLocaleString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Withdrawal Section */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-3">
            <Download size={24} className="text-blue-600" />
            Withdraw Earnings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-600 mb-2">Available for Withdrawal</p>
              <p className="text-4xl font-extrabold text-blue-900">
                ₹{earnings.total.toLocaleString()}
              </p>
              {earnings.pendingBalance > 0 && (
                <p className="text-sm text-amber-700 mt-2">
                  + ₹{earnings.pendingBalance.toLocaleString()} pending from previous weeks
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Minimum withdrawal: ₹500
              </p>
            </div>

            <div className="flex flex-col justify-center items-start md:items-end">
              {canWithdraw ? (
                <button
                  onClick={handleWithdrawRequest}
                  className="bg-blue-900 hover:bg-blue-950 text-white px-10 py-5 rounded-xl font-medium text-lg transition shadow-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  <Download size={24} />
                  Request Withdrawal ₹{earnings.total.toLocaleString()}
                </button>
              ) : (
                <div className="text-center md:text-right">
                  <p className="text-lg font-medium text-amber-700">
                    Need ₹{500 - earnings.total} more to withdraw
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Processing time: 1–3 business days after admin approval
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payout Requests History */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-4">
            Withdrawal Requests
          </h3>

          {payoutRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              No withdrawal requests yet
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {payoutRequests.map((req) => (
                <div
                  key={req._id}
                  className="flex justify-between items-center p-4 border rounded-lg bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      ₹{req.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(req.requestedAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                      req.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : req.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : req.status === 'rejected' || req.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-10">
          Earnings updated real-time • Last synced:{' '}
          {new Date().toLocaleTimeString('en-IN')}
        </div>
      </div>
    </div>
  );
}
