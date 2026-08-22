import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-noto-sans-thai"
});

export const metadata: Metadata = {
  title: "THAIWANDER — ค้นพบที่เที่ยวไทยวันนี้",
  description: "ค้นหาสถานที่ท่องเที่ยวทั่วประเทศไทย พร้อมจังหวัดและสถานที่กำลังเป็นที่นิยม"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <body className="font-thai">{children}</body>
    </html>
  );
}