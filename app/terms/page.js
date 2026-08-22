import SiteChrome from '../components/SiteChrome';

export default function TermsPage() {
  return (
    <SiteChrome>
      <main className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-6">Last updated: August 2026</p>
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <p>AdSense Audit Pro provides automated, informational readiness checks only. Results are estimates based on publicly crawlable pages and do not guarantee Google AdSense approval or rejection.</p>
          <p>You agree not to abuse the service (excessive automated requests, scanning sites you do not own or have permission to test, or using results for fraud).</p>
          <p>We are not affiliated with Google. Google AdSense policies and decisions remain solely under Google’s control.</p>
          <p>The service is provided "as is" without warranties. We are not liable for decisions you make based on audit output.</p>
        </div>
      </main>
    </SiteChrome>
  );
}
