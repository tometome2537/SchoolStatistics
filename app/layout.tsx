import type { Metadata } from "next";
import "./globals.css";
import type React from "react";

export const metadata: Metadata = {
	title: "特別支援学校の増減",
	description: "特別支援学校の新設・廃校の推移",
	icons: {
		icon: "/favicon.ico",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja-JP" dir="ltr">
			<body>{children}</body>
		</html>
	);
}
