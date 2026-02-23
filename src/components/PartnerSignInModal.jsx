// PartnerSignInModal.jsx
import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaSpinner, FaArrowLeft } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/index"; // ← adjust path if needed

const PartnerSignInModal = ({ isOpen, onClose, setIsPartnerAuthenticated }) => {
  const [inputValue, setInputValue] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [otpErrorMessage, setOtpErrorMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    if (otpSent && resendTimer > 0) {
      const timer = setInterval(() => setResendTimer((p) => p - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [otpSent, resendTimer]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value.trim());
    setErrorMessage("");
  };

  const handleOtpChange = (index, value) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        document.getElementById(`partner-otp-${index + 1}`)?.focus();
      }
    }
  };

  const isValidEmail = () =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(inputValue);

  const handleSendOtp = async () => {
    if (!isValidEmail()) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      sessionStorage.setItem("partnerRedirectAfterOtp", window.location.href);

      await api.post("/auth/partner/email-otp", { email: inputValue });
      setOtpSent(true);
      setResendTimer(30);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to send OTP. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setOtpErrorMessage("Please enter a 6-digit OTP.");
      return;
    }

    setLoading(true);
    setOtpErrorMessage("");

    try {
      const res = await api.post("/auth/partner/verify-otp", {
        email: inputValue,
        otp: otpString,
      });

      const { token, partner } = res.data;

      localStorage.setItem("partnerToken", token);
      localStorage.setItem("partnerProfile", JSON.stringify(partner));

      setIsPartnerAuthenticated?.(true);
      onClose();

      const redirect = sessionStorage.getItem("partnerRedirectAfterOtp") || "/partner/dashboard";
      window.location.href = redirect;
    } catch (err) {
      setOtpErrorMessage(
        err.response?.data?.message || "Invalid OTP or server error."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendTimer(30);
    await handleSendOtp();
  };

  const handleBack = () => {
    setOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
    setOtpErrorMessage("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="bg-white rounded-2xl p-8 w-[90%] max-w-md relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-5 text-2xl text-gray-500 hover:text-red-600"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-center mb-8 text-indigo-900">
          {otpSent ? "Verify OTP" : "Delivery Partner Sign In"}
        </h2>

        {!otpSent ? (
          <div className="space-y-6">
            <div className="relative">
              <input
                type="email"
                value={inputValue}
                onChange={handleInputChange}
                className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 peer"
                placeholder=" "
              />
              <label className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-500 peer-focus:text-indigo-600 transition-all">
                Email Address
              </label>
            </div>

            {errorMessage && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{errorMessage}</p>
            )}

            <button
              onClick={handleSendOtp}
              disabled={loading || !inputValue}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <FaSpinner className="animate-spin" />}
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-center text-gray-600">
              Enter 6-digit code sent to <br />
              <strong className="text-indigo-700">{inputValue}</strong>
            </p>

            <div className="grid grid-cols-6 gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`partner-otp-${i}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className="text-center text-2xl font-bold border rounded-lg h-14 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ))}
            </div>

            {otpErrorMessage && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{otpErrorMessage}</p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.join("").length !== 6}
              className="w-full py-3.5 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <FaSpinner className="animate-spin" />}
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>

            <div className="flex justify-between text-sm">
              <button onClick={handleBack} className="text-indigo-600 hover:underline">
                ← Back
              </button>
              <button
                onClick={handleResend}
                disabled={resendTimer > 0 || loading}
                className="text-indigo-600 hover:underline disabled:opacity-50"
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PartnerSignInModal;