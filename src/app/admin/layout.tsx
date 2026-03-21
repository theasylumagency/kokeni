import type { Metadata } from "next";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";

import "../globals.css";

export const metadata: Metadata = {
  title: "KOKENI Admin",
  description: "KOKENI Control Panel",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authState = await isAdminAuthenticated();

  if (!authState) {
    return (
      <html lang="en">
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased overflow-x-hidden">
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="flex w-full flex-col min-h-screen md:ml-64">
            <AdminTopbar />
            <main className="flex-1 p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
