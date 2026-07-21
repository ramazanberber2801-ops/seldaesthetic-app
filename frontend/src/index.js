import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const params = new URLSearchParams({
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "",
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "",
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.REACT_APP_FIREBASE_APP_ID || "",
      });
      await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params.toString()}`);
    } catch (error) {
      console.error("Push service worker registration failed:", error);
    }
  });
}
