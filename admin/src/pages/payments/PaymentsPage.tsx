import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, ArrowDownToLine, Wallet, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Button, SearchBar, StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState, FilterPill } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminWithdrawals, getAdminTransactions, approveWithdrawal, rejectWithdrawal, getAdminCoaches, getCustomers, extractDataList } from '../../api';

const TXN_TYPE_MAP: Record<string, string> = { credit_purchase: 'badge-green', subscription: 'badge-purple', booking_debit: 'badge-red', refund: 'badge-blue', payout: 'badge-amber' };
const PAYOUT_MAP:  Record<string, string> = { pending: 'badge-amber', processed: 'badge-green', approved: 'badge-green', failed: 'badge-red', rejected: 'badge-red' };
const METHOD_MAP:  Record<string, string> = { UPI: 'badge-blue', NEFT: 'badge-gray', IMPS: 'badge-teal' };
const fmt = (n: number) => '₹' + (n || 0).toLocaleString('en-IN');

const getTxnUser = (t: any, userMap: Record<string, string> = {}) => {
  if (!t) return 'User';
  if (t.customerName) return t.customerName;
  if (t.userName) return t.userName;
  const u = t.user || t.userId || t.customer;
  if (typeof u === 'object' && u !== null) {
    const fn = u.firstName || u.name || '';
    const ln = u.lastName || '';
    const full = `${fn} ${ln}`.trim();
    if (full) return full;
    if (u.email) return u.email.split('@')[0];
  }
  const idStr = String(u || '');
  if (idStr && userMap[idStr]) return userMap[idStr];
  if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
    return `Player #${idStr.slice(-4).toUpperCase()}`;
  }
  if (idStr && idStr !== '[object Object]') return idStr;
  return 'Customer';
};

const getPayoutCoach = (p: any, coachMap: Record<string, string> = {}) => {
  if (!p) return 'Coach';
  if (p.coachName) return p.coachName;
  if (p.coachDetails?.name) return p.coachDetails.name;
  const c = p.coach || p.coachId;
  if (typeof c === 'object' && c !== null) {
    const n = c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim();
    if (n) return n;
    if (c.email) return c.email.split('@')[0];
  }
  const idStr = String(c || '');
  if (idStr && coachMap[idStr]) return coachMap[idStr];
  if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
    return `Coach #${idStr.slice(-4).toUpperCase()}`;
  }
  if (idStr && idStr !== '[object Object]') return idStr;
  return 'Coach';
};

export default function PaymentsPage() {
  const { can } = useAuth();
  const [tab, setTab]         = useState<'transactions' | 'payouts'>('transactions');
  const [search, setSearch]   = useState('');
  const [payouts, setPayouts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [coachMap, setCoachMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [payoutFilter, setPayoutFilter] = useState<'Pending' | 'Processed' | 'Failed'>('Pending');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, tRes, cRes, uRes] = await Promise.allSettled([
        getAdminWithdrawals(),
        getAdminTransactions(),
        getAdminCoaches({ limit: 200 }),
        getCustomers({ limit: 200 })
      ]);

      const cm: Record<string, string> = {};
      if (cRes.status === 'fulfilled') {
        const rawC = extractDataList(cRes.value);
        for (const c of rawC) {
          const id = String(c.id || c._id || '');
          const n = c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim();
          if (id && n) cm[id] = n;
        }
        setCoachMap(cm);
      }

      const um: Record<string, string> = {};
      if (uRes.status === 'fulfilled') {
        const rawU = extractDataList(uRes.value);
        for (const u of rawU) {
          const id = String(u.id || u._id || '');
          const n = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
          if (id && n) um[id] = n;
        }
        setUserMap(um);
      }

      if (wRes.status === 'fulfilled') {
        const rawW = extractDataList(wRes.value);
        const seenW = new Set<string>();
        const mappedW: any[] = [];
        for (const p of rawW) {
          const id = p.id || p._id;
          if (id && seenW.has(String(id))) continue;
          if (id) seenW.add(String(id));
          mappedW.push({
            id,
            coach: getPayoutCoach(p, cm),
            amount: p.amount || 0,
            method: p.method || 'UPI',
            account: p.account || p.upiId || '—',
            status: p.status || 'pending',
            date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—',
          });
        }
        setPayouts(mappedW);
      } else {
        setPayouts([]);
      }

      if (tRes.status === 'fulfilled') {
        const rawT = extractDataList(tRes.value);
        const seenT = new Set<string>();
        const mappedT: any[] = [];
        for (const t of rawT) {
          const id = t.id || t._id;
          if (id && seenT.has(String(id))) continue;
          if (id) seenT.add(String(id));
          mappedT.push({
            id: id || `TXN_${Math.random().toString(36).substring(7)}`,
            user: getTxnUser(t, um),
            type: t.type || t.category || 'credit_purchase',
            credits: t.credits || 0,
            amountInr: t.amountInr || t.amount || 0,
            method: t.method || t.paymentMethod || 'Razorpay',
            status: t.status || 'success',
            createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : '—',
          });
        }
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

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (id: string) => {
    try {
      await approveWithdrawal(id);
      setPayouts(p => p.map(x => x.id === id ? { ...x, status: 'processed' } : x));
    } catch (err: any) { alert(err.message || 'Approval failed'); }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectWithdrawal(id);
      setPayouts(p => p.map(x => x.id === id ? { ...x, status: 'failed' } : x));
    } catch (err: any) { alert(err.message || 'Rejection failed'); }
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
    <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 min-w-0 max-w-full">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Gross Revenue"       value={fmt(totalRevenue)}                                     sub="Total processed"   icon={<TrendingUp       className="h-4 w-4 text-emerald-500" />} iconBg="bg-emerald-50" subColor="text-emerald-600" />
        <StatCard label="Platform Commission" value={fmt(Math.round(totalRevenue * 0.2))}                  sub="20% avg"           icon={<Wallet           className="h-4 w-4 text-[#F05A22]" />}    iconBg="bg-[#F05A22]/10" subColor="text-slate-600" />
        <StatCard label="Pending Payouts"     value={fmt(totalPending)}                                    sub={`${payouts.filter(p => p.status === 'pending').length} requests`} icon={<ArrowDownToLine className="h-4 w-4 text-amber-500" />} iconBg="bg-amber-50" subColor="text-amber-600" />
        <StatCard label="Failed Transactions" value={String(failedCount)}                                  sub="Needs follow-up"   icon={<AlertTriangle    className="h-4 w-4 text-rose-500" />}     iconBg="bg-rose-50"    subColor="text-rose-600" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['transactions', 'payouts'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all cursor-pointer ${
              tab === t ? 'bg-[#F05A22] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t === 'payouts' ? 'Payout Queue' : 'Transactions'}
          </button>
        ))}
      </div>

      {tab === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle>All Transactions ({filteredTxns.length})</CardTitle>
            <SearchBar value={search} onChange={setSearch} placeholder="Search transactions..." />
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <Table>
                <Thead><Tr className="hover:bg-transparent"><Th>ID</Th><Th>User / Customer</Th><Th>Type</Th><Th className="text-right">Credits</Th><Th className="text-right">Amount</Th><Th>Method</Th><Th>Status</Th><Th>Date</Th></Tr></Thead>
                <Tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-8"><div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin inline-block" /></td></tr>
                  ) : filteredTxns.length === 0 ? <tr><td colSpan={8}><EmptyState icon={<Wallet className="h-8 w-8 text-slate-300" />} title="No transactions found" /></td></tr>
                    : filteredTxns.map(t => (
                      <Tr key={t.id}>
                        <Td className="text-slate-500 font-mono text-[11px] font-medium">#{t.id ? String(t.id).slice(-8).toUpperCase() : '—'}</Td>
                        <Td>
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar initials={String(t.user).split(' ').map(n => n[0]).join('').slice(0, 2)} size={28} className="flex-shrink-0" />
                            <span className="text-xs font-semibold text-slate-900 truncate max-w-[140px]" title={t.user}>{t.user}</span>
                          </div>
                        </Td>
                        <Td><Badge className={TXN_TYPE_MAP[t.type] || 'badge-gray'}>{String(t.type).replace('_', ' ')}</Badge></Td>
                        <Td className={`text-right tabular-nums font-semibold ${t.credits > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{t.credits > 0 ? `+${t.credits}` : t.credits}</Td>
                        <Td className="text-right tabular-nums font-bold text-slate-900">{t.amountInr > 0 ? fmt(t.amountInr) : '—'}</Td>
                        <Td className="text-slate-600 text-xs whitespace-nowrap">{t.method || '—'}</Td>
                        <Td><Badge className={t.status === 'success' ? 'badge-green' : t.status === 'failed' ? 'badge-red' : 'badge-amber'}>{t.status}</Badge></Td>
                        <Td className="text-slate-500 whitespace-nowrap text-xs">{t.createdAt}</Td>
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
            <CardTitle>Coach Payout Queue ({filteredPayouts.length})</CardTitle>
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
                <Thead><Tr className="hover:bg-transparent"><Th>Coach</Th><Th className="text-right">Amount</Th><Th>Method</Th><Th>Account / UPI</Th><Th>Status</Th><Th>Date</Th>{can('payments_write') && <Th className="text-right">Actions</Th>}</Tr></Thead>
                <Tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-6"><div className="h-5 w-5 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin inline-block" /></td></tr>
                  ) : filteredPayouts.length === 0 ? (
                    <tr><td colSpan={7}><EmptyState icon={<Wallet className="h-8 w-8 text-slate-300" />} title="No payouts found" /></td></tr>
                  ) : filteredPayouts.map(p => (
                    <Tr key={p.id}>
                      <Td>
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar initials={String(p.coach).split(' ').map((n: string) => n[0]).join('').slice(0, 2)} size={28} className="flex-shrink-0" />
                          <span className="text-xs font-semibold text-slate-900 truncate max-w-[140px]" title={p.coach}>{p.coach}</span>
                        </div>
                      </Td>
                      <Td className="text-right tabular-nums font-bold text-slate-900">{fmt(p.amount)}</Td>
                      <Td><Badge className={METHOD_MAP[p.method] || 'badge-gray'}>{p.method}</Badge></Td>
                      <Td className="font-mono text-xs text-slate-600 truncate max-w-[130px]" title={p.account}>{p.account}</Td>
                      <Td><Badge className={PAYOUT_MAP[p.status] || 'badge-gray'}>{p.status}</Badge></Td>
                      <Td className="text-slate-500 whitespace-nowrap text-xs">{p.date}</Td>
                      {can('payments_write') && (
                        <Td className="text-right pr-4">
                          {p.status === 'pending' && (
                            <div className="flex justify-end gap-1.5 whitespace-nowrap">
                              <Button variant="primary" className="h-7 text-[10px] px-2.5 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white" onClick={() => handleApprove(p.id)}>Approve</Button>
                              <Button variant="danger"  className="h-7 text-[10px] px-2.5" onClick={() => handleReject(p.id)}>Reject</Button>
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
