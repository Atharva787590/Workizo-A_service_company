import React, { useState, useMemo } from 'react';
import { ServiceCatalogItem } from '../../types/catalog';
import { formatInr, filterClientCatalog } from '../../lib/catalogEngine';
import { ServiceDetailModal } from './ServiceDetailModal';
import {
  Search,
  Clock,
  Zap,
  Droplets,
  Layers,
  ThermometerSnowflake,
  Truck,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Filter
} from 'lucide-react';

interface ServiceCatalogGridProps {
  initialServices: ServiceCatalogItem[];
  selectedCategory?: string;
  onSelectService?: (service: ServiceCatalogItem) => void;
}

const CATEGORIES = [
  { name: 'All', icon: Filter },
  { name: 'Electrician', icon: Zap },
  { name: 'Plumber', icon: Droplets },
  { name: 'Carpenter', icon: Layers },
  { name: 'AC Technician', icon: ThermometerSnowflake },
  { name: 'Mechanic', icon: Truck },
  { name: 'Home Cleaning', icon: Sparkles },
];

export const ServiceCatalogGrid: React.FC<ServiceCatalogGridProps> = ({
  initialServices,
  selectedCategory = 'All',
  onSelectService,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalService, setActiveModalService] = useState<ServiceCatalogItem | null>(null);

  const filteredServices = useMemo(() => {
    return filterClientCatalog(initialServices, searchQuery, activeCategory);
  }, [initialServices, searchQuery, activeCategory]);

  const handleCardClick = (service: ServiceCatalogItem) => {
    if (onSelectService) {
      onSelectService(service);
    } else {
      setActiveModalService(service);
    }
  };

  return (
    <div className="space-y-6" id="service-catalog-container">
      {/* Search & Category Filter Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search home repairs, electrical, plumbing, AC tune-up, or required skills..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            id="service-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                id={`cat-filter-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Transparent Price Assurance */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
        <span>
          Showing <strong>{filteredServices.length}</strong> transparent cooperative services
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          Zero Middleman Markup Guaranteed
        </span>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            No trade services matched &ldquo;{searchQuery}&rdquo; in category {activeCategory}.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('All');
            }}
            className="mt-3 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              onClick={() => handleCardClick(service)}
              className="group cursor-pointer rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900 transition-all flex flex-col justify-between"
              id={`service-card-${service.id}`}
            >
              <div>
                {/* Header: Category & Duration */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                    {service.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>~{service.typical_duration_minutes}m</span>
                  </div>
                </div>

                {/* Service Title */}
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1.5">
                  {service.name}
                </h3>

                {/* Description snippet */}
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
                  {service.description}
                </p>

                {/* Required Skills Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {service.required_skills.slice(0, 2).map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      {skill}
                    </span>
                  ))}
                  {service.is_restricted && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Restricted
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Price & CTA */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block leading-tight">
                    Estimated Price
                  </span>
                  <span className="text-sm sm:text-base font-black text-gray-900 dark:text-gray-100">
                    {formatInr(service.estimated_base_price)} – {formatInr(service.estimated_max_price)}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={activeModalService}
        isOpen={Boolean(activeModalService)}
        onClose={() => setActiveModalService(null)}
      />
    </div>
  );
};

export default ServiceCatalogGrid;
