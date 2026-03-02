// src/App.jsx
import { Routes, Route } from "react-router-dom";
import PartnerLogin from "./pages/PartnerLogin";
import PartnerSignup from "./pages/PartnerSignup";
import Dashboard from "../src/pages/Dashboard";
import Onboarding from "../src/pages/Onboarding";
import PartnerProtectedRoute from "./routes/PartnerProtectedRoute";
import EarningsPage from "./components/Partner/EarningsPage";
import "./index.css";
import PartnerOrders from "./components/Partner/PartnerOrders";
import PartnerProfile from "./components/Partner/PartnerProfile";
import PartnerDocuments from "./components/Partner/PartnerDocuments";
import OrderHistoryDetail from "./components/Partner/OrderHistoryDetail";
function App() {
  return (
    <Routes>
      <Route path="/partner/login" element={<PartnerLogin />} />
      <Route path="/partner/signup" element={<PartnerSignup />} />
      <Route path="/partner/earnings" element={<EarningsPage />} />
      <Route path="/partner/profile" element={<PartnerProfile />} />
      <Route path="partner/documents" element={<PartnerDocuments />} />
<Route
  path="/partner/dashboard"
  element={
    <PartnerProtectedRoute>
      <Dashboard />
    </PartnerProtectedRoute>
  }
/>

<Route
  path="/partner/onboarding"
  element={
    <PartnerProtectedRoute>
      <Onboarding />
    </PartnerProtectedRoute>
  }
/>
     <Route path='partner-orders' element={<PartnerOrders/>}/>
     // Example: Partner dashboard routes
<Route path="/partner/order-history/:orderId" element={<OrderHistoryDetail />} />
      {/* Optional: redirect root to login */}
      <Route path="/" element={<PartnerLogin />} />
      {/* 404 fallback */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-red-600">
          404 - Page Not Found
        </div>
      } />
    </Routes>
  );
}

export default App;
