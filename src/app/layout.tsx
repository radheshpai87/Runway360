import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://runway360.vercel.app"),
  title: "Runway360 — Gen Z Career Transition Coach & Financial Runway Calibrator",
  description: "Calculate your financial runway, assess risk thresholds, and build a personalized roadmap for your career pivot.",
  openGraph: {
    title: "Runway360 — Gen Z Career Transition Coach",
    description: "Calculate your financial runway, assess risk thresholds, and build a personalized roadmap for your career pivot.",
    url: "https://runway360.vercel.app",
    siteName: "Runway360",
    images: [
      {
        url: "/og_image.jpg",
        width: 1200,
        height: 630,
        alt: "Runway360 - Calibrate Your Career Leap",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Runway360 — Gen Z Career Transition Coach",
    description: "Calculate your financial runway, assess risk thresholds, and build a personalized roadmap for your career pivot.",
    images: ["/og_image.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} antialiased`}
    >
      <body className="bg-[#EFDFBB] text-[#111111] min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
