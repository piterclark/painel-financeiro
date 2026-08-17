import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Painel Financeiro",
  description: "Dashboard de custos e gastos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className={`${geist.className} min-h-full bg-[#0f1117] text-white`}>
        {children}
      </body>
    </html>
  );
}
