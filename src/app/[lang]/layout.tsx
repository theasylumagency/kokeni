import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "KOKENI.GE | Precision Embossing",
  description: "Advanced European printing technology meets uncompromising manual craftsmanship.",
};

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ka' }]
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  return (
    <html lang={lang}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className="antialiased relative min-h-screen w-full font-display selection:bg-primary selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}
