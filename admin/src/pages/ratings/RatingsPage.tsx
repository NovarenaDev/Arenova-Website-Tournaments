import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Flag, Eye, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Button, SearchBar, FilterPill, StatCard, Stars, ProgressBar, Table, Thead, Tbody, Th, Td, Tr, EmptyState, Modal, ConfirmDialog, DetailRow } from '../../components/ui';
import { getAdminReviews, flagReview, deleteReview, getAdminCoaches, getCustomers, extractDataList } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

type Review = { id: string; bookingId: string; user: string; coach: string; rating: number; text: string; tags: string[]; flagged: boolean; date: string; };
const FILTERS = ['All', 'Flagged', '5 Star', '1-2 Star'];

function ReviewDetailModal({ r, open, onClose }: { r: Review | null; open: boolean; onClose: () => void }) {
  if (!r) return null;
  const initials = String(r.user || 'User').split(' ').map(n => n[0]).join('').slice(0, 2);
  return (
    <Modal open={open} onClose={onClose} title="Review Details" size="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Avatar initials={initials} size={36} />
            <div>
              <p className="font-bold text-slate-900 text-sm">{r.user}</p>
              <p className="text-xs text-slate-500">Booking #{String(r.bookingId || '').slice(-6).toUpperCase()} · {r.date}</p>
            </div>
          </div>
          <Stars rating={r.rating} />
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-700 italic leading-relaxed">"{r.text}"</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Coach"  value={<span className="font-semibold text-slate-900">{r.coach}</span>} />
          <DetailRow label="Rating" value={<span className="text-amber-500 font-bold">{r.rating}/5 ★</span>} />
          <DetailRow label="Status" value={r.flagged ? <Badge className="badge-amber">Flagged for Review</Badge> : <Badge className="badge-green">Verified Clean</Badge>} />
          <DetailRow label="Date"   value={<span className="text-slate-700">{r.date}</span>} />
        </div>
        {r.tags?.length > 0 && (
          <DetailRow label="Tags" value={<div className="flex gap-1.5 flex-wrap mt-0.5">{r.tags.map(t => <Badge key={t} className="badge-blue">{t}</Badge>)}</div>} />
        )}
      </div>
    </Modal>
  );
}

export default function RatingsPage() {
  const { can } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coachMap, setCoachMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');
  const [viewR, setViewR]     = useState<Review | null>(null);
  const [deleteR, setDeleteR] = useState<Review | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [reviewRes, coachRes, customerRes] = await Promise.allSettled([
        getAdminReviews({ limit: 200 }),
        getAdminCoaches({ limit: 200 }),
        getCustomers({ limit: 200 }),
      ]);

      const cm: Record<string, string> = {};
      if (coachRes.status === 'fulfilled') {
        const rawC = extractDataList(coachRes.value);
        for (const c of rawC) {
          const id = String(c.id || c._id || '');
          const n = c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim();
          if (id && n) cm[id] = n;
        }
        setCoachMap(cm);
      }

      const um: Record<string, string> = {};
      if (customerRes.status === 'fulfilled') {
        const rawU = extractDataList(customerRes.value);
        for (const u of rawU) {
          const id = String(u.id || u._id || '');
          const n = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
          if (id && n) um[id] = n;
        }
        setUserMap(um);
      }

      if (reviewRes.status === 'fulfilled') {
        const rawReviews = extractDataList<any>(reviewRes.value);
        const seenR = new Set<string>();
        const mapped: Review[] = [];

        for (const r of rawReviews) {
          const id = String(r.id || r._id || '');
          if (id && seenR.has(id)) continue;
          if (id) seenR.add(id);

          // Resolve User Name
          let userName = 'Customer';
          if (r.userName) userName = r.userName;
          else if (r.customerName) userName = r.customerName;
          else if (typeof r.user === 'object' && r.user !== null) {
            userName = r.user.name || `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() || 'Customer';
          } else if (r.user && um[String(r.user)]) {
            userName = um[String(r.user)];
          } else if (r.user && !/^[0-9a-fA-F]{24}$/.test(String(r.user))) {
            userName = String(r.user);
          } else if (r.userId && um[String(r.userId)]) {
            userName = um[String(r.userId)];
          }

          // Resolve Coach Name
          let coachName = 'Coach';
          if (r.coachName) coachName = r.coachName;
          else if (typeof r.coach === 'object' && r.coach !== null) {
            coachName = r.coach.name || `${r.coach.firstName || ''} ${r.coach.lastName || ''}`.trim() || 'Coach';
          } else if (r.coach && cm[String(r.coach)]) {
            coachName = cm[String(r.coach)];
          } else if (r.coach && !/^[0-9a-fA-F]{24}$/.test(String(r.coach))) {
            coachName = String(r.coach);
          } else if (r.coachId && cm[String(r.coachId)]) {
            coachName = cm[String(r.coachId)];
          }

          mapped.push({
            id: id || `REV_${Math.random().toString(36).substring(7)}`,
            bookingId: String(r.bookingId || r.booking || ''),
            user: userName,
            coach: coachName,
            rating: Number(r.rating) || 5,
            text: r.comment || r.text || r.review || 'No feedback text provided.',
            tags: Array.isArray(r.tags) ? r.tags : [],
            flagged: Boolean(r.flagged),
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—'
          });
        }
        setReviews(mapped);
      } else {
        setReviews([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reviewList = Array.isArray(reviews) ? reviews : [];
  const filtered = reviewList.filter(r => {
    const matchSearch = `${r.user} ${r.coach} ${r.text}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' ? !r.flagged :
      (filter === 'Flagged' && r.flagged) ||
      (filter === '5 Star' && r.rating === 5 && !r.flagged) ||
      (filter === '1-2 Star' && r.rating <= 2 && !r.flagged);
    return matchSearch && matchFilter;
  });

  const handleFlag = async (id: string) => {
    try {
      await flagReview(id);
      setReviews(p => p.map(r => r.id === id ? { ...r, flagged: true } : r));
    } catch (err: any) { alert(err.message || 'Flag failed'); }
  };
  const handleUnflag = (id: string) => setReviews(p => p.map(r => r.id === id ? { ...r, flagged: false } : r));

  const handleDelete = async () => {
    if (!deleteR) return;
    try {
      await deleteReview(deleteR.id);
      setReviews(p => p.filter(r => r.id !== deleteR.id));
    } catch (err: any) { alert(err.message || 'Delete failed'); }
    finally { setDeleteR(null); }
  };

  const dist = [5, 4, 3, 2, 1].map(s => ({ stars: s, count: reviews.filter(r => r.rating === s).length, color: s >= 4 ? 'bg-emerald-500' : s === 3 ? 'bg-slate-400' : 'bg-rose-500' }));
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0';
  const flaggedItems = reviews.filter(r => r.flagged);

  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 min-w-0 max-w-full">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Avg Rating"      value={`${avgRating} ★`}           sub={`${reviews.length} total reviews`} icon={<span style={{ fontSize: 14 }}>⭐</span>} iconBg="bg-amber-50"   subColor="text-amber-600" />
        <StatCard label="5-Star Reviews"  value={`${reviews.length ? Math.round(reviews.filter(r => r.rating === 5).length / reviews.length * 100) : 0}%`} sub="Highest satisfaction" icon={<span style={{ fontSize: 14 }}>🏆</span>} iconBg="bg-emerald-50" subColor="text-emerald-600" />
        <StatCard label="Flagged Reviews" value={String(flaggedItems.length)} sub="Needs moderation review"   icon={<ShieldAlert className="h-4 w-4 text-amber-500" />} iconBg="bg-amber-50" subColor="text-amber-600" />
        <StatCard label="Total Reviews"   value={String(reviews.length)}      sub="Platform all time"           icon={<span style={{ fontSize: 14 }}>💬</span>} iconBg="bg-blue-50" subColor="text-slate-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3 min-w-0">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Rating Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {dist.map(d => (
              <ProgressBar key={d.stars} label={`${d.stars} Stars`} value={d.count}
                pct={reviews.length ? Math.round((d.count / reviews.length) * 100) : 0} color={d.color} />
            ))}
          </CardContent>
        </Card>

        <Card className={flaggedItems.length > 0 ? "border-amber-200 bg-amber-50/20" : ""}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-slate-900">Flagged Reviews ({flaggedItems.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {flaggedItems.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 italic">No flagged reviews needing moderation</p>
            ) : (
              flaggedItems.map(r => (
                <div key={r.id} className="rounded-xl border border-amber-200 bg-white p-3 min-w-0 shadow-xs">
                  <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar initials={r.user.split(' ').map(n => n[0]).join('').slice(0, 2)} size={26} className="flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{r.user}</span>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-[11px] text-slate-600 italic mb-2 leading-relaxed break-words">"{r.text}"</p>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-medium truncate">Coach: {r.coach} · {r.date}</span>
                    {can('ratings_write') && (
                      <div className="flex gap-1.5 whitespace-nowrap">
                        <Button variant="danger" className="h-6 text-[9px] px-2" onClick={() => setDeleteR(r)}>Remove</Button>
                        <Button variant="outline" className="h-6 text-[9px] px-2" onClick={() => handleUnflag(r.id)}>Dismiss</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search reviews..." />
            <div className="flex gap-1 flex-wrap">
              {FILTERS.map(f => <FilterPill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <Thead>
                  <Tr className="hover:bg-transparent">
                    <Th>Booking</Th>
                    <Th>User / Customer</Th>
                    <Th>Coach</Th>
                    <Th>Rating</Th>
                    <Th>Review</Th>
                    <Th>Date</Th>
                    <Th className="text-right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7}><EmptyState icon={<ShieldAlert className="h-8 w-8 text-slate-300" />} title="No reviews found" /></td></tr>
                  ) : (
                    filtered.map(r => (
                      <Tr key={r.id}>
                        <Td className="text-slate-500 font-mono text-[11px] font-medium">#{r.bookingId ? String(r.bookingId).slice(-6).toUpperCase() : 'N/A'}</Td>
                        <Td>
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar initials={r.user.split(' ').map(n => n[0]).join('').slice(0, 2)} size={26} className="flex-shrink-0" />
                            <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">{r.user}</span>
                          </div>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar initials={r.coach.split(' ').map(n => n[0]).join('').slice(0, 2)} size={26} className="flex-shrink-0" />
                            <span className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">{r.coach}</span>
                          </div>
                        </Td>
                        <Td><Stars rating={r.rating} /></Td>
                        <Td><p className="max-w-[200px] truncate text-xs text-slate-700" title={r.text}>"{r.text}"</p></Td>
                        <Td className="text-slate-500 text-xs whitespace-nowrap">{r.date}</Td>
                        <Td className="text-right pr-4">
                          <div className="flex justify-end gap-1.5">
                            <Button variant="outline" className="h-7 text-[10px] px-2.5" onClick={() => setViewR(r)} title="View Review Details"><Eye className="h-3 w-3" /></Button>
                            {can('ratings_write') && (
                              <>
                                {!r.flagged && <Button variant="outline" className="h-7 text-[10px] px-2 text-amber-600 border-amber-300 hover:bg-amber-50" onClick={() => handleFlag(r.id)} title="Flag Review"><Flag className="h-3 w-3" /></Button>}
                                {r.flagged  && <Button variant="outline" className="h-7 text-[10px] px-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => handleUnflag(r.id)}>Unflag</Button>}
                                <Button variant="danger" className="h-7 text-[10px] px-2" onClick={() => setDeleteR(r)} title="Delete Review"><Trash2 className="h-3 w-3" /></Button>
                              </>
                            )}
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewDetailModal r={viewR} open={!!viewR} onClose={() => setViewR(null)} />
      <ConfirmDialog open={!!deleteR} onClose={() => setDeleteR(null)} title="Delete Review"
        message={`Permanently delete this review by ${deleteR?.user}?`} confirmLabel="Delete"
        danger onConfirm={handleDelete} />
    </div>
  );
}
