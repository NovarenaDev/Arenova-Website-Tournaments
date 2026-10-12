import { useState, useEffect, useCallback } from 'react';
import { Star, CheckCircle, XCircle, Clock, FileText, ChevronDown, ChevronUp, Ban, Trash2, Phone, Mail, MapPin, Calendar, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Button, SearchBar, FilterPill, StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState, ConfirmDialog, Modal, Input } from '../../components/ui';
import { getAdminCoaches, approveKyc, rejectKyc, banCoach, deleteAdminCoach, uploadImage, updateAdminCoach } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Coach } from '../../types';


const KYC_MAP: Record<string, string> = { approved: 'badge-green', pending: 'badge-amber', rejected: 'badge-red', under_review: 'badge-blue' };
const FILTERS = ['All', 'Active', 'Banned', 'Rejected'];

function fmt(n?: number) {
  if (n === undefined || n === null) return '₹0';
  return '₹' + n.toLocaleString('en-IN');
}

const getInitials = (name?: string) => {
  if (!name) return 'U';
  return name.trim().split(/\s+/).map(n => n[0] || '').join('').slice(0, 2).toUpperCase() || 'U';
};

export default function CoachesPage() {
  const { can } = useAuth();
  const [coaches, setCoaches]         = useState<Coach[]>([]);
  const [applications, setApps]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const [approveModal, setApproveModal] = useState<{
    id: string;
    name: string;
    individualPrice: string;
    groupPricePerPerson: string;
    requestedIndividualPrice?: number;
    requestedGroupPricePerPerson?: number;
  } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string; reason: string } | null>(null);
  const [banModal, setBanModal] = useState<{ id: string; name: string; reason: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);

  const [avatarUpload, setAvatarUpload] = useState<{ coachId: string; coachName: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const openApproveModal = (coach: any) => {
    const reqInd =
      coach.requestedIndividualPrice ??
      coach.requestedIndividualFee ??
      coach.requestedPrice ??
      coach.requestedFee ??
      coach.individualFee ??
      coach.fee ??
      coach.fees ??
      coach.sessionFee ??
      coach.hourlyRate ??
      coach.price ??
      coach.pricing?.individual ??
      coach.pricing?.individualPrice ??
      coach.profile?.requestedIndividualPrice;

    const reqGrp =
      coach.requestedGroupPricePerPerson ??
      coach.requestedGroupPrice ??
      coach.requestedGroupFee ??
      coach.groupFee ??
      coach.pricing?.group ??
      coach.pricing?.groupPricePerPerson ??
      coach.profile?.requestedGroupPricePerPerson;

    const initInd =
      reqInd !== undefined && reqInd !== null
        ? String(reqInd)
        : (coach.individualPrice !== undefined && coach.individualPrice !== null ? String(coach.individualPrice) : '');

    const initGrp =
      reqGrp !== undefined && reqGrp !== null
        ? String(reqGrp)
        : (coach.groupPricePerPerson !== undefined && coach.groupPricePerPerson !== null ? String(coach.groupPricePerPerson) : '');

    setApproveModal({
      id: coach.id || coach._id,
      name: coach.name,
      individualPrice: initInd,
      groupPricePerPerson: initGrp,
      requestedIndividualPrice: reqInd !== undefined && reqInd !== null ? Number(reqInd) : undefined,
      requestedGroupPricePerPerson: reqGrp !== undefined && reqGrp !== null ? Number(reqGrp) : undefined,
    });
  };

  const load = useCallback(async () => {
    try {
      const coachRes = await getAdminCoaches({ limit: 100 }).catch(() => ({ data: [] }));
      const rawList = coachRes.data || coachRes.coaches || (Array.isArray(coachRes) ? coachRes : []);
      const coachData = rawList.map((c: any) => ({
        ...c,
        kyc: c.kyc || 'pending'
      }));
      setCoaches(coachData);
      
      // Derive applications locally from coaches with under_review or pending kyc status
      const apps = coachData.filter((c: any) => c.kyc === 'under_review' || c.kyc === 'pending');
      setApps(apps);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = coaches.filter(c => {
    const phone = c.phone || c.phoneNumber || c.mobile || c.mobileNumber || c.contact || c.user?.phone || c.user?.phoneNumber || '';
    const matchSearch = search === '' ||
      `${c.name || ''} ${c.email || ''} ${phone} ${(c.sports || []).join(' ')}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' ? true :
      (filter === 'Active' && c.kyc === 'approved' && (c.isActive ?? true)) ||
      (filter === 'Banned' && (c.kyc === 'approved' || !c.kyc) && c.isActive === false) ||
      (filter === 'Rejected' && c.kyc === 'rejected');
    return matchSearch && matchFilter;
  });

  const handleApproveConfirm = async () => {
    if (!approveModal) return;
    const { id, individualPrice, groupPricePerPerson, requestedIndividualPrice, requestedGroupPricePerPerson } = approveModal;
    const indPrice = parseFloat(individualPrice) || requestedIndividualPrice || 0;
    const grpPrice = parseFloat(groupPricePerPerson) || requestedGroupPricePerPerson || 0;
    try {
      await approveKyc(id, indPrice, grpPrice);
      setCoaches(prev => prev.map(c => c.id === id || (c as any)._id === id ? { ...c, kyc: 'approved', individualPrice: indPrice, groupPricePerPerson: grpPrice } : c));
      setApps(prev => prev.filter(a => (a.id || a._id) !== id));
      setApproveModal(null);
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    const { id, reason } = rejectModal;
    if (!reason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    try {
      await rejectKyc(id, reason);
      setCoaches(prev => prev.map(c => c.id === id ? { ...c, kyc: 'rejected' } : c));
      setApps(prev => prev.filter(a => (a.id || a._id) !== id));
      setRejectModal(null);
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleBanConfirm = async () => {
    if (!banModal) return;
    const { id, reason } = banModal;
    if (!reason.trim()) {
      alert('Please enter a ban reason.');
      return;
    }
    try {
      await banCoach(id, reason);
      setCoaches(prev => prev.map(c => c.id === id ? { ...c, isActive: false } : c));
      setBanModal(null);
    } catch (err: any) {
      alert(err.message || 'Ban failed');
    }
  };

  const handleActivateConfirm = async (id: string) => {
    try {
      await updateAdminCoach(id, { isActive: true });
      setCoaches(prev => prev.map(c => c.id === id ? { ...c, isActive: true } : c));
    } catch (err: any) {
      alert(err.message || 'Activation failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    const { id } = deleteModal;
    try {
      await deleteAdminCoach(id);
      setCoaches(prev => prev.filter(c => c.id !== id));
      setApps(prev => prev.filter(a => (a.id || a._id) !== id));
      setDeleteModal(null);
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !avatarUpload) return;
    
    try {
      setUploadingAvatar(true);
      const res = await uploadImage(file);
      if (res.success) {
        // Update coach avatar in local state
        setCoaches(prev => prev.map(c => 
          c.id === avatarUpload.coachId ? { ...c, avatar: res.url } : c
        ));
        setAvatarUpload(null);
      }
    } catch (err: any) {
      alert(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const stats = {
    totalApproved: coaches.filter(c => c.kyc === 'approved').length,
    active:        coaches.filter(c => c.kyc === 'approved' && c.isActive).length,
    banned:        coaches.filter(c => c.kyc === 'approved' && !c.isActive).length,
    pending:       coaches.filter(c => c.kyc === 'under_review').length,
    rejected:      coaches.filter(c => c.kyc === 'rejected').length,
  };

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Coaches"    value={String(stats.totalApproved)} icon={<Award className="h-4 w-4 text-[#F05A22]"/>}         iconBg="bg-[#F05A22]/10" />
        <StatCard label="Active Coaches"   value={String(stats.active)}        icon={<CheckCircle className="h-4 w-4 text-emerald-400"/>}  iconBg="bg-emerald-400/10" />
        <StatCard label="Banned/Inactive"  value={String(stats.banned)}        icon={<Ban className="h-4 w-4 text-red-400"/>}              iconBg="bg-red-400/10" />
        <StatCard label="Pending KYC"      value={String(stats.pending)}       icon={<Clock className="h-4 w-4 text-amber-400"/>}           iconBg="bg-amber-400/10" />
        <StatCard label="Rejected KYC"     value={String(stats.rejected)}      icon={<XCircle className="h-4 w-4 text-rose-400"/>}          iconBg="bg-rose-400/10" />
      </div>

      {/* Pending Applications */}
      {applications.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Pending Applications ({applications.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {applications.map((app: any) => {
              const phone = app.phone || app.phoneNumber || app.mobile || app.mobileNumber || app.contact || app.user?.phone || app.user?.phoneNumber || app.profile?.phone || 'No phone';
              const reqInd = app.requestedIndividualPrice ?? app.individualPrice ?? app.fee ?? app.sessionFee;
              const reqGrp = app.requestedGroupPricePerPerson ?? app.groupPricePerPerson ?? app.groupFee;
              const hasFee = reqInd !== undefined || reqGrp !== undefined;

              return (
                <div key={app._id || app.id} className="border border-[#2e3139] rounded-xl bg-[#0e0f11] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Avatar initials={getInitials(app.name)} size={40} />
                      <div>
                        <p className="font-semibold text-white text-sm">{app.name || 'Unknown Coach'}</p>
                        <p className="text-[11px] text-[#5c6370]">{app.email || 'No email'} · <span className="text-gray-300 font-medium">{phone}</span></p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {(app.sports || []).map((s: string) => <Badge key={s} className="badge-blue">{s}</Badge>)}
                        </div>
                        {hasFee && (
                          <div className="mt-2.5 inline-flex items-center gap-3 bg-[#18191c] border border-[#2e3139] px-3 py-1.5 rounded-lg text-[11px]">
                            <span className="text-[#9ba3af]">Submitted Fee:</span>
                            <span className="text-emerald-400 font-medium">Individual: ₹{reqInd ?? 'N/A'}</span>
                            <span className="text-[#5c6370]">|</span>
                            <span className="text-emerald-400 font-medium">Group/person: ₹{reqGrp ?? 'N/A'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {can('coaches_write') && (
                      <div className="flex items-center gap-1.5">
                        <Button variant="primary" className="h-7 text-[10px] px-3"
                          onClick={() => openApproveModal(app)}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button variant="danger" className="h-7 text-[10px] px-3"
                          onClick={() => setRejectModal({ id: app._id || app.id, name: app.name, reason: '' })}>
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Coaches Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Coaches ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search coaches..." />
            <div className="flex gap-1 flex-wrap">
              {FILTERS.map(f => <FilterPill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Award className="h-8 w-8" />} title="No coaches found" />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th></Th>
                  <Th>Coach</Th>
                  <Th>Sports</Th>
                  <Th>KYC</Th>
                  <Th>Rating</Th>
                  <Th>Sessions</Th>
                  <Th>Net Earnings</Th>
                  <Th>Status</Th>
                  {can('coaches_write') && <Th>Actions</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map(c => {
                  const isExp = expanded === c.id;
                  return (
                    <>
                      <Tr key={c.id}>
                        <Td>
                          <button onClick={() => setExpanded(isExp ? null : c.id)} className="text-[#5c6370] hover:text-white">
                            {isExp ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <Avatar initials={getInitials(c.name)} size={34} />
                            <div>
                              <p className="text-sm font-medium text-white">{c.name || 'Unknown Coach'}</p>
                              <p className="text-[11px] text-[#5c6370]">{c.email || 'No email'}</p>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <div className="flex gap-1 flex-wrap">
                            {(c.sports || []).slice(0, 2).map(s => <Badge key={s} className="badge-blue">{s}</Badge>)}
                          </div>
                        </Td>
                        <Td><Badge className={KYC_MAP[c.kyc] || 'badge-gray'}>{c.kyc?.replace('_', ' ') || 'pending'}</Badge></Td>
                        <Td>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400" />
                            <span className="text-sm text-white">{c.rating || 0}</span>
                          </div>
                        </Td>
                        <Td><span className="text-sm text-white">{c.sessions || 0}</span></Td>
                        <Td><span className="text-sm text-emerald-400 font-medium">{fmt(c.netEarnings)}</span></Td>
                        <Td>
                          <Badge className={c.isActive ? 'badge-green' : 'badge-red'}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </Td>
                        {can('coaches_write') && (
                          <Td>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" className="h-7 text-[10px] px-2 text-blue-400 hover:bg-blue-400/10"
                                onClick={() => setAvatarUpload({ coachId: c.id, coachName: c.name })}>
                                Avatar
                              </Button>
                              {c.kyc === 'approved' ? (
                                c.isActive ? (
                                  <Button variant="ghost" className="h-7 text-[10px] px-2 text-red-400 hover:bg-red-400/10"
                                    onClick={() => setBanModal({ id: c.id, name: c.name, reason: '' })}>
                                    Ban
                                  </Button>
                                ) : (
                                  <Button variant="ghost" className="h-7 text-[10px] px-2 text-emerald-400 hover:bg-emerald-400/10"
                                    onClick={() => handleActivateConfirm(c.id)}>
                                    Activate
                                  </Button>
                                )
                              ) : c.kyc === 'rejected' ? (
                                <Button variant="primary" className="h-7 text-[10px] px-2"
                                  onClick={() => openApproveModal(c)}>
                                  Approve KYC
                                </Button>
                              ) : null}
                              <button className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-red-400 hover:bg-red-400/10"
                                onClick={() => setDeleteModal({ id: c.id, name: c.name })}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </Td>
                        )}
                      </Tr>
                      {isExp && (
                        <Tr key={c.id + '-exp'}>
                          <Td colSpan={can('coaches_write') ? 9 : 8}>
                            <div className="px-4 py-3 bg-[#0e0f11] rounded-xl border border-[#2e3139] m-1 grid grid-cols-2 gap-3 lg:grid-cols-4">
                              <div><p className="text-[10px] text-[#5c6370] mb-1">Phone</p><p className="text-xs text-white font-medium">{c.phone || c.phoneNumber || c.mobile || c.mobileNumber || c.contact || c.user?.phone || c.user?.phoneNumber || c.profile?.phone || 'N/A'}</p></div>
                              <div><p className="text-[10px] text-[#5c6370] mb-1">Joined</p><p className="text-xs text-white">{c.joined || 'N/A'}</p></div>
                              <div><p className="text-[10px] text-[#5c6370] mb-1">No Shows</p><p className="text-xs text-white">{c.noShows || 0}</p></div>
                              <div><p className="text-[10px] text-[#5c6370] mb-1">Pending Payout</p><p className="text-xs text-emerald-400">{fmt(c.pendingPayout)}</p></div>
                              <div><p className="text-[10px] text-[#5c6370] mb-1">Individual Price</p><p className="text-xs text-white">{fmt(c.individualPrice)}</p></div>
                              <div><p className="text-[10px] text-[#5c6370] mb-1">Group Price / Person</p><p className="text-xs text-white">{fmt(c.groupPricePerPerson)}</p></div>
                              <div><p className="text-[10px] text-[#5c6370] mb-1">Requested Ind. Fee</p><p className="text-xs text-amber-400">{(c.requestedIndividualPrice !== undefined && c.requestedIndividualPrice !== null) ? fmt(c.requestedIndividualPrice) : (c.fee !== undefined ? fmt(c.fee) : 'N/A')}</p></div>
                              <div><p className="text-[10px] text-[#5c6370] mb-1">Requested Group Fee</p><p className="text-xs text-amber-400">{(c.requestedGroupPricePerPerson !== undefined && c.requestedGroupPricePerPerson !== null) ? fmt(c.requestedGroupPricePerPerson) : (c.groupFee !== undefined ? fmt(c.groupFee) : 'N/A')}</p></div>
                              {c.bio && <div className="col-span-2 lg:col-span-4"><p className="text-[10px] text-[#5c6370] mb-1">Bio</p><p className="text-xs text-[#9ba3af]">{c.bio}</p></div>}
                            </div>
                          </Td>
                        </Tr>
                      )}
                    </>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={!!avatarUpload}
        onClose={() => setAvatarUpload(null)}
        title={`Update Avatar - ${avatarUpload?.coachName}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#9ba3af] mb-1.5">Coach Avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
              className="input-field"
            />
            {uploadingAvatar && <p className="text-xs text-[#9ba3af] mt-1">Uploading...</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAvatarUpload(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!approveModal}
        onClose={() => setApproveModal(null)}
        title={`Approve KYC - ${approveModal?.name}`}
        size="md"
      >
        <div className="space-y-4">
          {(approveModal?.requestedIndividualPrice !== undefined || approveModal?.requestedGroupPricePerPerson !== undefined) && (
            <div className="bg-[#F05A22]/10 border border-[#F05A22]/30 rounded-lg p-3 text-xs text-white">
              <p className="font-semibold text-[#F05A22] mb-1">Coach Requested Pricing (Onboarding):</p>
              <div className="flex gap-4 text-[#9ba3af] mt-1">
                <span>Individual Fee: <strong className="text-emerald-400">₹{approveModal.requestedIndividualPrice ?? 0}</strong></span>
                <span>Group Fee / Person: <strong className="text-emerald-400">₹{approveModal.requestedGroupPricePerPerson ?? 0}</strong></span>
              </div>
              <p className="text-[10px] text-[#9ba3af] mt-1.5">
                The prices below have been auto-filled from the coach's request. You can approve with these values or specify different prices to override.
              </p>
            </div>
          )}

          <Input
            label="Individual Session Price (₹)"
            type="number"
            value={approveModal?.individualPrice || ''}
            onChange={e => setApproveModal(prev => prev ? { ...prev, individualPrice: e.target.value } : null)}
          />
          <Input
            label="Group Session Price per Person (₹)"
            type="number"
            value={approveModal?.groupPricePerPerson || ''}
            onChange={e => setApproveModal(prev => prev ? { ...prev, groupPricePerPerson: e.target.value } : null)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setApproveModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleApproveConfirm}>Approve & Set Prices</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title={`Reject KYC - ${rejectModal?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Reason for Rejection"
            placeholder="E.g., Invalid credentials, blurry documents..."
            value={rejectModal?.reason || ''}
            onChange={e => setRejectModal(prev => prev ? { ...prev, reason: e.target.value } : null)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleRejectConfirm}>Reject KYC</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!banModal}
        onClose={() => setBanModal(null)}
        title={`Ban Coach - ${banModal?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Reason for Banning"
            placeholder="E.g., Violation of terms, misconduct..."
            value={banModal?.reason || ''}
            onChange={e => setBanModal(prev => prev ? { ...prev, reason: e.target.value } : null)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setBanModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleBanConfirm}>Ban Coach</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Coach"
        message={`Are you sure you want to delete coach ${deleteModal?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        danger={true}
      />
    </div>
  );
}
