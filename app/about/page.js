import Link from 'next/link';
import SiteChrome from '../components/SiteChrome';

export default function AboutPage() {
  return (
    <SiteChrome>
      <main className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="text-3xl font-bold mb-4">About AdSense Audit Pro</h1>
        <p className="text-gray-700 leading-relaxed mb-4">
          AdSense Audit Pro helps website owners check whether their public site looks ready for Google AdSense.
          We run live HTTP crawls of your homepage, legal pages, and sample posts to score technical readiness,
          content quality, and publisher-policy risk signals.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          This is an independent tool. We are not affiliated with Google. Final approval decisions are always made by Google.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Questions? Visit our <Link href="/contact" className="text-green-700 font-medium">Contact</Link> page.
        </p>
      </main>
    </SiteChrome>
  );
}
