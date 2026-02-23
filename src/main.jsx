import { PartnerAuthProvider } from "./context/PartnerAuthContext";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // 1. Import the Router
import App from './App';
ReactDOM.createRoot(document.getElementById("root")).render(
  <PartnerAuthProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </PartnerAuthProvider>
);
