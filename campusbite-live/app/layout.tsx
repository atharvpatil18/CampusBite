import type { Metadata } from "next";
import "./globals.css";

// YOUR JOB: change the title and description for your app.
export const metadata: Metadata = {
  title: "CampusBite",
  description: "AI-powered SRM canteen ordering assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
