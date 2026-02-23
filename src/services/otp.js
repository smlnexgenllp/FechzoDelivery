import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "../firebase/firebase";

export const setupRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
      }
    );
  }
};

export const sendOtp = async (phone) => {
  setupRecaptcha();
  const appVerifier = window.recaptchaVerifier;
  const fullPhone = `+91${phone}`;

  const confirmationResult = await signInWithPhoneNumber(
    auth,
    fullPhone,
    appVerifier
  );

  window.confirmationResult = confirmationResult;
};

export const verifyOtp = async (otp) => {
  return await window.confirmationResult.confirm(otp);
};
