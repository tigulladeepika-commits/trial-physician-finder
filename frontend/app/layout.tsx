import "./globals.css";

export const metadata = {
  title: "Trial Physician Finder",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* MapQuest & Leaflet CSS - Required for map styling */}
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mapquest/mapquest@1.3.0/dist/mapquest.css" />
        
        {/* Inter — used by page.tsx, TrialCard.tsx, PhysicianCard.tsx, PhysicianFilters.tsx */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* DM Sans + DM Serif Display — used by globals.css */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />

        {/* Leaflet JS - Must load before MapQuest */}
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

        {/* MapQuest JS */}
        <script src="https://cdn.jsdelivr.net/npm/@mapquest/mapquest@1.3.0/dist/mapquest.js"></script>
      </head>
      <body className="bg-gray-50 font-sans">{children}</body>
    </html>
  );
}