import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, ArrowDownToLine, Wallet, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Button, SearchBar, StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState, FilterPill } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminWithdrawals, getAdminTransactions, approveWithdrawal, rejectWithdrawal, verifySubscriptionPayment } from '../../api';

const TXN_TYPE_MAP: Record<string, string> = { credit_purchase: 'badge-green', subscription: 'badge-purple', booking_debit: 'badge-red', refund: 'badge-blue', payout: 'badge-amber' };
const PAYOUT_MAP:  Record<string, string> = { pending: 'badge-amber', processed: 'badge-green', failed: 'badge-red' };
const METHOD_MAP:  Record<string, string> = { UPI: 'badge-blue', NEFT: 'badge-gray', IMPS: 'badge-teal' };
const fmt = (n: number) => '₹' + (n || 0).toLocaleString('en-IN');

const getTxnUser = (t: any) => {
  if (!t.user && !t.userId) return 'User';
  const u = t.user || t.userId;
  if (typeof u === 'object') {
    const fn = u.firstName || u.name || '';
    const ln = u.lastName || '';
    return `${fn} ${ln}`.trim() || 'User';
  }
  return String(u);
};

export default function PaymentsPage() {
  const { can } = useAuth();
  const [tab, setTab]         = useState<'transactions' | 'payouts'>('transactions');
  const [search, setSearch]   = useState('');
  const [payouts, setPayouts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutFilter, setPayoutFilter] = useState<'Pending' | 'Processed' | 'Failed'>('Pending');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, tRes] = await Promise.allSettled([
        getAdminWithdrawals(),
        getAdminTransactions()
      ]);

      if (wRes.status === 'fulfilled') {
        const rawW = wRes.value?.data || wRes.value || [];
        const mappedW = (Array.isArray(rawW) ? rawW : []).map((p: any) => ({
          id: p.id || p._id,
          coach: p.coach?.name || p.coach?.email || 'Coach',
          amount: p.amount || 0,
          method: p.method || 'UPI',
          account: p.account || p.upiId || '—',
          status: p.status || 'pending',
          date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—',
        }));
        setPayouts(mappedW);
      } else {
        setPayouts([]);
      }

      if (tRes.status === 'fulfilled') {
        const rawT = tRes.value?.data || tRes.value || [];
        const mappedT = (Array.isArray(rawT) ? rawT : []).map((t: any) => ({
          id: t.id || t._id || `TXN_${Math.random().toString(36).substring(7)}`,
          user: getTxnUser(t),
          type: t.type || t.category || 'credit_purchase',
          credits: t.credits || 0,
          amountInr: t.amountInr || t.amount || 0,
          method: t.method || t.paymentMethod || 'Razorpay',
          status: t.status || 'success',
          createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : '—',
        }));
        setTransactions(mappedT);
      } else {
        setTransactions([]);
      }
    } catch {
      setPayouts([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string) => {
    try {
      await approveWithdrawal(id, 'Approved via Admin Panel');
      setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'processed' } : p));
      alert('Withdrawal approved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectWithdrawal(id, 'Rejected via Admin Panel');
      setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'failed' } : p));
      alert('Withdrawal rejected successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    }
  };

  const totalRevenue = transactions
    .filter(p => p.status === 'success' && (p.amountInr > 0))
    .reduce((s, p) => s + p.amountInr, 0);

  const totalPending = payouts
    .filter(p => p.status === 'pending')
    .reduce((s, p) => s + p.amount, 0);

  const failedCount = transactions.filter(p => p.status === 'failed').length;

  const filteredTxns = transactions.filter(p => {
    const userStr = String(p.user || '');
    const typeStr = String(p.type || '');
    const idStr = String(p.id || '');
    return `${userStr} ${typeStr} ${idStr}`.toLowerCase().includes(search.toLowerCase());
  });

  const filteredPayouts = payouts.filter(p => {
    const matchSearch = String(p.coach || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = (p.status || '').toLowerCase() === payoutFilter.toLowerCase();
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Gross Revenue"       value={fmt(totalRevenue)}                                     sub="Total processed"   icon={<TrendingUp       className="h-4 w-4 text-emerald-400" />} iconBg="bg-emerald-500/10" subColor="text-emerald-400" />
        <StatCard label="Platform Commission" value={fmt(Math.round(totalRevenue * 0.2))}                  sub="20% avg"           icon={<Wallet           className="h-4 w-4 text-blue-400" />}    iconBg="bg-blue-500/10"    subColor="text-[#5c6370]" />
        <StatCard label="Pending Payouts"     value={fmt(totalPending)}                                    sub={`${payouts.filter(p => p.status === 'pending').length} requests`} icon={<ArrowDownToLine className="h-4 w-4 text-amber-400" />} iconBg="bg-amber-500/10" subColor="text-amber-400" />
        <StatCard label="Failed Transactions" value={String(failedCount)}                                  sub="Needs follow-up"   icon={<AlertTriangle    className="h-4 w-4 text-red-400" />}     iconBg="bg-red-500/10"    subColor="text-red-400" />
      </div>

      <div className="flex gap-2">
        {(['transactions', 'payouts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-[#F05A22] text-white' : 'btn-outline'}`}>{t === 'payouts' ? 'Payout Queue' : 'Transactions'}</button>
        ))}
      </div>

      {tab === 'transactions' && (
        <Card>
          <CardHeader><CardTitle>All Transactions ({filteredTxns.length})</CardTitle><SearchBar value={search} onChange={setSearch} placeholder="Search transactions..." /></CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <Table>
                <Thead><Tr className="hover:bg-transparent"><Th>ID</Th><Th>User</Th><Th>Type</Th><Th className="text-right">Credits</Th><Th className="text-right">Amount</Th><Th>Method</Th><Th>Status</Th><Th>Date</Th></Tr></Thead>
                <Tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-8"><div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin inline-block" /></td></tr>
                  ) : filteredTxns.length === 0 ? <tr><td colSpan={8}><EmptyState icon={<Wallet className="h-8 w-8" />} title="No transactions found" /></td></tr>
                    : filteredTxns.map(t => (
                      <Tr key={t.id}>
                        <Td className="text-[#5c6370] font-mono text-[10px]">{t.id ? String(t.id).slice(-8) : '—'}</Td>
                        <Td><div className="flex items-center gap-2"><Avatar initials={String(t.user).split(' ').map(n => n[0]).join('')} size={28} /><span className="text-xs text-white">{t.user}</span></div></Td>
                        <Td><Badge className={TXN_TYPE_MAP[t.type] || 'badge-gray'}>{String(t.type).replace('_', ' ')}</Badge></Td>
                        <Td className={`text-right tabular-nums font-semibold ${t.credits > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{t.credits > 0 ? `+${t.credits}` : t.credits}</Td>
                        <Td className="text-right tabular-nums text-white">{t.amountInr > 0 ? fmt(t.amountInr) : '—'}</Td>
                        <Td className="text-[#9ba3af] text-xs">{t.method || '—'}</Td>
                        <Td><Badge className={t.status === 'success' ? 'badge-green' : t.status === 'failed' ? 'badge-red' : 'badge-amber'}>{t.status}</Badge></Td>
                        <Td className="text-[#5c6370]">{t.createdAt}</Td>
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'payouts' && (
        <Card>
          <CardHeader>
            <CardTitle>Payout Queue ({filteredPayouts.length})</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <SearchBar value={search} onChange={setSearch} placeholder="Search coaches..." />
              <div className="flex gap-1 flex-wrap">
                {(['Pending', 'Processed', 'Failed'] as const).map(f => (
                  <FilterPill key={f} label={f} active={payoutFilter === f} onClick={() => setPayoutFilter(f)} />
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <Table>
                <Thead><Tr className="hover:bg-transparent"><Th>Coach</Th><Th className="text-right">Amount</Th><Th>Method</Th><Th>Account/UPI</Th><Th>Status</Th><Th>Date</Th>{can('payments_write') && <Th></Th>}</Tr></Thead>
                <Tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-6"><div className="h-5 w-5 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin inline-block" /></td></tr>
                  ) : filteredPayouts.length === 0 ? (
                    <tr><td colSpan={7}><EmptyState icon={<Wallet className="h-8 w-8" />} title="No payouts found" /></td></tr>
                  ) : filteredPayouts.map(p => (
                    <Tr key={p.id}>
                      <Td><div className="flex items-center gap-2"><Avatar initials={String(p.coach).split(' ').map((n: string) => n[0]).join('')} size={28} /><span className="text-xs text-white font-medium">{p.coach}</span></div></Td>
                      <Td className="text-right tabular-nums font-bold text-white">{fmt(p.amount)}</Td>
                      <Td><Badge className={METHOD_MAP[p.method] || 'badge-gray'}>{p.method}</Badge></Td>
                      <Td className="font-mono text-[10px] text-[#9ba3af]">{p.account}</Td>
                      <Td><Badge className={PAYOUT_MAP[p.status]}>{p.status}</Badge></Td>
                      <Td className="text-[#5c6370]">{p.date}</Td>
                      {can('payments_write') && (
                        <Td className="pr-4">
                          {p.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <Button variant="primary" className="h-7 text-[10px] px-2 text-emerald-400 hover:bg-emerald-400/10 border-emerald-500/25" onClick={() => handleApprove(p.id)}>Approve</Button>
                              <Button variant="danger"  className="h-7 text-[10px] px-2" onClick={() => handleReject(p.id)}>Reject</Button>
                            </div>
                          )}
                        </Td>
                      )}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

