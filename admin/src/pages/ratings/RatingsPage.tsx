import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Flag, Eye, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Button, SearchBar, FilterPill, StatCard, Stars, ProgressBar, Table, Thead, Tbody, Th, Td, Tr, EmptyState, Modal, ConfirmDialog, DetailRow } from '../../components/ui';
import { getAdminReviews, flagReview, deleteReview, getAdminCoaches, extractDataList } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

type Review = { id: string; bookingId: string; user: string; coach: string; rating: number; text: string; tags: string[]; flagged: boolean; date: string; };
const FILTERS = ['All', 'Flagged', '5 Star', '1-2 Star'];

function ReviewDetailModal({ r, open, onClose }: { r: Review | null; open: boolean; onClose: () => void }) {
  if (!r) return null;
  return (
    <Modal open={open} onClose={onClose} title="Review Details" size="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar initials={r.user.split(' ').map(n => n[0]).join('').slice(0, 2)} size={36} />
            <div>
              <p className="font-semibold text-white">{r.user}</p>
              <p className="text-xs text-[#5c6370]">Booking {r.bookingId} · {r.date}</p>
            </div>
          </div>
          <Stars rating={r.rating} />
        </div>
        <div className="bg-[#0e0f11] border border-[#2e3139] rounded-xl p-4">
          <p className="text-sm text-[#9ba3af] italic leading-relaxed">"{r.text}"</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Coach"  value={r.coach} />
          <DetailRow label="Rating" value={<span className="text-amber-400 font-semibold">{r.rating}/5 ★</span>} />
          <DetailRow label="Status" value={r.flagged ? <Badge className="badge-amber">Flagged</Badge> : <Badge className="badge-green">Clean</Badge>} />
          <DetailRow label="Date"   value={r.date} />
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
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');
  const [viewR, setViewR]     = useState<Review | null>(null);
  const [deleteR, setDeleteR] = useState<Review | null>(null);

  const load = useCallback(async () => {
    try {
      const [reviewRes, coachRes] = await Promise.all([
        getAdminReviews({ limit: 200 }).catch(() => ({ data: [] })),
        getAdminCoaches({ limit: 100 }).catch(() => ({ data: [] })),
      ]);
      const rawReviews = extractDataList<Review>(reviewRes);
      const seenR = new Set<string>();
      const uniqueReviews: Review[] = [];
      for (const r of rawReviews) {
        const id = r.id || (r as any)._id;
        if (id && !seenR.has(String(id))) {
          seenR.add(String(id));
          uniqueReviews.push(r);
        } else if (!id) {
          uniqueReviews.push(r);
        }
      }
      setReviews(uniqueReviews);

      const rawCoaches = extractDataList(coachRes);
      const seenC = new Set<string>();
      const uniqueCoaches: any[] = [];
      for (const c of rawCoaches) {
        const id = c.id || c._id;
        if (id && !seenC.has(String(id))) {
          seenC.add(String(id));
          uniqueCoaches.push(c);
        } else if (!id) {
          uniqueCoaches.push(c);
        }
      }
      setCoaches(uniqueCoaches);
    } finally { setLoading(false); }
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

  const dist = [5, 4, 3, 2, 1].map(s => ({ stars: s, count: reviews.filter(r => r.rating === s).length, color: s >= 4 ? 'bg-emerald-500' : s === 3 ? 'bg-[#5c6370]' : 'bg-red-500' }));
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0';
  const flaggedItems = reviews.filter(r => r.flagged);

  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 min-w-0 max-w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Avg Rating"      value={`${avgRating} ★`}           sub={`${reviews.length} reviews`} icon={<span style={{ fontSize: 14 }}>⭐</span>} iconBg="bg-amber-500/10"   subColor="text-emerald-400" />
        <StatCard label="5-Star Reviews"  value={`${reviews.length ? Math.round(reviews.filter(r => r.rating === 5).length / reviews.length * 100) : 0}%`} sub="of all reviews" icon={<span style={{ fontSize: 14 }}>🏆</span>} iconBg="bg-emerald-500/10" subColor="text-emerald-400" />
        <StatCard label="Flagged Reviews" value={String(flaggedItems.length)} sub="Needs moderation"           icon={<ShieldAlert className="h-4 w-4 text-amber-400" />} iconBg="bg-amber-500/10" subColor="text-amber-400" />
        <StatCard label="Total Reviews"   value={String(reviews.length)}      sub="All time"                   icon={<span style={{ fontSize: 14 }}>💬</span>} iconBg="bg-blue-500/10" subColor="text-[#5c6370]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3 min-w-0">
        <Card>
          <CardHeader><CardTitle>Rating Distribution</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {dist.map(d => <ProgressBar key={d.stars} label={`${'★'.repeat(d.stars)}${'☆'.repeat(5 - d.stars)} ${d.stars} star${d.stars > 1 ? 's' : ''}`} value={d.count} pct={reviews.length ? (d.count / reviews.length) * 100 : 0} color={d.color} />)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Rated Coaches</CardTitle></CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <Thead><Tr className="hover:bg-transparent"><Th>Coach</Th><Th>Rating</Th><Th className="text-right">Reviews</Th></Tr></Thead>
              <Tbody>
                {[...coaches].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5).map(c => (
                  <Tr key={c.id}>
                    <Td><div className="flex items-center gap-2 min-w-0"><Avatar initials={(c.name || 'U').split(' ').map((n: string) => n[0]).join('')} size={28} className="flex-shrink-0" /><span className="text-xs text-white truncate max-w-[120px]">{(c.name || '').split(' ')[0]} {(c.name || '').split(' ')[1]?.[0]}.</span></div></Td>
                    <Td><div className="flex items-center gap-1"><span className="text-amber-400" style={{ fontSize: 11 }}>★</span><span className="text-xs font-medium">{c.rating || 0}</span></div></Td>
                    <Td className="text-right text-[#9ba3af]">{Math.round((c.sessions || 0) * 0.6)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-400" /><CardTitle className="text-red-400">Flagged Reviews</CardTitle></div></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {flaggedItems.length === 0 ? <p className="text-xs text-[#5c6370] text-center py-4">No flagged reviews</p>
              : flaggedItems.map(r => (
                <div key={r.id} className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 min-w-0">
                  <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0"><Avatar initials={r.user.split(' ').map(n => n[0]).join('').slice(0, 2)} size={26} className="flex-shrink-0" /><span className="text-xs font-medium text-white truncate max-w-[120px]">{r.user}</span></div>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-[11px] text-[#9ba3af] italic mb-2 leading-relaxed break-words">"{r.text}"</p>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] text-[#5c6370] truncate">Coach: {r.coach} · {r.date}</span>
                    {can('ratings_write') && (
                      <div className="flex gap-1.5 whitespace-nowrap">
                        <Button variant="danger" className="h-6 text-[9px] px-2" onClick={() => setDeleteR(r)}>Remove</Button>
                        <Button variant="outline" className="h-6 text-[9px] px-2" onClick={() => handleUnflag(r.id)}>Dismiss</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews ({filtered.length})</CardTitle>
          <SearchBar value={search} onChange={setSearch} placeholder="Search reviews..." />
        </CardHeader>
        <div className="flex flex-wrap gap-2 border-b border-[#2e3139] px-4 sm:px-5 pb-3">
          {FILTERS.map(f => <FilterPill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />)}
        </div>
        <CardContent className="px-0 pb-0">
          {loading ? <div className="flex justify-center py-12"><div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" /></div>
            : (
              <div className="overflow-x-auto">
                <Table>
                  <Thead><Tr className="hover:bg-transparent"><Th>Booking</Th><Th>User</Th><Th>Coach</Th><Th>Rating</Th><Th>Review</Th><Th>Date</Th><Th>Actions</Th></Tr></Thead>
                  <Tbody>
                    {filtered.length === 0 ? <tr><td colSpan={7}><EmptyState icon={<ShieldAlert className="h-8 w-8" />} title="No reviews found" /></td></tr>
                      : filtered.map(r => (
                        <Tr key={r.id}>
                          <Td className="text-[#5c6370] font-mono">{r.bookingId}</Td>
                          <Td><div className="flex items-center gap-2 min-w-0"><Avatar initials={r.user.split(' ').map(n => n[0]).join('').slice(0, 2)} size={26} className="flex-shrink-0" /><span className="text-xs text-white truncate max-w-[120px]">{r.user}</span></div></Td>
                          <Td><div className="flex items-center gap-2 min-w-0"><Avatar initials={r.coach.split(' ').map(n => n[0]).join('').slice(0, 2)} size={26} className="flex-shrink-0" /><span className="text-xs text-[#9ba3af] truncate max-w-[120px]">{r.coach}</span></div></Td>
                          <Td><div className="flex items-center gap-2"><Avatar initials={r.coach.split(' ').map(n => n[0]).join('').slice(0, 2)} size={26} /><span className="text-xs text-[#9ba3af]">{r.coach}</span></div></Td>
                          <Td><Stars rating={r.rating} /></Td>
                          <Td><p className="max-w-[180px] truncate text-xs text-[#9ba3af]">"{r.text}"</p></Td>
                          <Td className="text-[#5c6370]">{r.date}</Td>
                          <Td className="pr-4">
                            <div className="flex gap-1.5">
                              <Button variant="outline" className="h-7 text-[10px] px-2" onClick={() => setViewR(r)}><Eye className="h-3 w-3" /></Button>
                              {can('ratings_write') && <>
                                {!r.flagged && <Button variant="outline" className="h-7 text-[10px] px-2 text-amber-400 border-amber-500/25" onClick={() => handleFlag(r.id)}><Flag className="h-3 w-3" /></Button>}
                                {r.flagged  && <Button variant="outline" className="h-7 text-[10px] px-2 text-emerald-400 border-emerald-500/25" onClick={() => handleUnflag(r.id)}>Unflag</Button>}
                                <Button variant="danger" className="h-7 text-[10px] px-2" onClick={() => setDeleteR(r)}><Trash2 className="h-3 w-3" /></Button>
                              </>}
                            </div>
                          </Td>
                        </Tr>
                      ))}
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
