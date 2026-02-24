import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service - Invoke',
  description: 'Invoke Terms of Service - Terms and conditions for using our communication automation platform.',
  robots: 'noindex, follow',
}

export default function TermsPage() {
  return (
    <main className="bg-slate-950 text-slate-200 antialiased">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white tracking-tight">Invoke</Link>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">Home</Link>
              <Link href="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-slate-400 mb-12">Effective Date: February 23, 2026</p>

          <div className="prose prose-invert max-w-none">
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-400 leading-relaxed">
                By accessing or using Invoke&apos;s services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-4">2. Description of Services</h2>
              <p className="text-slate-400 leading-relaxed">
                Invoke provides AI-powered communication automation infrastructure, including voice automation, SMS workflow orchestration, intelligent routing systems, and API-based communication tools.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-4">3. Prohibited Uses</h2>
              <p className="text-slate-400 mb-4 leading-relaxed">
                You agree not to use Invoke&apos;s services for:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                <li>Sending spam, unsolicited commercial messages, or bulk communications without proper consent</li>
                <li>Engaging in fraudulent activities, scams, or deceptive practices</li>
                <li>Transmitting any illegal content or materials</li>
                <li>Harassing, threatening, or intimidating individuals</li>
                <li>Violating the Telephone Consumer Protection Act (TCPA) or other telecommunications regulations</li>
                <li>Using fake or spoofed caller ID information</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-4">4. Compliance with Telecommunications Laws</h2>
              <p className="text-slate-400 leading-relaxed">
                You are solely responsible for complying with all applicable telecommunications laws and regulations, including but not limited to the TCPA and CAN-SPAM Act. Invoke provides tools for compliant communication, but you are responsible for using these tools in accordance with the law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Contact Information</h2>
              <p className="text-slate-400 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:<br /><br />
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
              <Link href="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
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
