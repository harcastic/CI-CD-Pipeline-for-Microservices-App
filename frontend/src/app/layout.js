import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata = {
  title: "BlogVerse — Share Your Stories",
  description:
    "A modern blogging platform to share your thoughts with the world.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "rgba(15, 15, 35, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e2e8f0",
                borderRadius: "16px",
                padding: "16px",
                fontSize: "14px",
              },
              success: {
                iconTheme: {
                  primary: "#667eea",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#f5576c",
                  secondary: "#fff",
                },
              },
            }}
          />

          {/* Background Effects */}
          <div className="fixed inset-0 bg-dots opacity-30 pointer-events-none" />
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          <Navbar />
          <main className="relative min-h-screen">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}