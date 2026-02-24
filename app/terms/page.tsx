import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service - Invoke AI',
  description: 'Invoke AI Terms of Service - Terms and conditions for our SMS conversational assistant service.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-slate-500 mb-8">Effective Date: February 23, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Program Description</h2>
          <p className="text-slate-700 leading-relaxed">
            <strong>Invoke AI</strong> is a conversational SMS service that provides assistance with tasks, 
            reminders, planning, and coordination. Users can interact with our AI assistant via text message 
            to receive help with daily organization and task management.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Opt-In</h2>
          <p className="text-slate-700 leading-relaxed">
            By using Invoke AI, you agree to receive text messages from our service. You can opt in by 
            texting our number directly or providing your phone number through our registration process. 
            You must be the authorized user of the phone number provided.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Message Frequency</h2>
          <p className="text-slate-700 leading-relaxed">
            Message frequency varies based on your usage and interaction with the service. 
            You will receive messages when you initiate conversations or when our system 
            sends relevant responses to your requests.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Message and Data Rates</h2>
          <p className="text-slate-700 leading-relaxed">
            Message and data rates may apply depending on your mobile carrier and plan. 
            Standard messaging rates apply to all messages sent and received. 
            Please consult your wireless carrier for details on your messaging plan.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Opt-Out and Help</h2>
          <p className="text-slate-700 mb-3 leading-relaxed">
            You can control your participation in our SMS service at any time:
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4 leading-relaxed">
            <li><strong>STOP:</strong> Reply STOP at any time to cancel and stop receiving messages.</li>
            <li><strong>HELP:</strong> Reply HELP for assistance or to contact support.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Carrier Liability</h2>
          <p className="text-slate-700 leading-relaxed">
            Carriers are not liable for delayed or undelivered messages. Message delivery 
            is subject to your carrier&apos;s network availability and coverage.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Acceptable Use</h2>
          <p className="text-slate-700 leading-relaxed">
            You agree to use Invoke AI only for lawful purposes and in accordance with these Terms. 
            You may not use the service to send spam, harass others, or transmit illegal content. 
            We reserve the right to terminate access for violations of these terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
          <p className="text-slate-700 leading-relaxed">
            If you have any questions about these Terms of Service, please contact us at:{" "}
            <a href="mailto:support@useinvoke.ai" className="text-blue-600 hover:underline">
              support@useinvoke.ai
            </a>
          </p>
        </section>

        <div className="pt-6 border-t border-slate-200">
          <Link href="/privacy" className="text-blue-600 hover:underline">
            View Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  )
}
