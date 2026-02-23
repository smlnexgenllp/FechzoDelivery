import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { usePartnerAuth } from "../context/PartnerAuthContext";
import api from "../api";

export default function PartnerSignup() {
  const navigate = useNavigate();
  const { login } = usePartnerAuth();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    if (step === "otp" && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, resendTimer]);

  const sendOtp = async () => {
  if (!email) {
    setError("Enter valid email");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const res = await api.post("/auth/partner/email-otp", {
      email,
      purpose: "signup",   // ⭐ FIX
    });

    if (res.data.alreadyRegistered) {
      setError("Email already registered. Please login.");
      return;
    }

    setStep("otp");
    setResendTimer(30);

  } catch (err) {
    setError(err.response?.data?.message || "Failed to send OTP");
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
        purpose: "signup",   // ⭐ REQUIRED FIELD
      });


      // 🔥 Login immediately after signup
      login(res.data.token, res.data.partner);

      navigate("/partner/onboarding");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid OTP");
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
      document.getElementById(`signup-otp-${index + 1}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-900 text-white px-8 py-8 text-center">
          <h1 className="text-2xl font-bold">Partner Signup</h1>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <input
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600"
                />

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button
                  onClick={sendOtp}
                  disabled={loading}
                  className="w-full py-3 bg-blue-900 text-white rounded-lg font-semibold"
                >
                  {loading ? <FaSpinner className="animate-spin mx-auto" /> : "Send OTP"}
                </button>

                <p className="text-sm text-center">
                  Already have an account?{" "}
                  <span
                    onClick={() => navigate("/partner/login")}
                    className="text-blue-700 cursor-pointer"
                  >
                    Login
                  </span>
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
                      id={`signup-otp-${i}`}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="h-12 text-center border rounded-lg focus:ring-2 focus:ring-blue-600"
                    />
                  ))}
                </div>

                {otpError && <p className="text-red-600 text-sm">{otpError}</p>}

                <button
                  onClick={verifyOtp}
                  disabled={loading}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold"
                >
                  {loading ? <FaSpinner className="animate-spin mx-auto" /> : "Verify OTP"}
                </button>

                <button
                  onClick={() => setStep("email")}
                  className="text-sm text-blue-700 flex items-center gap-1"
                >
                  <FaArrowLeft /> Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
