import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Фрактальный Оракул",
    description: "Предсказания на основе цепей Маркова и фракталов Жюлиа",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        /*
          suppressHydrationWarning={true} игнорирует ошибки несоответствия атрибутов,
          вызванные расширениями браузера. Это безопасно для SEO и пользователей.
        */
        <html lang="ru" suppressHydrationWarning={true}>
        <body className={inter.className}>{children}</body>
        </html>
    );
}