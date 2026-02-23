// src/context/PartnerAuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/index";

const PartnerAuthContext = createContext();

export function PartnerAuthProvider({ children }) {
  const [partner, setPartner] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load partner data
  useEffect(() => {
    const loadPartnerData = async () => {
      const token = localStorage.getItem("partnerToken");
      const storedPartner = localStorage.getItem("partner");

      if (token && storedPartner) {
        setPartner(JSON.parse(storedPartner));

        try {
          const res = await api.get("/delivery-partner/orders/status", {
            headers: { Authorization: `Bearer ${token}` },
          });

          const onlineStatus = res.data?.status?.onlineStatus || false;

          setIsOnline(onlineStatus);
          localStorage.setItem(
            "partnerOnlineStatus",
            onlineStatus ? "online" : "offline"
          );
        } catch (err) {
          console.error("Failed to load online status:", err);
        }
      }

      setLoading(false);
    };

    loadPartnerData();
  }, []);

  const login = (token, partnerData) => {
    localStorage.setItem("partnerToken", token);
    localStorage.setItem("partner", JSON.stringify(partnerData));
    localStorage.setItem("partnerOnlineStatus", "offline");

    setPartner(partnerData);
    setIsOnline(false);
  };

  const logout = () => {
    localStorage.clear();
    setPartner(null);
    setIsOnline(false);
  };

  const toggleAvailability = async () => {
    try {
      const token = localStorage.getItem("partnerToken");
      if (!token) throw new Error("No token found");

      const newStatus = !isOnline;

      await api.patch(
        "/delivery-partner/orders/availability",
        { isOnline: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setIsOnline(newStatus);
      localStorage.setItem(
        "partnerOnlineStatus",
        newStatus ? "online" : "offline"
      );

      console.log(`Partner is now ${newStatus ? "ONLINE" : "OFFLINE"}`);
    } catch (err) {
      console.error("Failed to update availability:", err);
      alert("Failed to update status. Please try again.");
    }
  };

  return (
    <PartnerAuthContext.Provider
      value={{ partner, login, logout, isOnline, toggleAvailability, loading }}
    >
      {children}
    </PartnerAuthContext.Provider>
  );
}

export const usePartnerAuth = () => useContext(PartnerAuthContext);