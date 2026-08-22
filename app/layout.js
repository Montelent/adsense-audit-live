export const metadata = {
  title: 'AdSense Audit Pro – Live Website Readiness Checker',
  description:
    'Live crawl of your site for Google AdSense readiness: HTTPS, Privacy, About, Contact, mobile signals, and actionable fixes.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `tailwind.config={theme:{extend:{colors:{brand:{50:'#f0fdf4',100:'#dcfce7',500:'#22c55e',600:'#16a34a',700:'#15803d'}}}}}`,
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `body{font-family:Inter,system-ui,sans-serif}.score-ring{background:conic-gradient(var(--score-color) calc(var(--score)*1%),#e5e7eb 0)}.prose-sample{white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:.8rem}`,
          }}
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
