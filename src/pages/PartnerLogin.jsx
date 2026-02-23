// PartnerLogin.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { usePartnerAuth } from "../context/PartnerAuthContext";
import api from "../api";

export default function PartnerLogin() {
  const navigate = useNavigate();
  const { login } = usePartnerAuth();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");

  const sendOtp = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/partner/email-otp", { 
        email: email.trim(),
        purpose: "login" 
      });

      setStep("otp");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setOtpError("Enter full 6-digit OTP");
      return;
    }

    setLoading(true);
    setOtpError("");

    try {
      const res = await api.post("/auth/partner/verify-otp", {
        email: email.trim(),
        otp: code,
        purpose: "login"
      });

      login(res.data.token, res.data.partner);
      navigate("/partner/dashboard");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`login-otp-${index + 1}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-900 text-white px-8 py-8 text-center">
          <h1 className="text-2xl font-bold">Partner Login</h1>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600"
                />

                {error && <p className="text-red-600 text-sm text-center">{error}</p>}

                <button
                  onClick={sendOtp}
                  disabled={loading}
                  className="w-full py-3 bg-blue-900 text-white rounded-lg font-semibold disabled:opacity-60"
                >
                  {loading ? <FaSpinner className="animate-spin mx-auto" /> : "Send OTP"}
                </button>

                <p className="text-center text-sm text-gray-600 mt-4">
                  Don't have an account?{" "}
                  <button 
                    onClick={() => navigate("/partner/signup")} 
                    className="text-blue-700 font-medium underline"
                  >
                    Sign up here
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <p className="text-center text-gray-600">
                  Enter OTP sent to <strong>{email}</strong>
                </p>

                <div className="grid grid-cols-6 gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`login-otp-${i}`}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="h-12 text-center border rounded-lg focus:ring-2 focus:ring-blue-600 text-xl"
                    />
                  ))}
                </div>

                {otpError && <p className="text-red-600 text-sm text-center">{otpError}</p>}

                <button
                  onClick={verifyOtp}
                  disabled={loading}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-60"
                >
                  {loading ? <FaSpinner className="animate-spin mx-auto" /> : "Verify & Login"}
                </button>

                <button
                  onClick={() => setStep("email")}
                  className="text-sm text-blue-700 flex items-center gap-1 mx-auto mt-2"
                >
                  <FaArrowLeft /> Change email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}