import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy - Invoke AI',
  description: 'Invoke AI Privacy Policy - How we collect, use, and protect your information for our SMS service.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-500 mb-8">Effective Date: February 23, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
          <p className="text-slate-700 mb-3 leading-relaxed">
            When you use Invoke AI via SMS, we collect the following information:
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4 leading-relaxed">
            <li><strong>Phone Number:</strong> Your mobile phone number used to send and receive text messages.</li>
            <li><strong>Message Content:</strong> The content of messages you send and receive through our service.</li>
            <li><strong>Timestamps:</strong> Date and time stamps of when messages are sent and received.</li>
            <li><strong>Delivery Status:</strong> Information about whether messages were successfully delivered.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
          <p className="text-slate-700 mb-3 leading-relaxed">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4 leading-relaxed">
            <li>Provide and operate the Invoke AI conversational SMS service</li>
            <li>Process and respond to your messages and requests</li>
            <li>Improve service functionality and user experience</li>
            <li>Ensure compliance with telecommunications regulations</li>
            <li>Monitor service performance and troubleshoot technical issues</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Information Sharing</h2>
          <p className="text-slate-700 leading-relaxed">
            We do not sell, rent, or share your personal information with third parties for marketing purposes. 
            We only share information as necessary to provide the service (e.g., with our SMS infrastructure providers) 
            or as required by law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Your Choices and Rights</h2>
          <p className="text-slate-700 mb-3 leading-relaxed">
            You have control over your participation in our SMS service:
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4 leading-relaxed">
            <li><strong>Opt-Out:</strong> Reply <strong>STOP</strong> at any time to cancel and stop receiving messages.</li>
            <li><strong>Help:</strong> Reply <strong>HELP</strong> for assistance or contact information.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Data Security</h2>
          <p className="text-slate-700 leading-relaxed">
            We implement appropriate technical and organizational measures to protect your information 
            from unauthorized access, disclosure, or misuse.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
          <p className="text-slate-700 leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at:{" "}
            <a href="mailto:support@useinvoke.ai" className="text-blue-600 hover:underline">
              support@useinvoke.ai
            </a>
          </p>
        </section>

        <div className="pt-6 border-t border-slate-200">
          <Link href="/terms" className="text-blue-600 hover:underline">
            View Terms of Service
          </Link>
        </div>
      </div>
    </main>
  )
}
