import React, { useState, useEffect } from 'react';
import { ServiceCatalogItem } from '../types/catalog';
import { ServiceCatalogGrid } from '../components/catalog/ServiceCatalogGrid';
import { FALLBACK_CATALOG_ITEMS, MANDATORY_PRICING_DISCLAIMER } from '../lib/catalogEngine';
import api from '../services/api';
import { ShieldCheck, Info, Sparkles, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PublicServiceCatalogPage: React.FC = () => {
  const [services, setServices] = useState<ServiceCatalogItem[]>(FALLBACK_CATALOG_ITEMS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/api/services/catalog/')
      .then((res) => {
        if (res.data?.results && Array.isArray(res.data.results) && res.data.results.length > 0) {
          setServices(res.data.results);
        }
      })
      .catch((err) => {
        console.warn('Using local fallback catalog:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
            <Sparkles className="w-3.5 h-3.5" />
            UNNATI Cooperative Public Service Directory
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Fair-Wage Home & Trade Services
          </h1>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            Browse verified electrical, plumbing, carpentry, AC, mechanic, and cleaning services.
            Every booking supports local tradespeople with <strong>100% direct payment</strong> and <strong>0% platform cut</strong>.
          </p>
        </div>

        {/* Pricing Transparency & Transparency Hub Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/30 border border-indigo-100/80 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-700 dark:text-gray-300">
              <span className="font-bold text-gray-900 dark:text-gray-100 block">
                Estimated Pricing Guidance:
              </span>
              {MANDATORY_PRICING_DISCLAIMER}
            </div>
          </div>

          <Link
            to="/transparency"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors shrink-0 shadow-sm"
          >
            <HeartHandshake className="w-4 h-4" />
            Explore Transparency Hub
          </Link>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-4 text-xs text-gray-400 animate-pulse">
            Syncing catalog with cooperative registry...
          </div>
        )}

        {/* Main Service Catalog Grid */}
        <ServiceCatalogGrid initialServices={services} />

        {/* Footer Guarantee */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Guaranteed zero platform middleman fees • Cooperative audited skills</span>
          </div>
          <Link to="/home" className="hover:underline font-semibold">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PublicServiceCatalogPage;
