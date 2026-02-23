// src/pages/PartnerDocuments.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Upload, CheckCircle, XCircle, Clock, AlertCircle, 
  ShieldCheck, Camera, Image as ImageIcon 
} from 'lucide-react';

const PartnerDocuments = () => {
  const [documents, setDocuments] = useState({
    aadhaar: { status: 'pending', url: null, rejectionReason: null },
    drivingLicense: { status: 'pending', url: null, rejectionReason: null },
    // You can add more: panCard, vehicleRC, vehicleInsurance, etc.
  });
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  useEffect(() => {
    fetchDocumentStatus();
  }, []);

  const fetchDocumentStatus = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('partnerToken');
    if (!token) throw new Error('Please login again');

    // FIXED: Use correct endpoint for GET (status)
    const res = await axios.get(`${API_BASE_URL}/delivery-partner/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.success) {
      setDocuments(res.data.documents || documents);
    } else {
      console.warn('Backend returned non-success:', res.data);
    }
  } catch (err) {
    console.error('Failed to fetch documents status:', err);
    // Optional: show user-friendly message
    // setUploadError('Could not load document status. Please refresh.');
  } finally {
    setLoading(false);
  }
};

  const handleFileChange = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed (JPG, PNG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError('File size should be less than 5MB');
      return;
    }

    setUploadingDoc(docType);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('documentType', docType);
    formData.append('document', file);

    try {
      const token = localStorage.getItem('partnerToken');
      const res = await axios.post(
        `${API_BASE_URL}/delivery-partner/documents/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (res.data.success) {
        setUploadSuccess(`Your ${docType.replace(/([A-Z])/g, ' $1').toLowerCase()} has been uploaded successfully!`);
        setDocuments(prev => ({
          ...prev,
          [docType]: {
            status: 'pending',
            url: res.data.url || null,
            rejectionReason: null,
          },
        }));
      }
    } catch (err) {
      setUploadError(
        err.response?.data?.message || 
        'Failed to upload document. Please try again.'
      );
    } finally {
      setUploadingDoc(null);
      // Refresh status after 2 seconds
      setTimeout(fetchDocumentStatus, 2000);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'verified':
        return { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, text: 'Verified' };
      case 'rejected':
        return { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle, text: 'Rejected' };
      case 'pending':
        return { color: 'text-amber-600', bg: 'bg-amber-100', icon: Clock, text: 'Under Review' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', icon: AlertCircle, text: 'Not Uploaded' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-700 to-blue-600 text-white pb-16 pt-10">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <ShieldCheck size={48} className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Document Verification</h1>
          <p className="text-blue-100 max-w-xl mx-auto">
            Upload clear photos of your documents. All uploads are secure and verified by our team.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 -mt-12 relative z-10 space-y-6">
        {/* Upload Cards */}
        {['aadhaar', 'drivingLicense'].map((docType) => {
          const doc = documents[docType];
          const statusInfo = getStatusInfo(doc.status);
          const StatusIcon = statusInfo.icon;

          return (
            <div key={docType} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-5 border-b bg-blue-50 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                  <FileText size={22} className="text-blue-600" />
                  {docType === 'aadhaar' ? 'Aadhaar Card' : 'Driving License'}
                </h2>
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                  <StatusIcon size={18} />
                  {statusInfo.text}
                </div>
              </div>

              <div className="p-6">
                {doc.status === 'rejected' && doc.rejectionReason && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Rejected by admin</p>
                        <p className="mt-1">{doc.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {doc.url ? (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Uploaded document preview:</p>
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 h-64">
                      <img
                        src={doc.url}
                        alt={`${docType} preview`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center">
                    <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">No document uploaded yet</p>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, docType)}
                      disabled={uploadingDoc === docType}
                      className="hidden"
                    />
                    <div className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl cursor-pointer transition font-medium ${
                      uploadingDoc === docType 
                        ? 'bg-gray-200 text-gray-500' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}>
                      {uploadingDoc === docType ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={20} />
                          {doc.url ? 'Re-upload' : 'Upload Document'}
                        </>
                      )}
                    </div>
                  </label>

                  <p className="text-xs text-gray-500 text-center">
                    Supported: JPG, PNG • Max 5MB • Make sure photo is clear and all corners visible
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Messages */}
        {uploadError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm flex items-start gap-3">
            <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
            {uploadSuccess}
          </div>
        )}

        {/* Help text */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center text-blue-800">
          <ShieldCheck size={28} className="mx-auto mb-3" />
          <p className="font-medium">All your documents are encrypted and only visible to authorized team members.</p>
          <p className="mt-2 text-sm">Verification usually takes 24–48 hours.</p>
        </div>
      </div>
    </div>
  );
};

export default PartnerDocuments;