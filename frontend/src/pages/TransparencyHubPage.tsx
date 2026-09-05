import React, { useState, useEffect } from 'react';
import { TransparencyMetrics } from '../types/catalog';
import { TransparencyMetricsCards } from '../components/catalog/TransparencyMetricsCards';
import { CooperativePrinciplesCard } from '../components/catalog/CooperativePrinciplesCard';
import { SocialSecurityTrackerCard } from '../components/catalog/SocialSecurityTrackerCard';
import { FALLBACK_TRANSPARENCY_METRICS } from '../lib/catalogEngine';
import api from '../services/api';
import { ShieldCheck, Scale, HeartHandshake, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TransparencyHubPage: React.FC = () => {
  const [metrics, setMetrics] = useState<TransparencyMetrics>(FALLBACK_TRANSPARENCY_METRICS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/api/services/transparency/metrics/')
      .then((res) => {
        if (res.data?.metrics) {
          setMetrics(res.data.metrics);
        }
      })
      .catch((err) => {
        console.warn('Using fallback transparency metrics:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Public Service Catalog
          </Link>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40">
            <ShieldCheck className="w-3.5 h-3.5" />
            Public Audit Transparency
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
            <Scale className="w-3.5 h-3.5" />
            UNNATI Cooperative Transparency Hub
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Democracy, Fair Wages & Zero Platform Exploitation
          </h1>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            UNNATI is built on a cooperative covenant: workers are co-owners, payments are 100% direct,
            algorithms are fully transparent, and platform commission is strictly <strong>0.00%</strong>.
          </p>
        </div>

        {loading && (
          <div className="text-center py-2 text-xs text-gray-400 animate-pulse">
            Fetching latest community audit telemetry...
          </div>
        )}

        {/* Aggregate Transparency Metrics */}
        <TransparencyMetricsCards metrics={metrics} />

        {/* Cooperative Charter & Governance Principles */}
        <CooperativePrinciplesCard />

        {/* Social Security & Insurance Public Coverage Overview */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-indigo-600" />
                Cooperative Social Security & Mutual Aid Framework
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                How UNNATI facilitates verified government social security for gig workers without fabricating coverage.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full">
              89.4% Member Coverage Rate
            </span>
          </div>

          <SocialSecurityTrackerCard readOnly={true} />
        </div>

        {/* Bottom Call to Action */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-gray-950 text-white text-center space-y-4 shadow-xl">
          <h3 className="text-xl sm:text-2xl font-black">
            Ready to Support Worker-Owned Trade Cooperatives?
          </h3>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl mx-auto leading-relaxed">
            Every booking you make directly enriches skilled artisans in your community without predatory corporate middleman markups.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <Link
              to="/services"
              className="px-6 py-2.5 rounded-xl bg-white text-indigo-950 hover:bg-gray-100 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Browse Public Services
            </Link>
            <Link
              to="/customer/login"
              className="px-6 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-xs transition-all active:scale-95 border border-indigo-700"
            >
              Book a Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransparencyHubPage;
