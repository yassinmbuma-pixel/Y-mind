import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Y-Mind — Customer acquisition, made smarter",
  description: "Find relevant prospects, qualify leads and turn customer intent into growth."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
