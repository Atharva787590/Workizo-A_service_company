import React from 'react';
import {
  ShieldCheck,
  Scale,
  Calculator,
  Coins,
  FileCheck,
  Users2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export const CooperativePrinciplesCard: React.FC = () => {
  const principles = [
    {
      icon: Users2,
      title: '100% Worker-Owned Cooperative Guild',
      badge: 'Ownership',
      color: 'indigo',
      desc: 'Unlike conventional gig aggregator apps that treat workers as expendable independent contractors, UNNATI operates as a registered worker cooperative. Every verified tradesperson holds democratic equity and one-member-one-vote rights.',
    },
    {
      icon: Coins,
      title: 'Direct Customer-to-Worker Settlement',
      badge: 'Zero Escrow',
      color: 'emerald',
      desc: 'All customer payments flow directly to the provider via UPI or cash upon work completion. UNNATI holds strictly ₹0.00 in platform escrow, charges 0% commission, and never freezes worker funds.',
    },
    {
      icon: Calculator,
      title: 'Algorithmic Fair-Wage Formula',
      badge: 'Fair Price',
      color: 'blue',
      desc: 'Service rates are generated using transparent factors: Base Diagnostic Labor + (Duration × Hourly Rate) + Skill Tier Allowance + Travel Distance Coefficient. No algorithmic surge pricing or predatory discounts.',
    },
    {
      icon: Scale,
      title: 'Democratic Patronage Dividends',
      badge: 'Profit-Sharing',
      color: 'amber',
      desc: 'A transparent 5% cooperative allocation from contracts is directed into a member-controlled mutual welfare fund. Surplus funds are redistributed annually to members in proportion to their cooperative patronage.',
    },
    {
      icon: FileCheck,
      title: 'Booking & Cancellation Safeguards',
      badge: 'Fair Travel',
      color: 'rose',
      desc: 'Customers enjoy free cancellation within 15 minutes or before technician dispatch. If cancelled after arrival, fair travel compensation is guaranteed to respect the worker’s fuel and travel time.',
    },
    {
      icon: ShieldCheck,
      title: 'Rigorous 4-Tier Verification',
      badge: 'Integrity',
      color: 'purple',
      desc: 'Identity, police clearance, Skill India/NSDC vocational credentials, and peer endorsements are audited through multi-party verification. We never fabricate certificates, claims, or government badges.',
    },
  ];

  return (
    <div className="space-y-6" id="cooperative-principles-section">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
            Cooperative Transparency Charter
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Public operational standards, pricing ethics, and member protections governing the UNNATI network.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {principles.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {item.badge}
                  </span>
                </div>

                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-2">
                  {item.title}
                </h4>

                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                Guaranteed by Cooperative Bylaws
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification Methodology Deep Dive */}
      <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-3">
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          How We Verify Tradespeople & Prevent Fake Qualifications
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800">
            <span className="font-bold text-indigo-600 block mb-1">Tier 1: Identity</span>
            <p className="text-gray-600 dark:text-gray-400">
              Aadhaar e-KYC readiness and legal photo identification verified directly.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800">
            <span className="font-bold text-indigo-600 block mb-1">Tier 2: Background</span>
            <p className="text-gray-600 dark:text-gray-400">
              State police clearance certificate and local neighborhood character verification.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800">
            <span className="font-bold text-indigo-600 block mb-1">Tier 3: Vocational</span>
            <p className="text-gray-600 dark:text-gray-400">
              Skill India, NSDC, ITI, or State Skill Mission trade certification audit with auto-expiry.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800">
            <span className="font-bold text-indigo-600 block mb-1">Tier 4: Guild Vouching</span>
            <p className="text-gray-600 dark:text-gray-400">
              Senior guild peers test on-site competence before certified job dispatch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CooperativePrinciplesCard;
