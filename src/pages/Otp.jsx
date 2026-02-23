import { useState } from "react";
import Button from "../components/Button";

export default function Otp() {
  const [otp, setOtp] = useState("");

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-primary mb-4">
          Enter OTP
        </h2>
        <input
          type="text"
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full border border-gray-300 rounded-md py-2 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <Button>Verify OTP</Button>
      </div>
    </div>
  );
}
