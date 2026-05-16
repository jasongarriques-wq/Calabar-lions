import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calabar Lions",
  description: "The digital home of the Calabar Lions network.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
