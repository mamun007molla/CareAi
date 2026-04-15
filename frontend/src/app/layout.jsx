import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "CareAI — Module 1: Physical Monitoring",
  description: "AI-powered elderly physical monitoring system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#161b22",
              color: "#e6edf3",
              border: "1px solid #2a3441",
              borderRadius: "10px",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#4ade80", secondary: "#0d1117" } },
            error:   { iconTheme: { primary: "#f87171", secondary: "#0d1117" } },
          }}
        />
      </body>
    </html>
  );
}
