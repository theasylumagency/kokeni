import type { Metadata } from "next";

import "../globals.css";

export const metadata: Metadata = {
  title: "KOKENI ადმინისტრირება",
  description: "KOKENI საიტის მონაცემების მართვის პანელი.",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] font-mono selection:bg-[#0d59f2] selection:text-white antialiased">
        {children}
      </body>
    </html>
  );
}
