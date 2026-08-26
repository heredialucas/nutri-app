import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(defaultUrl),
    title: {
        default: "Mauro Acosta | Gestión nutricional",
        template: "%s | Mauro Acosta",
    },
    description:
        "Consultorio de gestión nutricional. Atención personalizada para pacientes y consultorios.",
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "32x32" },
            { url: "/favicon.svg", type: "image/svg+xml" },
        ],
    },
    openGraph: {
        title: "Mauro Acosta | Gestión nutricional",
        description: "Consultorio de gestión nutricional. Atención personalizada para pacientes y consultorios.",
        type: "website",
        locale: "es_AR",
    },
};

const geistSans = Geist({
    variable: "--font-geist-sans",
    display: "swap",
    subsets: ["latin"],
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={`${geistSans.className} antialiased`}>
                {/* Skip link para navegación por teclado: permite saltar el sidebar */}
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium shadow-lg"
                >
                    Saltar al contenido principal
                </a>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster position="top-right" richColors closeButton />
                </ThemeProvider>
            </body>
        </html>
    );
}
