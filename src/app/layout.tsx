import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "НейроконсультантПлюс",
    template: "%s | НейроконсультантПлюс"
  },
  description: "НейроконсультантПлюс - AI-ассистент для профессионалов",
  icons: {
    icon: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/8548ce4b-c4e7-49fc-aeb1-0d89445da897-consultant-ru/assets/icons/favicon-1.ico"
  },
  openGraph: {
    title: "НейроконсультантПлюс",
    description: "НейроконсультантПлюс - AI-ассистент для профессионалов",
    images: [
      {
        url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/8548ce4b-c4e7-49fc-aeb1-0d89445da897-consultant-ru/assets/images/logoCircle-2.svg",
        width: 800,
        height: 600,
        alt: "НейроконсультантПлюс",
      },
    ],
    siteName: "НейроконсультантПлюс",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "НейроконсультантПлюс",
    description: "НейроконсультантПлюс - AI-ассистент для профессионалов",
    images: ["https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/8548ce4b-c4e7-49fc-aeb1-0d89445da897-consultant-ru/assets/images/logoCircle-2.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}