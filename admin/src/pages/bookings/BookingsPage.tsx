import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, SearchBar, FilterPill, StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState } from '../../components/ui';
import { getAdminBookings, updateBookingStatus } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking, BookingStatus } from '../../types';


const STATUS_MAP: Record<string, string> = {
  requested: 'badge-amber', accepted: 'badge-blue', confirmed: 'badge-blue',
  completed: 'badge-green', cancelled: 'badge-red', no_show: 'badge-gray',
};
const FILTERS: BookingStatus[] = ['requested','accepted','confirmed','completed','cancelled','no_show'];

const getBookingId = (b: any) => b._id || b.id || '';

const getBookingUserName = (b: any) => {
  if (!b || !b.user) return 'User';
  if (typeof b.user === 'object') {
    const fn = b.user.firstName || b.user.name || '';
    const ln = b.user.lastName || '';
    return `${fn} ${ln}`.trim() || 'User';
  }
  return String(b.user);
};

const getBookingCoachName = (b: any) => {
  if (!b || !b.coach) return 'Coach';
  if (typeof b.coach === 'object') {
    return b.coach.name || `${b.coach.firstName || ''} ${b.coach.lastName || ''}`.trim() || 'Coach';
  }
  return String(b.coach);
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
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<BookingStatus | 'All'>('All');

  const load = useCallback(async () => {
    try {
      const res = await getAdminBookings({ limit: 200 });
      const rawData = res.data || res || [];
      setBookings(Array.isArray(rawData) ? rawData : []);
    } catch (e) {
      console.error('Failed to load bookings:', e);
      setBookings([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter(b => {
    const userStr = getBookingUserName(b);
    const coachStr = getBookingCoachName(b);
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
    <div className="flex flex-col gap-5 p-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total"     value={String(stats.total)}     icon={<CalendarDays className="h-4 w-4 text-[#F05A22]"/>}     iconBg="bg-[#F05A22]/10" />
        <StatCard label="Pending"   value={String(stats.pending)}   icon={<Clock className="h-4 w-4 text-amber-400"/>}            iconBg="bg-amber-400/10" />
        <StatCard label="Completed" value={String(stats.completed)} icon={<CheckCircle className="h-4 w-4 text-emerald-400"/>}    iconBg="bg-emerald-400/10" />
        <StatCard label="Cancelled" value={String(stats.cancelled)} icon={<XCircle className="h-4 w-4 text-red-400"/>}            iconBg="bg-red-400/10" />
        <StatCard label="No-Show"   value={String(stats.noShow)}    icon={<AlertTriangle className="h-4 w-4 text-[#5c6370]"/>}   iconBg="bg-[#5c6370]/10" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookings ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search bookings..." />
            <div className="flex gap-1 flex-wrap">
              <FilterPill label="All" active={filter === 'All'} onClick={() => setFilter('All')} />
              {FILTERS.map(f => <FilterPill key={f} label={f.replace('_', ' ')} active={filter === f} onClick={() => setFilter(f)} />)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="No bookings found" />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Booking ID</Th>
                  <Th>User</Th>
                  <Th>Coach</Th>
                  <Th>Sport</Th>
                  <Th>Date & Time</Th>
                  <Th>Location</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  {can('bookings_write') && <Th>Actions</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map(b => {
                  const bId = getBookingId(b);
                  const userName = getBookingUserName(b);
                  const coachName = getBookingCoachName(b);
                  const sportName = getBookingSport(b);
                  const locName = getBookingLocation(b);
                  const amount = getBookingAmount(b);
                  const statusStr = String(b.status || 'requested');

                  return (
                    <Tr key={bId || Math.random()}>
                      <Td><span className="text-[11px] font-mono text-[#5c6370]">#{bId ? bId.slice(-6).toUpperCase() : 'N/A'}</span></Td>
                      <Td><span className="text-sm text-white font-medium">{userName}</span></Td>
                      <Td><span className="text-sm text-white">{coachName}</span></Td>
                      <Td><Badge className="badge-blue">{sportName}</Badge></Td>
                      <Td><span className="text-xs text-[#9ba3af]">{b.date || '—'} {b.time || ''}</span></Td>
                      <Td><span className="text-xs text-[#9ba3af]">{locName}</span></Td>
                      <Td><span className="text-sm font-medium text-emerald-400">₹{amount}</span></Td>
                      <Td><Badge className={STATUS_MAP[statusStr] || 'badge-gray'}>{statusStr.replace('_', ' ')}</Badge></Td>
                      {can('bookings_write') && (
                        <Td>
                          {statusStr === 'requested' && (
                            <div className="flex gap-1">
                              <Button variant="primary" className="h-6 text-[10px] px-2"
                                onClick={() => handleStatus(bId, 'confirmed')}>Confirm</Button>
                              <Button variant="danger" className="h-6 text-[10px] px-2"
                                onClick={() => handleStatus(bId, 'cancelled')}>Cancel</Button>
                            </div>
                          )}
                          {statusStr === 'confirmed' && (
                            <Button variant="primary" className="h-6 text-[10px] px-2"
                              onClick={() => handleStatus(bId, 'completed')}>Mark Done</Button>
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

