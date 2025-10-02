import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { ToastProvider } from "@/components/ui/toast-provider";
import { ReduxProvider } from "@/lib/redux/provider";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Menu Management Dashboard",
  description: "Manage application menus hierarchically",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} antialiased`}>
        <ReduxProvider>
          <SidebarProvider>
            <ToastProvider>{children}</ToastProvider>
          </SidebarProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
