import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, SearchBar, FilterPill, StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState } from '../../components/ui';
import { getAdminBookings, updateBookingStatus, getAdminCoaches, getCustomers, extractDataList } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking, BookingStatus } from '../../types';

const STATUS_MAP: Record<string, string> = {
  requested: 'badge-amber', accepted: 'badge-blue', confirmed: 'badge-blue',
  completed: 'badge-green', cancelled: 'badge-red', no_show: 'badge-gray',
};
const FILTERS: BookingStatus[] = ['requested','accepted','confirmed','completed','cancelled','no_show'];

const getBookingId = (b: any) => b._id || b.id || '';

const getBookingUserName = (b: any, userMap: Record<string, string> = {}) => {
  if (!b) return 'User';
  if (b.customerName) return b.customerName;
  if (b.userName) return b.userName;
  if (b.playerName) return b.playerName;
  if (b.bookedBy && typeof b.bookedBy === 'object') {
    const n = b.bookedBy.name || `${b.bookedBy.firstName || ''} ${b.bookedBy.lastName || ''}`.trim();
    if (n) return n;
  }
  if (typeof b.user === 'object' && b.user !== null) {
    const fn = b.user.name || b.user.fullName || b.user.firstName || '';
    const ln = b.user.lastName || '';
    const full = `${fn} ${ln}`.trim();
    if (full) return full;
    if (b.user.email) return b.user.email.split('@')[0];
  }
  const idStr = String(b.user || b.userId || b.customerId || '');
  if (idStr && userMap[idStr]) return userMap[idStr];
  if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
    return `Player #${idStr.slice(-4).toUpperCase()}`;
  }
  if (idStr && idStr !== '[object Object]') return idStr;
  return 'Customer';
};

const getBookingCoachName = (b: any, coachMap: Record<string, string> = {}) => {
  if (!b) return 'Coach';
  if (b.coachName) return b.coachName;
  if (b.coachDetails?.name) return b.coachDetails.name;
  if (b.coachProfile?.name) return b.coachProfile.name;
  if (typeof b.coach === 'object' && b.coach !== null) {
    const fn = b.coach.name || b.coach.fullName || b.coach.firstName || '';
    const ln = b.coach.lastName || '';
    const full = `${fn} ${ln}`.trim();
    if (full) return full;
    if (b.coach.email) return b.coach.email.split('@')[0];
  }
  const idStr = String(b.coach || b.coachId || '');
  if (idStr && coachMap[idStr]) return coachMap[idStr];
  if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
    return `Coach #${idStr.slice(-4).toUpperCase()}`;
  }
  if (idStr && idStr !== '[object Object]') return idStr;
  return 'Coach';
};

const getBookingSport = (b: any) => {
  if (!b || !b.sport) return 'General';
  if (typeof b.sport === 'object') return b.sport.name || 'General';
  return String(b.sport);
};

const getBookingLocation = (b: any) => {
  if (!b) return '—';
  if (b.location) {
    if (typeof b.location === 'object') return b.location.name || b.location.address || '—';
    return String(b.location);
  }
  if (b.venue) {
    if (typeof b.venue === 'object') return b.venue.name || b.venue.city || '—';
    return String(b.venue);
  }
  return '—';
};

const getBookingAmount = (b: any) => {
  if (!b) return 0;
  return b.amountInr ?? b.amount ?? b.price ?? 0;
};

export default function BookingsPage() {
  const { can } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [coachMap, setCoachMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap]   = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<BookingStatus | 'All'>('All');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [bRes, cRes, uRes] = await Promise.allSettled([
        getAdminBookings({ limit: 200 }),
        getAdminCoaches({ limit: 200 }),
        getCustomers({ limit: 200 })
      ]);

      if (cRes.status === 'fulfilled') {
        const rawC = extractDataList(cRes.value);
        const cm: Record<string, string> = {};
        for (const c of rawC) {
          const id = String(c.id || c._id || '');
          const n = c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim();
          if (id && n) cm[id] = n;
        }
        setCoachMap(cm);
      }

      if (uRes.status === 'fulfilled') {
        const rawU = extractDataList(uRes.value);
        const um: Record<string, string> = {};
        for (const u of rawU) {
          const id = String(u.id || u._id || '');
          const n = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
          if (id && n) um[id] = n;
        }
        setUserMap(um);
      }

      if (bRes.status === 'fulfilled') {
        const rawData = extractDataList<Booking>(bRes.value);
        const seen = new Set<string>();
        const unique: Booking[] = [];
        for (const b of rawData) {
          const id = b.id || (b as any)._id;
          if (id && !seen.has(String(id))) {
            seen.add(String(id));
            unique.push(b);
          } else if (!id) {
            unique.push(b);
          }
        }
        setBookings(unique);
      } else {
        setBookings([]);
      }
    } catch (e: any) {
      console.warn('Failed to load bookings:', e?.message || e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter(b => {
    const userStr = getBookingUserName(b, userMap);
    const coachStr = getBookingCoachName(b, coachMap);
    const sportStr = getBookingSport(b);
    const locStr = getBookingLocation(b);
    const idStr = getBookingId(b);

    const matchSearch = search === '' ||
      `${idStr} ${userStr} ${coachStr} ${sportStr} ${locStr}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || b.status === filter;
    return matchSearch && matchFilter;
  });

  const handleStatus = async (id: string, status: BookingStatus) => {
    if (!id) return;
    try {
      await updateBookingStatus(id, status);
      setBookings(prev => prev.map(b => getBookingId(b) === id ? { ...b, status } : b));
    } catch (err: any) {
      alert(err.message || 'Failed to update booking');
    }
  };

  const stats = {
    total:     bookings.length,
    pending:   bookings.filter(b => b.status === 'requested' || b.status === 'accepted').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    noShow:    bookings.filter(b => b.status === 'no_show').length,
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 min-w-0 max-w-full">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Bookings"  value={String(stats.total)}     sub="All recorded sessions"  icon={<CalendarDays className="h-4 w-4 text-[#F05A22]" />}  iconBg="bg-[#F05A22]/10" subColor="text-slate-600" />
        <StatCard label="Pending Action"  value={String(stats.pending)}   sub="Requested & accepted"   icon={<Clock        className="h-4 w-4 text-amber-500" />}  iconBg="bg-amber-50"     subColor="text-amber-600" />
        <StatCard label="Completed"       value={String(stats.completed)} sub="Delivered sessions"     icon={<CheckCircle  className="h-4 w-4 text-emerald-500" />}iconBg="bg-emerald-50"   subColor="text-emerald-600" />
        <StatCard label="Cancelled"       value={String(stats.cancelled)} sub="Refunds & cancellations" icon={<XCircle      className="h-4 w-4 text-rose-500" />}   iconBg="bg-rose-50"      subColor="text-rose-600" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookings ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by customer, coach, sport..." />
            <div className="flex gap-1 flex-wrap">
              <FilterPill label="All" active={filter === 'All'} onClick={() => setFilter('All')} />
              {FILTERS.map(f => (
                <FilterPill key={f} label={f.replace('_', ' ')} active={filter === f} onClick={() => setFilter(f)} />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<CalendarDays className="h-8 w-8 text-slate-300" />} title="No bookings found" />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Booking ID</Th>
                  <Th>User / Customer</Th>
                  <Th>Coach</Th>
                  <Th>Sport</Th>
                  <Th>Date & Time</Th>
                  <Th>Location</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  {can('bookings_write') && <Th className="text-right">Actions</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map(b => {
                  const bId = getBookingId(b);
                  const userName = getBookingUserName(b, userMap);
                  const coachName = getBookingCoachName(b, coachMap);
                  const sportName = getBookingSport(b);
                  const locName = getBookingLocation(b);
                  const amount = getBookingAmount(b);
                  const statusStr = String(b.status || 'requested');

                  return (
                    <Tr key={bId || Math.random()}>
                      <Td>
                        <span className="text-[11px] font-mono font-bold text-slate-700">
                          #{bId ? bId.slice(-6).toUpperCase() : 'N/A'}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-sm font-semibold text-slate-900 truncate max-w-[150px] block" title={userName}>
                          {userName}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-sm font-semibold text-slate-900 truncate max-w-[150px] block" title={coachName}>
                          {coachName}
                        </span>
                      </Td>
                      <Td><Badge className="badge-blue">{sportName}</Badge></Td>
                      <Td><span className="text-xs text-slate-600 whitespace-nowrap">{b.date || '—'} {b.time || ''}</span></Td>
                      <Td><span className="text-xs text-slate-600 truncate max-w-[140px] block" title={locName}>{locName}</span></Td>
                      <Td><span className="text-sm font-bold text-slate-900">₹{amount.toLocaleString()}</span></Td>
                      <Td><Badge className={STATUS_MAP[statusStr] || 'badge-gray'}>{statusStr.replace('_', ' ')}</Badge></Td>
                      {can('bookings_write') && (
                        <Td className="text-right">
                          {statusStr === 'requested' && (
                            <div className="flex justify-end gap-1 whitespace-nowrap">
                              <Button variant="primary" className="h-7 text-[10px] px-2.5"
                                onClick={() => handleStatus(bId, 'confirmed')}>Confirm</Button>
                              <Button variant="danger" className="h-7 text-[10px] px-2.5"
                                onClick={() => handleStatus(bId, 'cancelled')}>Cancel</Button>
                            </div>
                          )}
                          {statusStr === 'confirmed' && (
                            <div className="flex justify-end whitespace-nowrap">
                              <Button variant="primary" className="h-7 text-[10px] px-2.5"
                                onClick={() => handleStatus(bId, 'completed')}>Mark Done</Button>
                            </div>
                          )}
                        </Td>
                      )}
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
