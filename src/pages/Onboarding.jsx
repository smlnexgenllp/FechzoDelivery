// src/components/Partner/Onboarding.jsx
import { useState } from "react";
import { Loader2, MapPin, ArrowLeft, Check, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    vehicleType: "",
    vehicleNumber: "",
    licenseNumber: "",
    aadharNumber: "",
    city: "",
    area: "",
    latitude: "",
    longitude: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifsc: "",
    profilePhoto: null,
    panCard: null,
    aadharFront: null,
    drivingLicenseFront: null,
    rcBookFront: null,
  });

  const [previews, setPreviews] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB");
      return;
    }
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setError("Only JPG/PNG allowed");
      return;
    }

    setForm((prev) => ({ ...prev, [field]: file }));
    setPreviews((prev) => ({ ...prev, [field]: URL.createObjectURL(file) }));
    setError("");
  };

  const removeFile = (field) => {
    setForm((prev) => ({ ...prev, [field]: null }));
    setPreviews((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLoading(false);
        setSuccess("Location captured successfully!");
      },
      () => {
        setError("Unable to get location. Please allow location access in browser settings.");
        setLoading(false);
      }
    );
  };

  // ── VALIDATION ─────────────────────────────────────────────────────────
  const getValidationErrors = () => {
    const errors = [];

    // Fields required by current or previous steps
    if (step >= 1) {
      if (!form.fullName.trim()) errors.push("Full name is required");
    }

    if (step >= 2) {
      if (!form.vehicleType) errors.push("Vehicle type is required");
      if (!form.vehicleNumber.trim()) errors.push("Vehicle number is required");
    }

    if (step >= 3) {
      if (!form.licenseNumber.trim()) errors.push("Driving license number is required");
    }

    if (step >= 4) {
      if (!form.city.trim()) errors.push("City is required");
      if (!form.area.trim()) errors.push("Area/locality is required");
      if (!form.latitude || !form.longitude) errors.push("Please detect your location");
    }

    if (step >= 5) {
      if (!form.bankName.trim()) errors.push("Bank name is required");
      if (!form.accountNumber.trim()) errors.push("Account number is required");
      if (form.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.toUpperCase())) {
        errors.push("Invalid IFSC code");
      }
    }

    if (step >= 6) {
      if (!form.profilePhoto) errors.push("Profile photo is required");
      if (!form.panCard) errors.push("PAN card photo is required");
      if (!form.aadharFront) errors.push("Aadhaar front photo is required");
      if (!form.drivingLicenseFront) errors.push("Driving license front photo is required");
      if (!form.rcBookFront) errors.push("RC book front photo is required");
    }

    // Optional fields format checks
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      errors.push("Enter valid 10-digit mobile number");
    }
    if (form.aadharNumber && !/^\d{12}$/.test(form.aadharNumber)) {
      errors.push("Aadhaar must be 12 digits");
    }

    return errors;
  };

  const handleNext = () => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
      setError(errors.join(" • "));
      return;
    }
    setStep(step + 1);
    setError("");
  };

  const handleSubmit = async () => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
      setError(errors.join(" • "));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Submitting form data:", {
        fullName: form.fullName,
        phone: form.phone,
        vehicleType: form.vehicleType,
        vehicleNumber: form.vehicleNumber,
        city: form.city,
        area: form.area,
        licenseNumber: form.licenseNumber,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        ifsc: form.ifsc,
      });

      const formData = new FormData();

      // Text fields
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && typeof value !== "object") {
          formData.append(key, value);
        }
      });

      // Files
      if (form.profilePhoto) formData.append("profilePhoto", form.profilePhoto);
      if (form.panCard) formData.append("panCard", form.panCard);
      if (form.aadharFront) formData.append("aadharFront", form.aadharFront);
      if (form.drivingLicenseFront) formData.append("drivingLicenseFront", form.drivingLicenseFront);
      if (form.rcBookFront) formData.append("rcBookFront", form.rcBookFront);

      const response = await api.post("/partner/onboarding", formData, 
        // headers: {
        //   Authorization: `Bearer ${localStorage.getItem("partnerToken")}`,
        //   "Content-Type": "multipart/form-data",
        // },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("partnerToken")}`,
          },
        }
      );

      if (!onboardingRes.data.success) {
        throw new Error(onboardingRes.data.message || "Onboarding failed");
      }

      // Step 2: Link bank account with Razorpay
      const bankRes = await api.post(
        "/delivery-partner/bank/link",
        {
          accountHolderName: form.accountHolderName.trim(),
          accountNumber: form.accountNumber.trim(),
          ifsc: form.ifsc.toUpperCase(),
          bankName: form.bankName.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("partnerToken")}`,
          },
        }
      );

      if (!bankRes.data.success) {
        throw new Error(bankRes.data.message || "Bank account linking failed");
      }

      setSuccess("Onboarding and bank account linking completed successfully! Waiting for admin approval.");
      
      // Auto-redirect after 2.5 seconds
      setTimeout(() => {
        navigate("/partner/dashboard");
      }, 2500);

      alert("Onboarding submitted successfully! Waiting for approval.");
      navigate("/partner/dashboard");
    } catch (err) {
      console.error("Submit error:", err);
      const serverMessage =
        err.response?.data?.message ||
        (err.response?.data?.missingFields?.length &&
          `Missing: ${err.response.data.missingFields.join(", ")}`) ||
        "Failed to submit onboarding. Please try again.";
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 6) * 100;

  const isInvalid = (condition) => condition ? "border-red-500" : "border-gray-300";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 text-white px-6 py-5">
          <h2 className="text-2xl font-bold text-center">Become a Delivery Partner</h2>
          <p className="text-indigo-100 text-center mt-1">Step {step} of 6</p>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="w-full bg-indigo-100 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${isInvalid(!form.fullName.trim())}`}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mobile Number <span className="text-red-600">*</span>
                </label>
                <input
                  name="phone"
                  maxLength={10}
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="10-digit mobile number"
                />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vehicle Type <span className="text-red-600">*</span>
                </label>
                <select
                  name="vehicleType"
                  value={form.vehicleType}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${isInvalid(!form.vehicleType)}`}
                >
                  <option value="">Select vehicle type</option>
                  <option value="BIKE">Bike</option>
                  <option value="SCOOTER">Scooter</option>
                  <option value="CYCLE">Cycle</option>
                  <option value="ELECTRIC_BIKE">Electric Bike</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vehicle Number <span className="text-red-600">*</span>
                </label>
                <input
                  name="vehicleNumber"
                  value={form.vehicleNumber.toUpperCase()}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition uppercase ${isInvalid(!form.vehicleNumber.trim())}`}
                  placeholder="e.g. TN 29 AB 1234"
                />
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Driving License Number <span className="text-red-600">*</span>
                </label>
                <input
                  name="licenseNumber"
                  value={form.licenseNumber.toUpperCase()}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none uppercase transition"
                  placeholder="Enter license number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Aadhaar Number (optional)
                </label>
                <input
                  name="aadharNumber"
                  maxLength={12}
                  value={form.aadharNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="12-digit Aadhaar number"
                />
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City <span className="text-red-600">*</span>
                </label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${isInvalid(!form.city.trim())}`}
                  placeholder="e.g. Bengaluru"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Area / Locality <span className="text-red-600">*</span>
                </label>
                <input
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="e.g. Koramangala"
                />
              </div>
              <button
                type="button"
                onClick={detectLocation}
                disabled={loading}
                className={`w-full py-3.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                  loading ? "bg-indigo-300 text-white cursor-not-allowed" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                }`}
              >
                <MapPin size={18} />
                {loading ? "Detecting..." : "Use Current Location"}
              </button>

              {form.latitude && form.longitude && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <Check size={18} />
                  <span>Location captured successfully</span>
                </div>
              )}
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bank Name <span className="text-red-600">*</span>
                </label>
                <input
                  name="bankName"
                  value={form.bankName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="e.g. State Bank of India"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Account Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    name="accountNumber"
                    value={form.accountNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="Account number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    IFSC Code <span className="text-red-600">*</span>
                  </label>
                  <input
                    name="ifsc"
                    value={form.ifsc.toUpperCase()}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none uppercase transition"
                    placeholder="SBIN0001234"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6 */}
          {step === 6 && (
            <div className="space-y-7">
              <h3 className="text-xl font-semibold text-gray-800 text-center">
                Upload KYC Documents
              </h3>
              <p className="text-center text-sm text-gray-600 -mt-3">
                Please upload clear, readable photos
              </p>

              {[
                { field: "profilePhoto", label: "Profile Photo (clear face)", required: true },
                { field: "panCard", label: "PAN Card", required: true },
                { field: "aadharFront", label: "Aadhaar Card (Front)", required: true },
                { field: "drivingLicenseFront", label: "Driving License (Front)", required: true },
                { field: "rcBookFront", label: "RC Book (Front)", required: true },
              ].map(({ field, label, required }) => (
                <div key={field} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {label} {required && <span className="text-red-600">*</span>}
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => handleFileChange(e, field)}
                    className="hidden"
                    id={field}
                  />
                  <label
                    htmlFor={field}
                    className={`block cursor-pointer border-2 border-dashed rounded-xl p-5 sm:p-6 text-center transition ${
                      previews[field] ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-indigo-400"
                    } ${!previews[field] && required ? "border-red-500" : ""}`}
                  >
                    {previews[field] ? (
                      <div className="relative inline-block">
                        <img
                          src={previews[field]}
                          alt={`${label} preview`}
                          className="w-40 sm:w-48 h-auto object-contain rounded-lg border shadow-sm mx-auto"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            removeFile(field);
                          }}
                          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-md"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto text-gray-400 mb-3" size={36} />
                        <p className="font-medium text-indigo-600">Click to upload {label}</p>
                        <p className="text-xs text-gray-500 mt-1">Max 5MB • JPG/PNG</p>
                      </>
                    )}
                  </label>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium">Note:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>PUC certificate is optional in most areas</li>
                  <li>Back sides of documents can be uploaded later if needed</li>
                  <li>All uploads are securely stored</li>
                </ul>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3.5 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Back
              </button>
            )}

            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-md"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className={`flex-1 py-3.5 px-6 font-medium rounded-lg transition flex items-center justify-center gap-2 shadow-md ${
                  loading
                    ? "bg-green-400 cursor-not-allowed text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                {loading ? "Submitting..." : "Submit for Approval"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}