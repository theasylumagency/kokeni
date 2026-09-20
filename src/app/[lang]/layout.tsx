import type { Metadata } from "next";
import "../globals.css";
import { getDictionary } from "@/utils/getDictionary";
import Navigation from "@/components/layout/Navigation";

export const metadata: Metadata = {
  title: "KOKENI.GE | Precision Embossing",
<<<<<<< HEAD
  description:
    "Advanced European printing technology meets uncompromising manual craftsmanship.",
  manifest: "/site.webmanifest",
=======
  description: "Advanced European printing technology meets uncompromising manual craftsmanship.",
>>>>>>> ebc8a24e11d29d3bdab878b85a3fdcd82aff3d5a
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
  const dict = await getDictionary(lang);
<<<<<<< HEAD

=======
  
>>>>>>> ebc8a24e11d29d3bdab878b85a3fdcd82aff3d5a
  return (
    <html lang={lang}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className="antialiased relative min-h-screen w-full font-display selection:bg-primary selection:text-white"
      >
        <Navigation dict={dict} lang={lang} />
        {children}
      </body>
    </html>
  );
}
