import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white tracking-tight">Invoke</Link>
          <a href="mailto:support@useinvoke.ai" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            support@useinvoke.ai
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            AI-Powered Communication Infrastructure
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Automate voice and messaging workflows with intelligent systems.
          </p>
          <a href="mailto:support@useinvoke.ai" 
             className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-slate-950 bg-white rounded-lg hover:bg-slate-100 transition-colors">
            Contact Us
          </a>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 px-6 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">What We Do</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">AI-driven voice automation</h3>
              <p className="text-slate-400 text-sm">Intelligent voice systems that handle calls, route conversations, and process natural language at scale.</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">SMS and messaging workflow orchestration</h3>
              <p className="text-slate-400 text-sm">End-to-end automation of SMS workflows with intelligent routing and response management.</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Intelligent routing systems</h3>
              <p className="text-slate-400 text-sm">Smart conversation routing that directs messages to appropriate agents or automated responses.</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">API-based communication infrastructure</h3>
              <p className="text-slate-400 text-sm">Developer-friendly APIs for building custom communication automation into your applications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-6 border-t border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Who It's For</h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Invoke is designed for businesses that require scalable and compliant communication automation. Whether you are a growing startup or an established enterprise, our infrastructure provides the reliability and intelligence needed to manage voice and messaging at scale.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <Link href="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
            </div>
            <p className="text-sm text-slate-500">
              <a href="mailto:support@useinvoke.ai" className="hover:text-slate-300 transition-colors">support@useinvoke.ai</a>
            </p>
            <p className="text-sm text-slate-600">
              &copy; 2026 Invoke. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
