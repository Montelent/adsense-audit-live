import SiteChrome from '../components/SiteChrome';

export default function ContactPage() {
  return (
    <SiteChrome>
      <main className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="text-3xl font-bold mb-4">Contact us</h1>
        <p className="text-gray-700 mb-6">For support, Pro activation after payment, or partnership inquiries:</p>
        <div className="bg-white border rounded-xl p-6 space-y-3 text-sm">
          <p><span className="font-medium">Email:</span> support@yourdomain.com</p>
          <p className="text-gray-500">Replace this address in Admin or edit this page with your real contact details.</p>
          <p className="text-gray-600">We typically reply within 1–2 business days.</p>
        </div>
      </main>
    </SiteChrome>
  );
}
