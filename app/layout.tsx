import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calabar Lions – The Academic Social Network",
  description: "Built for the Lions of Calabar High. Track SBAs, rep your house, link with your year group, and leave your mark on the Hill.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
