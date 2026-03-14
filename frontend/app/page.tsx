'use client';

import { useEffect, useState } from 'react';
import { Calendar, Zap, Target, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">Geodo</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </a>
              <a
                href="/signup"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Your reps spend 90 minutes<br />
            researching every prospect.<br />
            <span className="text-primary-600">Geodo does it in 4 minutes.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Before every sales meeting, Geodo deploys AI agents that research the prospect
            across the live web and deliver a complete intel brief — automatically, with zero effort.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition"
            >
              Get 5 Free Briefs
            </a>
            <a
              href="#demo"
              className="border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-50 transition"
            >
              Watch Demo
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How Geodo Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <Calendar className="h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">1. Auto-Trigger</h3>
            <p className="text-gray-600">
              Connect your calendar. Geodo detects external meetings and triggers
              research automatically — no manual action required.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <Zap className="h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">2. AI Research</h3>
            <p className="text-gray-600">
              OpenClaw agents visit 10 sources: LinkedIn, Crunchbase, G2, News,
              and more — extracting signals in real-time.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <TrendingUp className="h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">3. Brief Delivery</h3>
            <p className="text-gray-600">
              Get a clean, one-page intel brief in Slack or email 30 minutes
              before your meeting — with suggested openers.
            </p>
          </div>
        </div>
      </section>

      {/* Before/After */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Before vs After Geodo</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 border-2 border-red-200 p-8 rounded-xl">
              <h3 className="text-xl font-semibold text-red-900 mb-4">❌ Manual Research</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• 10+ browser tabs open</li>
                <li>• 90 minutes per prospect</li>
                <li>• Inconsistent quality</li>
                <li>• Reps skip it when busy</li>
                <li>• Generic talking points</li>
              </ul>
            </div>
            <div className="bg-green-50 border-2 border-green-200 p-8 rounded-xl">
              <h3 className="text-xl font-semibold text-green-900 mb-4">✅ With Geodo</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Fully automated</li>
                <li>• 4 minutes, every time</li>
                <li>• AI-powered analysis</li>
                <li>• 100% coverage, zero effort</li>
                <li>• Personalized openers</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Signal Examples */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Real Signals Geodo Detects</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary-600">
            <h4 className="font-semibold mb-2">💰 Recent Funding</h4>
            <p className="text-sm text-gray-600">
              "Raised $15M Series A led by Sequoia — 3 weeks ago"
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary-600">
            <h4 className="font-semibold mb-2">📈 Hiring Surge</h4>
            <p className="text-sm text-gray-600">
              "27 open engineering roles — they're building something big"
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary-600">
            <h4 className="font-semibold mb-2">🎯 New CRO</h4>
            <p className="text-sm text-gray-600">
              "Just hired new CRO from Salesforce — new initiatives incoming"
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-4xl font-bold text-primary-600 mb-4">$500<span className="text-lg text-gray-500">/mo</span></p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li>• Up to 5 users</li>
                <li>• 50 briefs/month</li>
                <li>• Slack + Email delivery</li>
              </ul>
              <a href="/signup" className="block text-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition">
                Start Free Trial
              </a>
            </div>
            <div className="bg-primary-600 text-white p-8 rounded-xl shadow-lg transform scale-105">
              <h3 className="text-2xl font-bold mb-2">Growth</h3>
              <p className="text-4xl font-bold mb-4">$2,000<span className="text-lg opacity-80">/mo</span></p>
              <ul className="space-y-2 mb-6">
                <li>• Up to 25 users</li>
                <li>• Unlimited briefs</li>
                <li>• CRM write-back</li>
                <li>• Dashboard + Analytics</li>
              </ul>
              <a href="/signup" className="block text-center bg-white text-primary-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition">
                Start Free Trial
              </a>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h3 className="text-2xl font-bold mb-2">Team</h3>
              <p className="text-4xl font-bold text-primary-600 mb-4">$5,000<span className="text-lg text-gray-500">/mo</span></p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li>• Up to 100 users</li>
                <li>• Custom research depth</li>
                <li>• Priority support</li>
                <li>• SSO</li>
              </ul>
              <a href="/contact" className="block text-center border-2 border-primary-600 text-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 transition">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">
          Ready to eliminate manual research?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Get 5 free briefs for your next 5 meetings — no credit card required.
        </p>
        <a
          href="/signup"
          className="inline-block bg-primary-600 text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition"
        >
          Start Free Trial
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>&copy; 2024 Geodo. AI Revenue Researcher powered by OpenClaw.</p>
        </div>
      </footer>
    </div>
  );
}
