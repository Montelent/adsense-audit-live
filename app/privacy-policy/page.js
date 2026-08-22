import SiteChrome from '../components/SiteChrome';

export default function PrivacyPage() {
  return (
    <SiteChrome>
      <main className="max-w-3xl mx-auto px-4 py-14 prose prose-sm">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-6">Last updated: August 2026</p>
        <p className="text-gray-700 mb-4">AdSense Audit Pro ("we") respects your privacy. This policy explains what we collect when you use the audit tool and website.</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">Information we collect</h2>
        <p className="text-gray-700 mb-4">When you run an audit we process the public URL you submit and fetch publicly available pages from that site. We may store aggregate audit summaries (hostname, score) to improve the product.</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">Cookies and analytics</h2>
        <p className="text-gray-700 mb-4">We may use cookies and analytics tools to understand traffic. If Google AdSense or similar ad networks are enabled on this site, third parties such as Google may use cookies (including the DoubleClick cookie) to serve ads based on visits to this and other sites. You can opt out via <a className="text-green-700" href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer">Google Ads Settings</a>.</p>
        <h2 className="text-xl font-semibold mt-6 mb-2">Contact</h2>
        <p className="text-gray-700">Questions about this policy: support@yourdomain.com</p>
      </main>
    </SiteChrome>
  );
}
