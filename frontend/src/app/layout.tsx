import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/ui/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACME Salary Management",
  description: "Salary management for ACME HR",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
