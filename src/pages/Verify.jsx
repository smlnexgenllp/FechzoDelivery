import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Verify() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem("emailForSignIn");

      // If we didn't get email from storage, ask user (fallback)
      if (!email) {
        email = window.prompt("Please provide your email for confirmation");
      }

      signInWithEmailLink(auth, email, window.location.href)
        .then(async (result) => {
          // Check if this was a signup (we stored extra data)
          const signupDataRaw = window.localStorage.getItem("signupData");
          if (signupDataRaw) {
            const { name, city } = JSON.parse(signupDataRaw);
            await setDoc(doc(db, "delivery_partners", result.user.uid), {
              uid: result.user.uid,
              name,
              city,
              email: result.user.email,
              createdAt: new Date().toISOString(),
              status: "pending",
            });
            window.localStorage.removeItem("signupData");
          }

          window.localStorage.removeItem("emailForSignIn");
          alert("Successfully signed in!");
          navigate("/dashboard"); // ← change to your real dashboard route
        })
        .catch((err) => {
          console.error(err);
          alert("Error completing sign-in: " + err.message);
        });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Verifying...</h2>
        <p className="mt-2 text-gray-600">Please wait while we complete your login.</p>
      </div>
    </div>
  );
}