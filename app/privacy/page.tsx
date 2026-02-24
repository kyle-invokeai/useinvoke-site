import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy - Invoke',
  description: 'Invoke Privacy Policy - How we collect, use, and protect your information.',
  robots: 'noindex, follow',
}

export default function PrivacyPage() {
  return (
    <main className="bg-slate-950 text-slate-200 antialiased">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white tracking-tight">Invoke</Link>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">Home</Link>
              <Link href="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-400 mb-12">Effective Date: February 23, 2026</p>

          <div className="prose prose-invert max-w-none">
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-4">Information We Collect</h2>
              <p className="text-slate-400 mb-4 leading-relaxed">
                We collect information necessary to provide our communication automation services. This includes:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                <li><strong className="text-slate-300">Contact Information:</strong> Business name, email address, and phone numbers used for service configuration.</li>
                <li><strong className="text-slate-300">Usage Data:</strong> Information about how you interact with our platform, API calls, and system performance metrics.</li>
                <li><strong className="text-slate-300">Communication Metadata:</strong> Message timestamps, delivery status, and routing information required for service operation.</li>
                <li><strong className="text-slate-300">Technical Data:</strong> IP addresses, browser type, device information, and cookies used for security and service improvement.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-4">How We Use Information</h2>
              <p className="text-slate-400 mb-4 leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                <li>Provide, maintain, and improve our communication automation services</li>
                <li>Process and route messages and calls through our infrastructure</li>
                <li>Monitor service performance and troubleshoot technical issues</li>
                <li>Ensure compliance with telecommunications regulations and legal requirements</li>
                <li>Communicate with you about service updates, security alerts, and support matters</li>
                <li>Prevent fraud, abuse, and unauthorized access to our systems</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
              <p className="text-slate-400 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:<br /><br />
                <a href="mailto:support@useinvoke.ai" className="text-slate-300 hover:text-white transition-colors">support@useinvoke.ai</a>
              </p>
            </section>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">Home</Link>
              <Link href="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
            </div>
            <p className="text-sm text-slate-500">
              <a href="mailto:support@useinvoke.ai" className="hover:text-slate-300 transition-colors">support@useinvoke.ai</a>
            </p>
            <p className="text-sm text-slate-600">&copy; 2026 Invoke. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
