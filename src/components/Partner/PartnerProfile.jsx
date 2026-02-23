// src/pages/PartnerProfile.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Bike, CreditCard, FileText, MapPin, Phone, Mail, Star, 
  ShieldCheck, Edit, LogOut, HelpCircle, X, Save 
} from 'lucide-react';
import API_BASE_URL from '../../config/api';

const PartnerProfile = () => {
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    area: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("partnerToken");
      if (!token) throw new Error("No authentication token found. Please login again.");

      const res = await axios.get(`${API_BASE_URL}/delivery-partner/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to load profile");
      }

      // Handle different possible response shapes
      const profileData = data.profile || data.partner || data;

      console.log("Received profile data:", profileData); // Debug

      setPartner(profileData);

      // Pre-fill form safely
      setEditForm({
        fullName: profileData.fullName || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        city: profileData.city || '',
        area: profileData.area || '',
      });
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError(
        err.response?.data?.message || 
        err.message || 
        "Failed to load profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMessage({ type: '', text: '' });

    if (!editForm.fullName.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      setEditMessage({ type: 'error', text: 'Full Name, Email and Phone are required.' });
      setEditLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("partnerToken");
      const res = await axios.patch(
       `${API_BASE_URL}/delivery-partner/profile`,
        editForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setEditMessage({ type: 'success', text: 'Profile updated successfully!' });
        setPartner(prev => ({ ...prev, ...editForm }));
        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditMessage({ type: '', text: '' });
        }, 1800);
      } else {
        throw new Error(res.data.message || "Update failed");
      }
    } catch (err) {
      setEditMessage({
        type: 'error',
        text: err.response?.data?.message || "Failed to update profile. Please try again."
      });
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const upper = (status || '').toUpperCase();
    if (upper === 'APPROVED') return { bg: 'bg-green-100 text-green-800', text: 'Approved' };
    if (upper === 'PENDING')  return { bg: 'bg-yellow-100 text-yellow-800', text: 'Pending Verification' };
    if (upper === 'REJECTED') return { bg: 'bg-red-100 text-red-800', text: 'Rejected' };
    return { bg: 'bg-gray-100 text-gray-800', text: 'Unknown' };
  };

  const maskAccount = (acc) => {
    if (!acc || acc.length < 6) return 'Not set';
    return '••••••' + acc.slice(-4);
  };

  // Safe rating display
  const displayRating = () => {
    const rating = partner?.rating;
    if (!rating && rating !== 0) return "—";
    
    // Convert string/number safely
    const numRating = Number(rating);
    if (isNaN(numRating)) return "—";
    
    return numRating.toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-8xl mb-6">!</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Something went wrong</h2>
          <p className="text-gray-600 mb-8">{error || "We couldn't load your profile"}</p>
          <button
            onClick={fetchProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium shadow-md transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusBadge(partner.approvalStatus);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-blue-700 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-5 pt-14 pb-20 text-center relative">
          {/* Avatar */}
          <div className="w-28 h-28 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl font-bold border-4 border-white shadow-xl">
            {partner.fullName?.charAt(0)?.toUpperCase() || '?'}
          </div>

          <h1 className="mt-5 text-3xl font-bold">{partner.fullName || 'Partner'}</h1>
          <p className="mt-1 text-blue-100 text-lg">{partner.phone || '—'}</p>

          {/* Status */}
          <div className={`mt-4 inline-flex items-center px-5 py-2 rounded-full text-sm font-semibold ${statusStyle.bg}`}>
            <ShieldCheck size={18} className="mr-2" />
            {statusStyle.text} • {partner.isActive ? 'Online' : 'Offline'}
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{displayRating()}</div>
              <div className="text-blue-100 text-sm flex items-center justify-center gap-1">
                <Star size={16} fill="currentColor" /> Rating
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{partner.totalRatings || '0'}</div>
              <div className="text-blue-100 text-sm">Ratings</div>
            </div>
            <div>
              <div className="text-2xl font-bold">₹{partner.lifetimeEarnings?.toLocaleString() || '0'}</div>
              <div className="text-blue-100 text-sm">Earned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-5 -mt-12 relative z-10 space-y-6">
        {/* Personal Details */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b bg-blue-50">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <User size={20} className="text-blue-600" /> Personal Details
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            <InfoRow icon={<Mail size={18} />} label="Email" value={partner.email || '—'} />
            <InfoRow icon={<Phone size={18} />} label="Phone" value={partner.phone || '—'} />
            <InfoRow 
              icon={<MapPin size={18} />} 
              label="Location" 
              value={
                partner.city || partner.area 
                  ? `${partner.area ? partner.area + ', ' : ''}${partner.city || '—'}`
                  : 'Not set'
              } 
            />
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b bg-blue-50">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Bike size={20} className="text-blue-600" /> Vehicle Details
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            <InfoRow label="Vehicle Type" value={partner.vehicleType || '—'} />
            <InfoRow label="Vehicle Number" value={partner.vehicleNumber || 'Not set'} />
            <InfoRow label="License Number" value={partner.licenseNumber || 'Not set'} />
          </div>
        </div>

        {/* Documents & Bank */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Documents */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b bg-blue-50">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" /> Documents
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <DocStatus label="Aadhaar Card" status={!!partner.aadharNumber} />
              <DocStatus label="Driving License" status={!!partner.licenseNumber} />
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b bg-blue-50">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <CreditCard size={20} className="text-blue-600" /> Bank Account
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              <InfoRow label="Bank Name" value={partner.bankName || '—'} />
              <InfoRow label="Account Number" value={maskAccount(partner.accountNumber)} />
              <InfoRow label="IFSC Code" value={partner.ifsc || '—'} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b bg-blue-50">
            <h2 className="text-xl font-semibold text-gray-800">Actions</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <ActionButton 
              icon={<Edit size={20} />} 
              label="Edit Profile" 
              onClick={() => setIsEditModalOpen(true)} 
            />
            <ActionButton 
              icon={<FileText size={20} />} 
              label="Update Documents" 
              onClick={() => alert('Document upload feature coming soon')} 
            />
            <ActionButton 
              icon={<HelpCircle size={20} />} 
              label="Help & Support" 
              onClick={() => window.location.href = '/partner/support'} 
            />
            <ActionButton 
              icon={<LogOut size={20} />} 
              label="Logout" 
              className="text-red-600 hover:bg-red-50"
              onClick={() => {
                localStorage.removeItem('partnerToken');
                window.location.href = '/partner/login';
              }} 
            />
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-10 mb-6">
          Fechzo Partner Portal • {new Date().getFullYear()}
        </p>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b flex items-center justify-between bg-blue-50">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Edit size={20} className="text-blue-600" /> Edit Profile
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditMessage({ type: '', text: '' });
                }}
                className="text-gray-500 hover:text-gray-800 transition"
              >
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={editForm.fullName}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              {/* ... rest of form fields ... */}

              {editMessage.text && (
                <div className={`p-4 rounded-lg text-sm font-medium ${
                  editMessage.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {editMessage.text}
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditMessage({ type: '', text: '' });
                  }}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm"
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable components (unchanged)
const InfoRow = ({ icon, label, value }) => (
  <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
    <div className="flex items-center gap-3 text-gray-600">
      {icon}
      <span>{label}</span>
    </div>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

const DocStatus = ({ label, status }) => (
  <div className="flex justify-between items-center py-3">
    <span className="text-gray-700 font-medium">{label}</span>
    <span className={`font-semibold ${status ? 'text-green-600' : 'text-amber-600'}`}>
      {status ? 'Verified' : 'Pending Upload'}
    </span>
  </div>
);

const ActionButton = ({ icon, label, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`w-full px-6 py-5 text-left flex items-center gap-4 hover:bg-blue-50 transition font-medium text-gray-800 ${className}`}
  >
    <span className="text-blue-600">{icon}</span>
    {label}
  </button>
);

export default PartnerProfile;