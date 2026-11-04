import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, XCircle, RefreshCw,
  Search, Filter, Clock, DollarSign, ArrowRight, UserCheck,
  CreditCard, RotateCcw, FileText, Check, X, Shield, Lock,
  ChevronRight, Calendar, Info, Layers
} from 'lucide-react';
import {
  getAdminDisputes, getSettlementDetail, resolveDispute,
  getAdminWithdrawals, approveWithdrawal, rejectWithdrawal,
  getAdminRefunds, approveRefund, rejectRefund, reconcileRefund,
  extractDataList
} from '../../api';
import { DisputeItem, SettlementDetail, RefundItem } from '../../types';
import {
  Card, CardHeader, CardTitle, CardContent, Badge, Button,
  StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState, Modal, ConfirmDialog
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

type ActiveTab = 'disputes' | 'withdrawals' | 'refunds';

export default function SettlementsPage() {
  const { admin, hasPermission } = useAuth();
  const isSuperAdmin = admin?.role === 'super_admin';
  const isAdminOrSuper = admin?.role === 'super_admin' || (admin?.role as any) === 'admin' || hasPermission('payments');

  const [activeTab, setActiveTab] = useState<ActiveTab>('disputes');

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. DISPUTES QUEUE STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [disputeHoldFilter, setDisputeHoldFilter] = useState<'all' | 'holds'>('all');
  const [disputeSearch, setDisputeSearch] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);

  // Settlement Evidence Modal
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidence, setEvidence] = useState<SettlementDetail | null>(null);

  // Resolution Action Modals
  const [resolveActionModal, setResolveActionModal] = useState<{
    bookingId: string;
    action: 'RELEASE_TO_COACH' | 'REFUND_TO_CUSTOMER';
    reason: string;
    policyReference: string;
  } | null>(null);
  const [resolving, setResolving] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. WITHDRAWALS REVIEW STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<string>('pending');
  const [withdrawalActionModal, setWithdrawalActionModal] = useState<{
    id: string;
    action: 'approve' | 'reject';
    remarks: string;
    coachName?: string;
    amount?: number;
  } | null>(null);
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. REFUND OPERATIONS STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [refundStatusFilter, setRefundStatusFilter] = useState<string>('all');
  const [refundActionModal, setRefundActionModal] = useState<{
    id: string;
    action: 'approve' | 'reject' | 'reconcile';
    reason?: string;
    gatewayRef?: string;
    notes?: string;
  } | null>(null);
  const [processingRefund, setProcessingRefund] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // LOADERS
  // ─────────────────────────────────────────────────────────────────────────────
  const loadDisputes = useCallback(async () => {
    try {
      setLoadingDisputes(true);
      const params: Record<string, any> = { page: 1, limit: 50 };
      if (disputeHoldFilter === 'holds') {
        params.financialHold = true;
      }
      const res = await getAdminDisputes(params);
      const list = extractDataList<DisputeItem>(res);
      setDisputes(list);
    } catch (err) {
      console.warn('Failed to load disputes queue:', err);
      setDisputes([]);
    } finally {
      setLoadingDisputes(false);
    }
  }, [disputeHoldFilter]);

  const loadWithdrawals = useCallback(async () => {
    try {
      setLoadingWithdrawals(true);
      const params: Record<string, any> = {};
      if (withdrawalStatusFilter && withdrawalStatusFilter !== 'all') {
        params.status = withdrawalStatusFilter;
      }
      const res = await getAdminWithdrawals(params);
      const list = extractDataList(res);
      setWithdrawals(list);
    } catch (err) {
      console.warn('Failed to load coach withdrawals:', err);
      setWithdrawals([]);
    } finally {
      setLoadingWithdrawals(false);
    }
  }, [withdrawalStatusFilter]);

  const loadRefunds = useCallback(async () => {
    try {
      setLoadingRefunds(true);
      const params: Record<string, any> = { sourceType: 'SESSION' };
      if (refundStatusFilter && refundStatusFilter !== 'all') {
        params.status = refundStatusFilter;
      }
      const res = await getAdminRefunds(params);
      const list = extractDataList<RefundItem>(res);
      setRefunds(list);
    } catch (err) {
      console.warn('Failed to load refunds:', err);
      setRefunds([]);
    } finally {
      setLoadingRefunds(false);
    }
  }, [refundStatusFilter]);

  useEffect(() => {
    if (activeTab === 'disputes') loadDisputes();
    else if (activeTab === 'withdrawals') loadWithdrawals();
    else if (activeTab === 'refunds') loadRefunds();
  }, [activeTab, loadDisputes, loadWithdrawals, loadRefunds]);

  // Open Settlement Evidence Detail Modal
  const openSettlementDetail = async (dispute: DisputeItem) => {
    setSelectedDispute(dispute);
    setEvidenceModalOpen(true);
    setEvidenceLoading(true);
    const bookingId = dispute.bookingId || dispute.id || dispute._id || '';

    try {
      const res = await getSettlementDetail(bookingId);
      const detail = res?.data || res?.settlement || res;
      setEvidence(detail);
    } catch (err: any) {
      console.warn('Failed to load settlement detail:', err);
      // Fallback detail from dispute row
      setEvidence({
        bookingId,
        grossPaid: dispute.grossPaid ?? dispute.amount ?? 0,
        platformCommission: dispute.commission ?? 0,
        coachNetAmount: dispute.coachNetAmount ?? (dispute.amount ? Math.round(dispute.amount * 0.85) : 0),
        disputeStatus: dispute.status,
        financialHold: dispute.financialHold,
        customerComplaints: dispute.complaint ? [{ text: dispute.complaint }] : dispute.reason ? [{ text: dispute.reason }] : []
      });
    } finally {
      setEvidenceLoading(false);
    }
  };

  // Submit Dispute Resolution (Release to Coach or Refund to Customer)
  const handleResolveDispute = async () => {
    if (!resolveActionModal) return;
    const { bookingId, action, reason, policyReference } = resolveActionModal;
    try {
      setResolving(true);
      const payload: any = { action, reason: reason.trim() };
      if (action === 'REFUND_TO_CUSTOMER') {
        payload.policyReference = policyReference.trim();
      }
      await resolveDispute(bookingId, payload);
      alert(`Dispute successfully resolved with action: ${action === 'RELEASE_TO_COACH' ? 'Release to Coach' : 'Refund to Customer'}`);
      setResolveActionModal(null);
      setEvidenceModalOpen(false);
      loadDisputes();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  // Process Withdrawal (Approve / Reject)
  const handleWithdrawalAction = async () => {
    if (!withdrawalActionModal) return;
    const { id, action, remarks } = withdrawalActionModal;
    try {
      setProcessingWithdrawal(true);
      if (action === 'approve') {
        await approveWithdrawal(id, remarks);
      } else {
        await rejectWithdrawal(id, remarks);
      }
      setWithdrawalActionModal(null);
      loadWithdrawals();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} withdrawal`);
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  // Process Refund (Approve / Reject / Reconcile)
  const handleRefundAction = async () => {
    if (!refundActionModal) return;
    const { id, action, reason, gatewayRef, notes } = refundActionModal;
    try {
      setProcessingRefund(true);
      if (action === 'approve') {
        await approveRefund(id, { notes });
      } else if (action === 'reject') {
        await rejectRefund(id, reason);
      } else {
        await reconcileRefund(id, { gatewayReference: gatewayRef, notes });
      }
      setRefundActionModal(null);
      loadRefunds();
    } catch (err: any) {
      alert(err.message || `Failed to process refund ${action}`);
    } finally {
      setProcessingRefund(false);
    }
  };

  // Filtered Disputes
  const filteredDisputes = disputes.filter(d => {
    if (disputeHoldFilter === 'holds' && !d.financialHold) return false;
    if (!disputeSearch.trim()) return true;
    const q = disputeSearch.toLowerCase();
    const bId = String(d.bookingId || d.id || '').toLowerCase();
    const cust = `${d.customer?.name || ''} ${d.customer?.email || ''}`.toLowerCase();
    const coach = `${d.coach?.name || ''} ${d.coach?.email || ''}`.toLowerCase();
    const sp = String(d.sport || '').toLowerCase();
    return bId.includes(q) || cust.includes(q) || coach.includes(q) || sp.includes(q);
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F05A22]/10 text-[#F05A22] border border-[#F05A22]/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Review & Settlement Tools</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Super Admin financial hold resolution, dispute arbitration, coach payouts & refund operations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-xs h-9"
            onClick={() => {
              if (activeTab === 'disputes') loadDisputes();
              else if (activeTab === 'withdrawals') loadWithdrawals();
              else loadRefunds();
            }}
          >
            <RefreshCw className={clsx("h-3.5 w-3.5", (loadingDisputes || loadingWithdrawals || loadingRefunds) && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('disputes')}
          className={clsx(
            "flex items-center gap-2 pb-3 pt-1 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer",
            activeTab === 'disputes'
              ? "border-[#F05A22] text-[#F05A22]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          Dispute Queue
          {disputes.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-[#F05A22]/10 text-[#F05A22] font-bold">
              {disputes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={clsx(
            "flex items-center gap-2 pb-3 pt-1 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer",
            activeTab === 'withdrawals'
              ? "border-[#F05A22] text-[#F05A22]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <CreditCard className="h-4 w-4" />
          Withdrawals Review
          {withdrawals.filter(w => w.status === 'pending').length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-600 font-bold">
              {withdrawals.filter(w => w.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={clsx(
            "flex items-center gap-2 pb-3 pt-1 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer",
            activeTab === 'refunds'
              ? "border-[#F05A22] text-[#F05A22]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <RotateCcw className="h-4 w-4" />
          Refund Operations
          {refunds.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-600 font-bold">
              {refunds.length}
            </span>
          )}
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: DISPUTE QUEUE */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              label="Active Disputes"
              value={String(disputes.length)}
              sub="Requiring super admin arbitration"
              subColor="text-amber-600"
              icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
              iconBg="bg-amber-500/10"
            />
            <StatCard
              label="Financial Holds"
              value={String(disputes.filter(d => d.financialHold).length)}
              sub="Payouts blocked until resolution"
              subColor="text-rose-600"
              icon={<Lock className="h-4 w-4 text-rose-500" />}
              iconBg="bg-rose-500/10"
            />
            <StatCard
              label="Resolved Today"
              value={String(disputes.filter(d => d.status === 'resolved' || d.status === 'released' || d.status === 'refunded').length)}
              sub="Arbitrations settled"
              subColor="text-emerald-600"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              iconBg="bg-emerald-500/10"
            />
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDisputeHoldFilter('all')}
                className={clsx(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer",
                  disputeHoldFilter === 'all'
                    ? "bg-[#F05A22] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                All Cases ({disputes.length})
              </button>
              <button
                onClick={() => setDisputeHoldFilter('holds')}
                className={clsx(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                  disputeHoldFilter === 'holds'
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <Lock className="h-3 w-3" />
                Active Financial Holds ({disputes.filter(d => d.financialHold).length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search booking, customer, coach..."
                value={disputeSearch}
                onChange={e => setDisputeSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F05A22] focus:bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Disputes Table */}
          <Card>
            <Table>
              <Thead>
                <tr>
                  <Th>Booking ID</Th>
                  <Th>Customer</Th>
                  <Th>Coach</Th>
                  <Th>Sport / Session</Th>
                  <Th>Gross Paid</Th>
                  <Th>Net Coach</Th>
                  <Th>Hold Status</Th>
                  <Th>Dispute Status</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </Thead>
              <Tbody>
                {loadingDisputes ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#F05A22]" />
                      Loading dispute queue...
                    </td>
                  </tr>
                ) : filteredDisputes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      No dispute cases found matching this criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDisputes.map(d => {
                    const bId = d.bookingId || d.id || d._id;
                    const custName = d.customer?.name || (d.customer?.firstName ? `${d.customer.firstName} ${d.customer.lastName || ''}` : 'Customer');
                    const coachName = d.coach?.name || 'Coach';
                    const isHold = d.financialHold;

                    return (
                      <Tr key={bId}>
                        <Td>
                          <span className="font-mono text-xs font-semibold text-slate-900">
                            #{String(bId).slice(-8)}
                          </span>
                        </Td>
                        <Td>
                          <p className="font-medium text-slate-900 text-xs">{custName}</p>
                          <p className="text-[10px] text-slate-400">{d.customer?.email || '—'}</p>
                        </Td>
                        <Td>
                          <p className="font-medium text-slate-900 text-xs">{coachName}</p>
                          <p className="text-[10px] text-slate-400">{d.coach?.email || '—'}</p>
                        </Td>
                        <Td>
                          <span className="text-xs text-slate-700">{d.sport || 'Session'}</span>
                        </Td>
                        <Td>
                          <span className="font-semibold text-slate-900 text-xs">
                            ₹{(d.grossPaid ?? d.amount ?? 0).toLocaleString()}
                          </span>
                        </Td>
                        <Td>
                          <span className="font-semibold text-emerald-600 text-xs">
                            ₹{(d.coachNetAmount ?? (d.amount ? Math.round(d.amount * 0.85) : 0)).toLocaleString()}
                          </span>
                        </Td>
                        <Td>
                          {isHold ? (
                            <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20">
                              <Lock className="h-2.5 w-2.5 mr-1" /> Financial Hold
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-600 border border-slate-200">
                              No Hold
                            </Badge>
                          )}
                        </Td>
                        <Td>
                          <Badge className={clsx(
                            d.status === 'under_review' ? 'badge-amber' :
                            d.status === 'resolved' || d.status === 'released' ? 'badge-green' :
                            d.status === 'refunded' ? 'badge-blue' : 'badge-gray'
                          )}>
                            {d.status || 'Pending'}
                          </Badge>
                        </Td>
                        <Td className="text-right">
                          <Button
                            variant="primary"
                            className="text-xs py-1 px-3 h-7"
                            onClick={() => openSettlementDetail(d)}
                          >
                            Review Evidence
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: WITHDRAWALS REVIEW */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              label="Pending Payouts"
              value={String(withdrawals.filter(w => w.status === 'pending').length)}
              sub="Awaiting admin approval"
              subColor="text-amber-600"
              icon={<Clock className="h-4 w-4 text-amber-500" />}
              iconBg="bg-amber-500/10"
            />
            <StatCard
              label="Approved This Month"
              value={String(withdrawals.filter(w => w.status === 'approved' || w.status === 'completed').length)}
              sub="Transferred to coach bank"
              subColor="text-emerald-600"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              iconBg="bg-emerald-500/10"
            />
            <StatCard
              label="Total Payout Volume"
              value={`₹${withdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0).toLocaleString()}`}
              sub="Aggregate coach withdrawals"
              subColor="text-slate-600"
              icon={<DollarSign className="h-4 w-4 text-[#F05A22]" />}
              iconBg="bg-[#F05A22]/10"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2">
              {['pending', 'approved', 'rejected', 'all'].map(st => (
                <button
                  key={st}
                  onClick={() => setWithdrawalStatusFilter(st)}
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors cursor-pointer",
                    withdrawalStatusFilter === st
                      ? "bg-[#F05A22] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Withdrawals Table */}
          <Card>
            <Table>
              <Thead>
                <tr>
                  <Th>Withdrawal ID</Th>
                  <Th>Coach</Th>
                  <Th>Amount</Th>
                  <Th>Method / Account</Th>
                  <Th>Requested At</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {loadingWithdrawals ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#F05A22]" />
                      Loading coach withdrawals...
                    </td>
                  </tr>
                ) : withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      No withdrawal records found.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map(w => {
                    const id = w.id || w._id;
                    const coachName = w.coach?.name || w.coachName || 'Coach';
                    const isPending = w.status === 'pending';

                    return (
                      <Tr key={id}>
                        <Td>
                          <span className="font-mono text-xs font-semibold text-slate-900">
                            #{String(id).slice(-8)}
                          </span>
                        </Td>
                        <Td>
                          <p className="font-medium text-slate-900 text-xs">{coachName}</p>
                          <p className="text-[10px] text-slate-400">{w.coach?.email || w.coachEmail || '—'}</p>
                        </Td>
                        <Td>
                          <span className="font-bold text-slate-900 text-sm">
                            ₹{(Number(w.amount) || 0).toLocaleString()}
                          </span>
                        </Td>
                        <Td>
                          <p className="text-xs text-slate-700">{w.method || w.payoutMethod || 'Bank Transfer'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{w.account || w.accountNumber || '—'}</p>
                        </Td>
                        <Td>
                          <span className="text-xs text-slate-500">
                            {w.createdAt ? new Date(w.createdAt).toLocaleDateString() : '—'}
                          </span>
                        </Td>
                        <Td>
                          <Badge className={clsx(
                            w.status === 'approved' || w.status === 'completed' ? 'badge-green' :
                            w.status === 'pending' ? 'badge-amber' :
                            w.status === 'rejected' ? 'badge-red' : 'badge-gray'
                          )}>
                            {w.status || 'pending'}
                          </Badge>
                        </Td>
                        <Td className="text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="primary"
                                className="text-xs py-1 px-2.5 h-7 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white"
                                onClick={() => setWithdrawalActionModal({
                                  id,
                                  action: 'approve',
                                  remarks: '',
                                  coachName,
                                  amount: Number(w.amount) || 0
                                })}
                              >
                                <Check className="h-3 w-3 mr-1" /> Approve
                              </Button>
                              <Button
                                variant="danger"
                                className="text-xs py-1 px-2.5 h-7"
                                onClick={() => setWithdrawalActionModal({
                                  id,
                                  action: 'reject',
                                  remarks: '',
                                  coachName,
                                  amount: Number(w.amount) || 0
                                })}
                              >
                                <X className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Processed</span>
                          )}
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: REFUND OPERATIONS */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              label="Pending Session Refunds"
              value={String(refunds.filter(r => r.status === 'pending').length)}
              sub="Awaiting review"
              subColor="text-amber-600"
              icon={<RotateCcw className="h-4 w-4 text-amber-500" />}
              iconBg="bg-amber-500/10"
            />
            <StatCard
              label="Reconciled / Processed"
              value={String(refunds.filter(r => r.status === 'reconciled' || r.status === 'approved' || r.status === 'processed').length)}
              sub="Settled with payment gateway"
              subColor="text-emerald-600"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              iconBg="bg-emerald-500/10"
            />
            <StatCard
              label="Refund Amount Total"
              value={`₹${refunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0).toLocaleString()}`}
              sub="Source: SESSION bookings"
              subColor="text-slate-600"
              icon={<DollarSign className="h-4 w-4 text-[#F05A22]" />}
              iconBg="bg-[#F05A22]/10"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2">
              {['all', 'pending', 'approved', 'reconciled', 'rejected'].map(st => (
                <button
                  key={st}
                  onClick={() => setRefundStatusFilter(st)}
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors cursor-pointer",
                    refundStatusFilter === st
                      ? "bg-[#F05A22] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Refunds Table */}
          <Card>
            <Table>
              <Thead>
                <tr>
                  <Th>Refund ID</Th>
                  <Th>User / Customer</Th>
                  <Th>Booking Ref</Th>
                  <Th>Amount</Th>
                  <Th>Reason</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {loadingRefunds ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#F05A22]" />
                      Loading session refunds...
                    </td>
                  </tr>
                ) : refunds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <RotateCcw className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      No refund cases found.
                    </td>
                  </tr>
                ) : (
                  refunds.map(r => {
                    const id = String(r.id || r._id || '');
                    const isPending = r.status === 'pending';

                    return (
                      <Tr key={id}>
                        <Td>
                          <span className="font-mono text-xs font-semibold text-slate-900">
                            #{String(id).slice(-8)}
                          </span>
                        </Td>
                        <Td>
                          <p className="font-medium text-slate-900 text-xs">{r.userName || 'User'}</p>
                          <p className="text-[10px] text-slate-400">{r.userEmail || '—'}</p>
                        </Td>
                        <Td>
                          <span className="font-mono text-xs text-slate-600">
                            {r.bookingId ? `#${String(r.bookingId).slice(-8)}` : '—'}
                          </span>
                        </Td>
                        <Td>
                          <span className="font-bold text-slate-900 text-sm">
                            ₹{(Number(r.amount) || 0).toLocaleString()}
                          </span>
                        </Td>
                        <Td>
                          <span className="text-xs text-slate-600 line-clamp-1">
                            {r.reason || 'Customer request'}
                          </span>
                        </Td>
                        <Td>
                          <Badge className={clsx(
                            r.status === 'reconciled' || r.status === 'approved' || r.status === 'processed' ? 'badge-green' :
                            r.status === 'pending' ? 'badge-amber' :
                            r.status === 'rejected' ? 'badge-red' : 'badge-gray'
                          )}>
                            {r.status || 'pending'}
                          </Badge>
                        </Td>
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <Button
                                  variant="primary"
                                  className="text-xs py-1 px-2 h-7 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white"
                                  onClick={() => setRefundActionModal({ id, action: 'approve' })}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  className="text-xs py-1 px-2 h-7"
                                  onClick={() => setRefundActionModal({ id, action: 'reject', reason: '' })}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              className="text-xs py-1 px-2 h-7"
                              onClick={() => setRefundActionModal({ id, action: 'reconcile', gatewayRef: r.gatewayReference || '' })}
                            >
                              Reconcile
                            </Button>
                          </div>
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: SETTLEMENT EVIDENCE DETAIL (Super Admin arbitration) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        title="Settlement Evidence Detail & Arbitration"
        size="lg"
      >
        {evidenceLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#F05A22]" />
            Fetching settlement evidence records...
          </div>
        ) : !evidence ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No settlement evidence records available for this booking.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Financial Overview Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Booking ID</span>
                  <p className="font-mono text-sm font-bold text-slate-900">#{evidence.bookingId || selectedDispute?.bookingId}</p>
                </div>
                {evidence.financialHold && (
                  <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    <Lock className="h-3 w-3 mr-1" /> Financial Hold Active
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <p className="text-[11px] text-slate-500">Gross Paid</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">₹{(evidence.grossPaid || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <p className="text-[11px] text-slate-500">Platform Commission</p>
                  <p className="text-base font-bold text-[#F05A22] mt-0.5">₹{(evidence.platformCommission || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <p className="text-[11px] text-slate-500">Coach Net Amount</p>
                  <p className="text-base font-bold text-emerald-600 mt-0.5">₹{(evidence.coachNetAmount || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Attendance Timestamps */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#F05A22]" /> Attendance Timestamps & Verification
              </h4>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Check-in</span>
                  <span className="font-medium text-slate-800">
                    {evidence.attendanceTimestamps?.checkIn
                      ? new Date(evidence.attendanceTimestamps.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Not recorded'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Check-out</span>
                  <span className="font-medium text-slate-800">
                    {evidence.attendanceTimestamps?.checkOut
                      ? new Date(evidence.attendanceTimestamps.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Not recorded'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Duration</span>
                  <span className="font-medium text-slate-800">
                    {evidence.attendanceTimestamps?.durationMinutes ? `${evidence.attendanceTimestamps.durationMinutes} mins` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">GPS / NFC Verified</span>
                  <span className={clsx("font-semibold", evidence.attendanceTimestamps?.verified ? "text-emerald-600" : "text-amber-600")}>
                    {evidence.attendanceTimestamps?.verified ? '✓ Verified' : '⚠ Unverified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Complaints */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Customer Complaints & Claims
              </h4>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                {(!evidence.customerComplaints || evidence.customerComplaints.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No direct complaints registered by customer.</p>
                ) : (
                  evidence.customerComplaints.map((c, i) => (
                    <div key={i} className="text-xs border-l-2 border-amber-500 pl-3 py-1">
                      <p className="text-slate-800 leading-relaxed">{c.text}</p>
                      {c.submittedAt && (
                        <p className="text-[10px] text-slate-400 mt-1">Submitted: {new Date(c.submittedAt).toLocaleString()}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Coach Reports */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-blue-500" /> Coach Session Report
              </h4>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                {(!evidence.coachReports || evidence.coachReports.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No incident report filed by coach.</p>
                ) : (
                  evidence.coachReports.map((r, i) => (
                    <div key={i} className="text-xs border-l-2 border-blue-500 pl-3 py-1">
                      <p className="text-slate-800 leading-relaxed">{r.text}</p>
                      {r.submittedAt && (
                        <p className="text-[10px] text-slate-400 mt-1">Logged: {new Date(r.submittedAt).toLocaleString()}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Resolution Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
              <Button
                variant="outline"
                className="w-full sm:w-auto text-xs"
                onClick={() => setEvidenceModalOpen(false)}
              >
                Close
              </Button>

              <Button
                variant="primary"
                className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white"
                onClick={() => setResolveActionModal({
                  bookingId: evidence.bookingId || selectedDispute?.bookingId || '',
                  action: 'RELEASE_TO_COACH',
                  reason: 'Evidence confirms coach attended and performed the scheduled session.',
                  policyReference: ''
                })}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Release to Coach (₹{(evidence.coachNetAmount || 0).toLocaleString()})
              </Button>

              <Button
                variant="danger"
                className="w-full sm:w-auto text-xs bg-rose-600 hover:bg-rose-700 border-rose-600 text-white"
                onClick={() => setResolveActionModal({
                  bookingId: evidence.bookingId || selectedDispute?.bookingId || '',
                  action: 'REFUND_TO_CUSTOMER',
                  reason: 'Customer complaint verified via missing coach attendance timestamp.',
                  policyReference: 'SEC-4.2-NO-SHOW-POLICY'
                })}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Refund to Customer (₹{(evidence.grossPaid || 0).toLocaleString()})
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: RESOLVE DISPUTE CONFIRMATION (Release / Refund) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={Boolean(resolveActionModal)}
        onClose={() => setResolveActionModal(null)}
        title={resolveActionModal?.action === 'RELEASE_TO_COACH' ? 'Arbitration: Release Payout to Coach' : 'Arbitration: Refund Customer'}
        size="md"
      >
        {resolveActionModal && (
          <div className="space-y-4">
            <div className={clsx(
              "p-3 rounded-xl border text-xs",
              resolveActionModal.action === 'RELEASE_TO_COACH'
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            )}>
              <p className="font-semibold mb-1">
                {resolveActionModal.action === 'RELEASE_TO_COACH'
                  ? 'Releasing payout to coach removes any financial holds and credits their wallet.'
                  : 'Refunding customer initiates a reverse charge on the gateway and debits the coach account.'}
              </p>
              <p>Booking ID: <span className="font-mono font-bold">#{resolveActionModal.bookingId}</span></p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Resolution Reason / Audit Note <span className="text-red-500">*</span>
              </label>
              <textarea
                value={resolveActionModal.reason}
                onChange={e => setResolveActionModal({ ...resolveActionModal, reason: e.target.value })}
                rows={3}
                className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F05A22] text-slate-800"
                placeholder="Enter detailed reason for this arbitration ruling..."
                required
              />
            </div>

            {resolveActionModal.action === 'REFUND_TO_CUSTOMER' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Policy Reference / Terms Clause
                </label>
                <input
                  type="text"
                  value={resolveActionModal.policyReference}
                  onChange={e => setResolveActionModal({ ...resolveActionModal, policyReference: e.target.value })}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F05A22] text-slate-800"
                  placeholder="e.g. SEC-4.2-NO-SHOW-POLICY"
                />
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <Button
                variant="outline"
                className="text-xs"
                onClick={() => setResolveActionModal(null)}
                disabled={resolving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className={clsx(
                  "text-xs text-white",
                  resolveActionModal.action === 'RELEASE_TO_COACH'
                    ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                    : "bg-rose-600 hover:bg-rose-700 border-rose-600"
                )}
                onClick={handleResolveDispute}
                disabled={resolving || !resolveActionModal.reason.trim()}
              >
                {resolving ? 'Executing resolution...' : 'Confirm Resolution'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: WITHDRAWAL ACTION (Approve / Reject) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={Boolean(withdrawalActionModal)}
        onClose={() => setWithdrawalActionModal(null)}
        title={withdrawalActionModal?.action === 'approve' ? 'Approve Coach Payout' : 'Reject Coach Payout'}
        size="md"
      >
        {withdrawalActionModal && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <p>Coach: <span className="font-semibold text-slate-900">{withdrawalActionModal.coachName}</span></p>
              <p>Amount: <span className="font-bold text-slate-900">₹{(withdrawalActionModal.amount || 0).toLocaleString()}</span></p>
              <p className="text-[11px] text-slate-500">Action: <span className="font-semibold uppercase">{withdrawalActionModal.action}</span></p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Admin Remarks / Transaction Ref
              </label>
              <textarea
                value={withdrawalActionModal.remarks}
                onChange={e => setWithdrawalActionModal({ ...withdrawalActionModal, remarks: e.target.value })}
                rows={3}
                className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F05A22] text-slate-800"
                placeholder="Enter remarks or bank transfer UTR number..."
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <Button
                variant="outline"
                className="text-xs"
                onClick={() => setWithdrawalActionModal(null)}
                disabled={processingWithdrawal}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className={clsx(
                  "text-xs text-white",
                  withdrawalActionModal.action === 'approve'
                    ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                    : "bg-rose-600 hover:bg-rose-700 border-rose-600"
                )}
                onClick={handleWithdrawalAction}
                disabled={processingWithdrawal}
              >
                {processingWithdrawal ? 'Processing...' : withdrawalActionModal.action === 'approve' ? 'Approve Payout' : 'Reject Payout'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: REFUND ACTION (Approve / Reject / Reconcile) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={Boolean(refundActionModal)}
        onClose={() => setRefundActionModal(null)}
        title={
          refundActionModal?.action === 'approve' ? 'Approve Refund' :
          refundActionModal?.action === 'reject' ? 'Reject Refund' : 'Reconcile Gateway Refund'
        }
        size="md"
      >
        {refundActionModal && (
          <div className="space-y-4">
            {refundActionModal.action === 'reconcile' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Gateway Reference ID (Razorpay/Stripe) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={refundActionModal.gatewayRef || ''}
                    onChange={e => setRefundActionModal({ ...refundActionModal, gatewayRef: e.target.value })}
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F05A22] text-slate-800 font-mono"
                    placeholder="rfnd_1234567890..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Reconciliation Notes</label>
                  <textarea
                    value={refundActionModal.notes || ''}
                    onChange={e => setRefundActionModal({ ...refundActionModal, notes: e.target.value })}
                    rows={2}
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F05A22] text-slate-800"
                    placeholder="Optional settlement notes..."
                  />
                </div>
              </>
            ) : refundActionModal.action === 'reject' ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Rejection Reason</label>
                <textarea
                  value={refundActionModal.reason || ''}
                  onChange={e => setRefundActionModal({ ...refundActionModal, reason: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F05A22] text-slate-800"
                  placeholder="Reason for rejecting refund..."
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Approval Notes</label>
                <textarea
                  value={refundActionModal.notes || ''}
                  onChange={e => setRefundActionModal({ ...refundActionModal, notes: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F05A22] text-slate-800"
                  placeholder="Optional approval notes..."
                />
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <Button
                variant="outline"
                className="text-xs"
                onClick={() => setRefundActionModal(null)}
                disabled={processingRefund}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="text-xs text-white bg-[#F05A22] hover:bg-[#e04f18]"
                onClick={handleRefundAction}
                disabled={processingRefund || (refundActionModal.action === 'reconcile' && !refundActionModal.gatewayRef?.trim())}
              >
                {processingRefund ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
