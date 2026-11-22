import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Florescer — gestão para floriculturas", template: "%s · Florescer" },
  description: "Pedidos, entregas, estoque de flores e clientes em um só lugar.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const storefront = (await headers()).get("x-storefront") === "1";
  const dark = !storefront && (await cookies()).get("flora_theme")?.value === "dark";
  return (
    <html lang="pt-BR" className={dark ? "dark" : undefined}>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
