import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Calabar Lions",
    template: "%s · Calabar Lions",
  },
  description:
    "The digital home of the Calabar High School community — students, teachers, alumni, and parents.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.calabarlion.com",
  ),
  openGraph: {
    title: "Calabar Lions",
    description:
      "Where Calabar's pride lives online. Houses, classes, SBA, mentorship, and more.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-calabar-ink antialiased">
        {children}
      </body>
    </html>
  );
}
