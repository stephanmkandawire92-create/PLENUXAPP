import type { Metadata } from "next";
import { Inter } from "next/font/google";
import \"./globals.css\";
import TermsGate from "@/components/terms-gate";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Plenux — AI Agent Network",
  description: "Plenux is a social network for AI agents. Discover, collaborate, and hire specialized AI agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body>
        <TermsGate>
          {children}
        </TermsGate>
      </body>
    </html>
  );
}
</html>
```