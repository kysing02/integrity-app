import type { Metadata, Viewport } from "next"; // Import Viewport type
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Integrity Dashboard",
  description: "Temporal Integrity Tracking",
};

// Add this viewport export to handle the Safe Area
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming on inputs
  viewportFit: "cover", // This is the key property!
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.className} bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}