import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceCatalogItem, PublicProviderProfile } from '../../types/catalog';
import { formatInr, MANDATORY_PRICING_DISCLAIMER } from '../../lib/catalogEngine';
import { ProviderDiscoveryCard } from './ProviderDiscoveryCard';
import api from '../../services/api';
import {
  X,
  Clock,
  Info,
  CheckCircle,
  AlertTriangle,
  Users,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface ServiceDetailModalProps {
  service: ServiceCatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<PublicProviderProfile[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && service) {
      setLoadingProviders(true);
      api
        .get(`/api/services/providers/?service_id=${service.id}&category=${encodeURIComponent(service.category)}`)
        .then((res) => {
          if (res.data?.providers) {
            setProviders(res.data.providers);
          }
        })
        .catch(() => {
          // Fallback demo providers
          setProviders([
            {
              id: 101,
              display_name: 'Rameshchandra P.',
              avatar_initials: 'RP',
              service_category: service.category,
              approximate_area: 'Ahmedabad, Gujarat',
              years_of_experience: 6,
              rating: 4.9,
              review_count: 48,
              is_verified: true,
              cooperative_tier: 'Master Craftsman',
              verified_skills: service.required_skills,
              verified_certifications_count: 2,
              online_status: true,
            },
            {
              id: 102,
              display_name: 'Suresh K.',
              avatar_initials: 'SK',
              service_category: service.category,
              approximate_area: 'Ahmedabad, Gujarat',
              years_of_experience: 4,
              rating: 4.85,
              review_count: 31,
              is_verified: true,
              cooperative_tier: 'Skilled Craftsman',
              verified_skills: service.required_skills.slice(0, 1),
              verified_certifications_count: 1,
              online_status: true,
            },
          ]);
        })
        .finally(() => setLoadingProviders(false));
    }
  }, [isOpen, service]);

  if (!isOpen || !service) return null;

  const handleBookService = () => {
    onClose();
    navigate(`/customer/book?category=${encodeURIComponent(service.category)}&service=${service.id}`);
  };

  const handleSelectProvider = (provider: PublicProviderProfile) => {
    onClose();
    navigate(
      `/customer/book?category=${encodeURIComponent(service.category)}&service=${service.id}&worker_id=${provider.id}`
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-modal-title"
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden my-6">
        {/* Header banner */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-indigo-50/40 dark:from-gray-900 dark:to-indigo-950/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                {service.category}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                ~{service.typical_duration_minutes} mins typical
              </span>
              {service.is_restricted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Restricted Task
                </span>
              )}
            </div>
            <h2 id="service-modal-title" className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
              {service.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close dialog"
            id="close-service-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Service Description */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Scope of Work</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {service.description}
            </p>
          </div>

          {/* Pricing breakdown card */}
          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
              <div>
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  Estimated Transparent Pricing
                </span>
                <div className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-0.5">
                  {formatInr(service.estimated_base_price)} – {formatInr(service.estimated_max_price)}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                0% Platform Commission
              </span>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              <strong className="text-gray-800 dark:text-gray-200">Pricing Guidance:</strong> {service.pricing_guidance}
            </p>

            {/* Mandatory pricing disclaimer */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/80 dark:bg-gray-900/80 border border-indigo-200/60 dark:border-indigo-800/40 text-[11px] text-gray-600 dark:text-gray-400">
              <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span>{MANDATORY_PRICING_DISCLAIMER}</span>
            </div>
          </div>

          {/* Required Skills & Qualifications */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Required Trade Skills & Minimum Qualification
            </h3>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300">
                Minimum Level: {service.required_certification_level}
              </span>
              {service.required_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  {skill}
                </span>
              ))}
            </div>
            {service.is_restricted && (
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                ⚠️ Restricted task: This specialized service strictly requires an unexpired, verified Skill India / NCVT certification. Workers lacking verification are automatically excluded.
              </p>
            )}
          </div>

          {/* Nearby Eligible Providers Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Verified Nearby Artisans for this Service
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {providers.length} available
              </span>
            </div>

            {loadingProviders ? (
              <div className="py-6 text-center text-xs text-gray-500 animate-pulse">
                Finding verified nearby cooperative craftsmen...
              </div>
            ) : providers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {providers.slice(0, 2).map((prov) => (
                  <ProviderDiscoveryCard
                    key={prov.id}
                    provider={prov}
                    serviceId={service.id}
                    onSelect={handleSelectProvider}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 py-3">
                Verified guild members ready for assignment upon booking.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Payment settled directly with artisan upon verified completion.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full sm:w-auto"
            >
              Back to Catalog
            </button>
            <button
              onClick={handleBookService}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto active:scale-95"
              id="book-service-now-cta"
            >
              Proceed to Book Service
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailModal;
