import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Stylix Architect – 16-Color Theme Studio</title>
        <meta name="description" content="Design, preview, and export 16-color schemes for terminal, GTK, and Qt environments" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href={`${process.env.NODE_ENV === "production" ? "/16ceditor" : ""}/manifest.json`} />
        <meta name="theme-color" content="#131313" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href={`${process.env.NODE_ENV === "production" ? "/16ceditor" : ""}/icon-192.png`} />
      </head>
      <body className="antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("${process.env.NODE_ENV === "production" ? "/16ceditor" : ""}/sw.js");
}
            `,
          }}
        />
      </body>
    </html>
  );
}
