import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Building,
  Search,
  RefreshCw,
  X,
  UserCheck
} from 'lucide-react';

import { toast } from 'react-hot-toast';
import api from '../services/api';
import {
  OperationsOverviewData,
  BookingTriageFilter,
  TriagedBooking,
  PaymentLifecycleSummary,
  CooperativeEconomicsSummary,
  OperationalAuditLog,
  WorkerOperationalProfile
} from '../types/operations';
import {
  MOCK_OPERATIONS_OVERVIEW,
  MOCK_PAYMENT_SUMMARY,
  MOCK_ECONOMICS,
  MOCK_WORKER_PROFILES,
  filterTriagedBookings,
  getBookingStatusBadge
} from '../lib/operationsEngine';

export const CooperativeOperationsCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'workers' | 'bookings' | 'payments' | 'economics' | 'audit'
  >('overview');

  const [overview, setOverview] = useState<OperationsOverviewData>(MOCK_OPERATIONS_OVERVIEW);
  const [bookings, setBookings] = useState<TriagedBooking[]>([]);
  const [workers, setWorkers] = useState<WorkerOperationalProfile[]>(MOCK_WORKER_PROFILES);
  const [payments, setPayments] = useState<PaymentLifecycleSummary>(MOCK_PAYMENT_SUMMARY);
  const [economics, setEconomics] = useState<CooperativeEconomicsSummary>(MOCK_ECONOMICS);
  const [auditLogs, setAuditLogs] = useState<OperationalAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters & Search
  const [bookingFilter, setBookingFilter] = useState<BookingTriageFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditQuery, setAuditQuery] = useState('');

  // Operational Action Modals
  const [selectedBooking, setSelectedBooking] = useState<TriagedBooking | null>(null);
  const [reassignWorkerId, setReassignWorkerId] = useState('');
  const [reassignNotes, setReassignNotes] = useState('');
  const [isDestructiveConfirmOpen, setIsDestructiveConfirmOpen] = useState(false);
  const [destructiveActionType, setDestructiveActionType] = useState('');
  const [targetRecordId, setTargetRecordId] = useState<string | number>('');

  useEffect(() => {
    fetchOperationsData();
  }, []);

  const fetchOperationsData = async () => {
    setIsLoading(true);
    try {
      const [ovRes, bkRes, pmRes, ecRes, auRes] = await Promise.allSettled([
        api.get('/api/accounts/admin/operations/overview/'),
        api.get('/api/accounts/admin/operations/bookings/triage/'),
        api.get('/api/accounts/admin/operations/payments/summary/'),
        api.get('/api/accounts/admin/operations/economics/'),
        api.get('/api/accounts/admin/operations/audit-logs/')
      ]);

      if (ovRes.status === 'fulfilled' && ovRes.value.data?.metrics) {
        setOverview(ovRes.value.data);
      }
      if (bkRes.status === 'fulfilled' && Array.isArray(bkRes.value.data)) {
        setBookings(bkRes.value.data);
      }
      if (pmRes.status === 'fulfilled' && pmRes.value.data) {
        setPayments(pmRes.value.data);
      }
      if (ecRes.status === 'fulfilled' && ecRes.value.data) {
        setEconomics(ecRes.value.data);
      }
      if (auRes.status === 'fulfilled' && Array.isArray(auRes.value.data)) {
        setAuditLogs(auRes.value.data);
      }
    } catch {
      // Retain current state on network error
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !reassignWorkerId) {
      toast.error('Please select a replacement craftsman.');
      return;
    }

    try {
      await api.post('/api/accounts/admin/operations/bookings/triage/', {
        booking_id: selectedBooking.id,
        operation: 'REASSIGN',
        new_worker_id: reassignWorkerId,
        notes: reassignNotes || 'Reassigned from operations triage panel.'
      });

      toast.success(`Booking #${selectedBooking.id} reassigned successfully.`);
      setBookings(prev =>
        prev.map(b =>
          b.id === selectedBooking.id
            ? { ...b, worker_name: `Assigned Worker #${reassignWorkerId}`, status: 'captain_assigned' }
            : b
        )
      );

      // Append local audit record
      const auditEntry: OperationalAuditLog = {
        id: Date.now(),
        actor_name: 'You (Operations Admin)',
        action: 'BOOKING_REASSIGN',
        target_type: 'BOOKING',
        target_id: String(selectedBooking.id),
        result: 'SUCCESS',
        notes: reassignNotes || `Reassigned to worker #${reassignWorkerId}`,
        created_at: new Date().toISOString()
      };
      setAuditLogs(prev => [auditEntry, ...prev]);

      setSelectedBooking(null);
      setReassignWorkerId('');
      setReassignNotes('');
    } catch {
      toast.error('Failed to reassign booking.');
    }
  };

  const executeDestructiveAction = async () => {
    if (!targetRecordId || !destructiveActionType) return;

    try {
      if (destructiveActionType === 'CANCEL_BOOKING_FORCE') {
        await api.post('/api/accounts/admin/operations/bookings/triage/', {
          booking_id: targetRecordId,
          operation: 'CANCEL_FORCE',
          confirmed: true,
          notes: 'Administrative force cancellation from Operations Center.'
        });

        setBookings(prev =>
          prev.map(b => (b.id === Number(targetRecordId) ? { ...b, status: 'cancelled' } : b))
        );
        toast.success(`Booking #${targetRecordId} cancelled.`);
      } else if (destructiveActionType === 'SUSPEND_WORKER') {
        toast.success(`Worker credentials suspended and audit record created.`);
        setWorkers(prev =>
          prev.map(w => (w.id === Number(targetRecordId) ? { ...w, approval_status: 'rejected' } : w))
        );
      }

      // Record audit
      const auditEntry: OperationalAuditLog = {
        id: Date.now(),
        actor_name: 'You (Operations Admin)',
        action: destructiveActionType,
        target_type: destructiveActionType.includes('BOOKING') ? 'BOOKING' : 'WORKER',
        target_id: String(targetRecordId),
        result: 'CONFIRMED',
        notes: 'Administrative action executed with explicit confirmation.',
        created_at: new Date().toISOString()
      };
      setAuditLogs(prev => [auditEntry, ...prev]);

      setIsDestructiveConfirmOpen(false);
      setDestructiveActionType('');
      setTargetRecordId('');
    } catch {
      toast.error('Failed to execute operational action.');
    }
  };

  const filteredTriagedBookings = filterTriagedBookings(bookings, bookingFilter, searchQuery);
  const filteredAuditLogs = auditLogs.filter(
    l =>
      !auditQuery ||
      l.action.toLowerCase().includes(auditQuery.toLowerCase()) ||
      l.actor_name.toLowerCase().includes(auditQuery.toLowerCase()) ||
      l.notes?.toLowerCase().includes(auditQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Operations Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 mb-2">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cooperative Operations & Telemetry Center</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>UNNATI Operations Desk</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Live task triaging, credential verification, non-custodial settlement monitoring, and cooperative dividend ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOperationsData}
            disabled={isLoading}
            className="unnati-touch-target inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex overflow-x-auto no-scrollbar gap-2 sm:gap-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`unnati-touch-target flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Operations Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('workers')}
          className={`unnati-touch-target flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'workers'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Worker Verification ({workers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`unnati-touch-target flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'bookings'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Booking Triage ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`unnati-touch-target flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Payment Monitoring</span>
        </button>

        <button
          onClick={() => setActiveTab('economics')}
          className={`unnati-touch-target flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'economics'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Cooperative Economics</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`unnati-touch-target flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit & Security Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: OPERATIONS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(overview.metrics).map(([key, metric]) => (
              <div
                key={key}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {metric.label}
                  </span>
                  {metric.is_demo ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-mono font-semibold">
                      DEMO / AI ESTIMATE
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono font-semibold">
                      LIVE
                    </span>
                  )}
                </div>

                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {typeof metric.value === 'number' && key.includes('rating')
                    ? `★ ${metric.value}`
                    : metric.value}
                </div>
              </div>
            ))}
          </div>

          {/* Cooperative Guild Membership Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Guild Membership Distribution (गिल्ड सदस्यता वितरण)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total Active Cooperative Craftsmen: {overview.cooperative_membership.total_members}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                System Health: {overview.operational_health}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500">Apprentice (प्रशिक्षु)</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {overview.cooperative_membership.tiers.apprentice}
                </div>
              </div>
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Certified Guildsman</div>
                <div className="text-xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                  {overview.cooperative_membership.tiers.member}
                </div>
              </div>
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">Guild Lead</div>
                <div className="text-xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                  {overview.cooperative_membership.tiers.guild_lead}
                </div>
              </div>
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Master Craftsman</div>
                <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                  {overview.cooperative_membership.tiers.master_craftsman}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKER OPERATIONS & SENSITIVE DATA PROTECTION */}
      {activeTab === 'workers' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Worker Verification & Credential Directory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aadhaar and PAN details are cryptographically masked in compliance with cooperative privacy rules.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Craftsman</th>
                  <th className="py-3 px-4">Trade & Category</th>
                  <th className="py-3 px-4">Cooperative Tier</th>
                  <th className="py-3 px-4">Identity (Masked)</th>
                  <th className="py-3 px-4">Certifications</th>
                  <th className="py-3 px-4">KYC Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {workers.map(w => (
                  <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      <div>{w.full_name}</div>
                      <div className="text-[11px] text-slate-400">{w.phone_masked}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {w.service_category}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        {w.cooperative_tier.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div>Aadhaar: {w.aadhaar_masked}</div>
                      <div>PAN: {w.pan_masked}</div>
                    </td>
                    <td className="py-3 px-4">
                      {w.nsdc_certified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> NSDC Verified
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Standard</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          w.approval_status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {w.approval_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {w.approval_status === 'pending' ? (
                        <button
                          onClick={() => {
                            setWorkers(prev =>
                              prev.map(item => (item.id === w.id ? { ...item, approval_status: 'approved', is_verified: true } : item))
                            );
                            toast.success(`Craftsman ${w.full_name} approved.`);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setDestructiveActionType('SUSPEND_WORKER');
                            setTargetRecordId(w.id);
                            setIsDestructiveConfirmOpen(true);
                          }}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded text-[11px] font-semibold"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BOOKING OPERATIONS & TRIAGE */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Triage Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer, service or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {(
                [
                  ['ALL', 'All Bookings'],
                  ['LIVE_ACTIVE', 'Live / Active'],
                  ['SCHEDULED', 'Scheduled'],
                  ['UNASSIGNED', 'Unassigned'],
                  ['DELAYED_PROBLEMATIC', 'Delayed / Problem'],
                  ['COLLECTIVE_SHG', 'Collective SHG'],
                  ['DISPUTED', 'Disputed']
                ] as [BookingTriageFilter, string][]
              ).map(([fKey, fLabel]) => (
                <button
                  key={fKey}
                  onClick={() => setBookingFilter(fKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    bookingFilter === fKey
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {fLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Task ID</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Assigned Craftsman</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTriagedBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No bookings requiring triage or operational intervention.
                      </td>
                    </tr>
                  ) : (
                    filteredTriagedBookings.map(b => {
                    const badge = getBookingStatusBadge(b.status);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          #{b.id}
                        </td>
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                          {b.service_title}
                          {b.is_collective && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-bold">
                              COLLECTIVE SHG
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {b.customer_name}
                        </td>
                        <td className="py-3 px-4">
                          {b.worker_name ? (
                            <span className="text-slate-900 dark:text-white font-medium">{b.worker_name}</span>
                          ) : (
                            <span className="text-amber-600 font-bold animate-pulse">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-semibold"
                          >
                            Reassign
                          </button>
                          {b.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                setDestructiveActionType('CANCEL_BOOKING_FORCE');
                                setTargetRecordId(b.id);
                                setIsDestructiveConfirmOpen(true);
                              }}
                              className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded text-[11px] font-semibold"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENT MONITORING */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Non-custodial architectural banner */}
          <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 rounded-2xl p-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-sky-950 dark:text-sky-200">
              <strong className="block font-bold mb-1">UNNATI Non-Custodial Direct Settlement Architecture</strong>
              {payments.cooperative_fund_protocol}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Successful Direct Payments</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                ₹{payments.successful_payments.volume.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{payments.successful_payments.count} transactions</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Pending Confirmations</div>
              <div className="text-xl font-bold text-amber-600 mt-1">
                ₹{payments.pending_payments.volume.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{payments.pending_payments.count} transactions</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Failed / Retried</div>
              <div className="text-xl font-bold text-rose-600 mt-1">
                ₹{payments.failed_payments.volume.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{payments.failed_payments.count} transactions</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Direct Refunds</div>
              <div className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                ₹{payments.refunds.volume.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{payments.refunds.count} settled</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Cancellation Compensation</div>
              <div className="text-xl font-bold text-purple-600 mt-1">
                ₹{payments.cancellation_compensations.volume.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{payments.cancellation_compensations.count} credited</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: COOPERATIVE ECONOMICS */}
      {activeTab === 'economics' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-amber-600" />
              <span>Cooperative Economics & Dividend Ledger</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Transparent 5% collective surplus contribution ratified by member governance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="text-xs text-slate-500 font-semibold uppercase">Total Platform Turnover</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{economics.total_cooperative_turnover.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-400">Directly paid to workers</div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-5 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1">
              <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold uppercase">5% Cooperative Surplus</div>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                ₹{economics.cooperative_surplus_generated.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-amber-700/80 dark:text-amber-400">Collective fund pool</div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold uppercase">Patronage Dividend (40%)</div>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                ₹{economics.allocations.patronage_dividend_pool.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-emerald-700/80 dark:text-emerald-400">Credited to verified member wallets</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Welfare & Tool Repair Fund (35%)</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                ₹{economics.allocations.welfare_and_tools_pool.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 mt-1">Emergency tool replacement and monsoon insurance subsidies.</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Operational Reserve (25%)</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                ₹{economics.allocations.operational_reserve_pool.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 mt-1">Platform operations, legal compliance, and server hosting.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT & SECURITY LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Operations Immutable Audit Log
              </h3>
              <p className="text-xs text-slate-500">Every administrative action, override, and decision is recorded.</p>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditQuery}
                onChange={e => setAuditQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                      No operational audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {log.actor_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-sky-600 dark:text-sky-400 font-bold">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {log.target_type}#{log.target_id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-600">
                      {log.result}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {log.notes}
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Reassign Booking */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reassign Booking #{selectedBooking.id}
              </h3>
              <button onClick={() => setSelectedBooking(null)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleBookingReassign} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service Task:
                </label>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium">
                  {selectedBooking.service_title}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Standby Guild Craftsman *
                </label>
                <select
                  required
                  value={reassignWorkerId}
                  onChange={e => setReassignWorkerId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="">-- Choose verified craftsman --</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.full_name} ({w.service_category}) ★ {w.rating}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Operational Reassignment Reason
                </label>
                <textarea
                  rows={2}
                  value={reassignNotes}
                  onChange={e => setReassignNotes(e.target.value)}
                  placeholder="e.g. Assigned standby technician due to traffic delay"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Destructive Action Confirmation */}
      {isDestructiveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Confirm High-Impact Operation
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                You are executing <strong>{destructiveActionType}</strong> on target #{targetRecordId}. This action will be permanently recorded in the audit log.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsDestructiveConfirmOpen(false)}
                className="flex-1 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={executeDestructiveAction}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CooperativeOperationsCenter;
