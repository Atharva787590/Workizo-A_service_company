import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicProviderProfile } from '../../types/catalog';
import { ShieldCheck, Star, Clock, MapPin, Award, CheckCircle } from 'lucide-react';

interface ProviderDiscoveryCardProps {
  provider: PublicProviderProfile;
  serviceId?: number;
  onSelect?: (provider: PublicProviderProfile) => void;
}

export const ProviderDiscoveryCard: React.FC<ProviderDiscoveryCardProps> = ({
  provider,
  onSelect,
}) => {
  const navigate = useNavigate();

  const handleBook = () => {
    if (onSelect) {
      onSelect(provider);
    } else {
      navigate(`/customer/book?worker_id=${provider.id}`);
    }
  };

  return (
    <div
      className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
      id={`provider-card-${provider.id}`}
    >
      <div>
        {/* Header with avatar, name, and cooperative tier */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center font-bold text-base shadow-sm ring-2 ring-indigo-100 dark:ring-indigo-900/50">
              {provider.avatar_initials}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight">
                  {provider.display_name}
                </h4>
                {provider.is_verified && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    title="Cooperative Verified Craftsman"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                <Award className="w-3 h-3" />
                {provider.cooperative_tier} • {provider.service_category}
              </p>
            </div>
          </div>

          {/* Online status indicator */}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              provider.online_status
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                provider.online_status ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            {provider.online_status ? 'Available' : 'Busy'}
          </span>
        </div>

        {/* Rating, Experience, and Locality */}
        <div className="grid grid-cols-3 gap-2 py-2 mb-3 border-y border-gray-100 dark:border-gray-800/80 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-sm font-bold text-gray-900 dark:text-gray-100">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {provider.rating.toFixed(1)}
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              ({provider.review_count} ratings)
            </span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-sm font-bold text-gray-900 dark:text-gray-100">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              {provider.years_of_experience} yrs
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Experience</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{provider.approximate_area.split(',')[0]}</span>
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Locality</span>
          </div>
        </div>

        {/* Verified skills tags */}
        {provider.verified_skills.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Verified Competencies
            </p>
            <div className="flex flex-wrap gap-1.5">
              {provider.verified_skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  {skill}
                </span>
              ))}
              {provider.verified_skills.length > 3 && (
                <span className="text-xs text-gray-400 self-center">
                  +{provider.verified_skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Booking CTA */}
      <button
        onClick={handleBook}
        className="w-full mt-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
        id={`book-provider-btn-${provider.id}`}
      >
        Select for Booking
      </button>
    </div>
  );
};

export default ProviderDiscoveryCard;
