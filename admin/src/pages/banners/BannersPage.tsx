import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ImageIcon, Plus, RefreshCw, Eye, Edit2, Trash2, ExternalLink,
  ArrowUp, ArrowDown, Check, X, Shield, Users, UserCheck,
  Smartphone, Layers, Sparkles, AlertCircle, Link as LinkIcon,
  CheckCircle2, XCircle, MoveVertical, LayoutGrid, List
} from 'lucide-react';
import {
  getAdminBanners, createAdminBanner, updateAdminBanner,
  deleteAdminBanner, reorderAdminBanners, uploadImage, extractDataList
} from '../../api';
import { Banner, BannerTargetType } from '../../types';
import {
  Card, CardHeader, CardTitle, CardContent, Badge, Button,
  StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState, Modal, ConfirmDialog
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

type ViewMode = 'grid' | 'table';
type AudienceFilter = 'all' | 'player' | 'coach';

const LINK_PRESETS = [
  { label: '🏆 Tournaments', value: '/tournaments' },
  { label: '⭐ Coaches', value: '/coaches' },
  { label: '🏟️ Venues', value: '/venues' },
  { label: '💬 Community', value: '/community' },
  { label: '🏅 Sports Programs', value: '/sports' },
  { label: '🎟️ Membership', value: '/membership' },
];

export default function BannersPage() {
  const { can } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields
  const [formType, setFormType] = useState<BannerTargetType>('player');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formTitle, setFormTitle] = useState('');
  const [createForBoth, setCreateForBoth] = useState(false);

  // Delete Dialog State
  const [deleteConfirm, setDeleteConfirm] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load Banners
  const loadBanners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminBanners();
      const list = extractDataList<Banner>(res);
      // Sort by order ascending
      const sorted = [...list].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      setBanners(sorted);
    } catch (err: any) {
      console.warn('Failed to load banners:', err);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingBanner(null);
    setFormType(audienceFilter === 'coach' ? 'coach' : 'player');
    setFormImageUrl('');
    setFormLink('');
    // Suggest next order number
    const maxOrder = banners.reduce((max, b) => Math.max(max, Number(b.order) || 0), 0);
    setFormOrder(maxOrder + 1);
    setFormIsActive(true);
    setFormTitle('');
    setCreateForBoth(false);
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormType(banner.type || 'player');
    setFormImageUrl(banner.imageUrl || '');
    setFormLink(banner.link || '');
    setFormOrder(Number(banner.order) || 1);
    setFormIsActive(banner.isActive ?? true);
    setFormTitle(banner.title || '');
    setCreateForBoth(false);
    setModalOpen(true);
  };

  // Handle Image Upload via file picker
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await uploadImage(file);
      const uploadedUrl = res?.url || res?.data?.url || res?.imageUrl || '';
      if (uploadedUrl) {
        setFormImageUrl(uploadedUrl);
      } else {
        alert(res?.message || 'Image upload succeeded but no URL returned.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload banner image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle Save (Create or Update)
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formImageUrl.trim()) {
      alert('Please upload an image or provide a valid image URL.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        type: formType,
        imageUrl: formImageUrl.trim(),
        link: formLink.trim(),
        order: Number(formOrder) || 1,
        isActive: formIsActive,
        title: formTitle.trim() || undefined
      };

      if (editingBanner) {
        const id = editingBanner.id || editingBanner._id;
        if (!id) throw new Error('Banner ID missing');
        await updateAdminBanner(id, payload);
      } else {
        await createAdminBanner(payload);
        if (createForBoth) {
          // Create the twin banner for the opposite target type
          const twinType: BannerTargetType = formType === 'player' ? 'coach' : 'player';
          await createAdminBanner({ ...payload, type: twinType }).catch(() => {});
        }
      }

      setModalOpen(false);
      loadBanners();
    } catch (err: any) {
      alert(err.message || 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  // Quick toggle active status
  const handleToggleActive = async (banner: Banner) => {
    const id = banner.id || banner._id;
    if (!id) return;
    const newStatus = !banner.isActive;

    // Optimistic UI update
    setBanners(prev => prev.map(b => (b.id === id || b._id === id) ? { ...b, isActive: newStatus } : b));

    try {
      await updateAdminBanner(id, { isActive: newStatus });
    } catch (err: any) {
      alert(err.message || 'Failed to update banner status');
      // Revert on error
      setBanners(prev => prev.map(b => (b.id === id || b._id === id) ? { ...b, isActive: !newStatus } : b));
    }
  };

  // Reorder Banner: Move Up / Down
  const handleMoveOrder = async (banner: Banner, direction: 'up' | 'down') => {
    const list = [...filteredBanners];
    const currentIndex = list.findIndex(b => (b.id || b._id) === (banner.id || banner._id));
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap items
    const temp = list[currentIndex];
    list[currentIndex] = list[targetIndex];
    list[targetIndex] = temp;

    // Recalculate normalized sequential orders
    const reorderedPayload = list.map((b, idx) => ({
      id: String(b.id || b._id || ''),
      order: idx + 1
    }));

    // Optimistic state update
    const updatedMap = new Map(reorderedPayload.map(item => [item.id, item.order]));
    setBanners(prev => prev.map(b => {
      const bId = String(b.id || b._id || '');
      return updatedMap.has(bId) ? { ...b, order: updatedMap.get(bId)! } : b;
    }).sort((a, b) => (a.order || 0) - (b.order || 0)));

    try {
      await reorderAdminBanners(reorderedPayload);
    } catch (err: any) {
      console.warn('Reorder API failed:', err);
      loadBanners();
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm.id || deleteConfirm._id;
    if (!id) return;

    try {
      setDeleting(true);
      await deleteAdminBanner(id);
      setBanners(prev => prev.filter(b => (b.id || b._id) !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete banner');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Banners list
  const filteredBanners = useMemo(() => {
    return banners.filter(b => {
      // Audience Filter
      if (audienceFilter !== 'all' && b.type !== audienceFilter) return false;
      // Status Filter
      if (statusFilter === 'active' && !b.isActive) return false;
      if (statusFilter === 'inactive' && b.isActive) return false;
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const link = (b.link || '').toLowerCase();
        const title = (b.title || '').toLowerCase();
        const id = String(b.id || b._id || '').toLowerCase();
        return link.includes(q) || title.includes(q) || id.includes(q);
      }
      return true;
    });
  }, [banners, audienceFilter, statusFilter, search]);

  // Active banners for mobile simulator preview
  const activeSimulatorBanners = useMemo(() => {
    const targetType = audienceFilter === 'coach' ? 'coach' : 'player';
    return banners.filter(b => b.isActive && b.type === targetType);
  }, [banners, audienceFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: banners.length,
      active: banners.filter(b => b.isActive).length,
      player: banners.filter(b => b.type === 'player').length,
      coach: banners.filter(b => b.type === 'coach').length,
    };
  }, [banners]);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto font-sans">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. PAGE HEADER                                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F05A22]/10 text-[#F05A22] border border-[#F05A22]/20 shadow-xs">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">App Banners Management</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Create, order, and schedule promotional banners for Player, Parent, and Coach mobile apps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            className="text-xs h-9"
            onClick={() => setShowMobileSimulator(prev => !prev)}
            title="Toggle Live Mobile Carousel Preview"
          >
            <Smartphone className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">{showMobileSimulator ? 'Hide Simulator' : 'Mobile Preview'}</span>
          </Button>

          <Button
            variant="outline"
            className="text-xs h-9"
            onClick={loadBanners}
            title="Reload banners"
          >
            <RefreshCw className={clsx("h-3.5 w-3.5", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {can('sports_write') && (
            <Button
              variant="primary"
              className="text-xs h-9 font-semibold shadow-sm"
              onClick={openCreateModal}
            >
              <Plus className="h-4 w-4" />
              Create Banner
            </Button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. STAT CARDS                                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Banners"
          value={String(stats.total)}
          sub="All target platforms"
          subColor="text-slate-500"
          icon={<Layers className="h-4 w-4 text-slate-700" />}
          iconBg="bg-slate-100"
        />
        <StatCard
          label="Active In Apps"
          value={String(stats.active)}
          sub="Visible to app users"
          subColor="text-emerald-600"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Player & Parent"
          value={String(stats.player)}
          sub="Users App Carousel"
          subColor="text-blue-600"
          icon={<Users className="h-4 w-4 text-blue-500" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          label="Coach App"
          value={String(stats.coach)}
          sub="Coach Portal Carousel"
          subColor="text-purple-600"
          icon={<UserCheck className="h-4 w-4 text-purple-500" />}
          iconBg="bg-purple-50"
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. OPTIONAL MOBILE CAROUSEL SIMULATOR                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showMobileSimulator && (
        <Card className="border-[#F05A22]/20 bg-gradient-to-r from-slate-50 to-orange-50/20 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-[#F05A22]" />
              <h3 className="text-sm font-bold text-slate-900">
                Live App Preview — {audienceFilter === 'coach' ? 'Coach App' : 'Player & Parent App'}
              </h3>
              <Badge className="bg-[#F05A22]/10 text-[#F05A22] border-[#F05A22]/20">
                {activeSimulatorBanners.length} Active in Carousel
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500">
              Simulates the 16:9 carousel as rendered in the mobile home header
            </p>
          </div>

          {activeSimulatorBanners.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              No active banners currently published for this target platform.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x scrollbar-thin">
              {activeSimulatorBanners.map((b, idx) => (
                <div
                  key={b.id || b._id || idx}
                  className="flex-shrink-0 w-72 sm:w-80 rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-white snap-center group relative"
                >
                  <div className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden">
                    <img
                      src={b.imageUrl}
                      alt={b.title || 'App Banner'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x338/f8fafc/94a3b8?text=Image+Not+Found';
                      }}
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                        #{b.order || idx + 1}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 flex items-center justify-between text-xs bg-white">
                    <span className="text-slate-600 truncate font-medium">
                      {b.link ? `Link: ${b.link}` : 'Informational Banner'}
                    </span>
                    <Badge className={b.type === 'player' ? 'badge-blue' : 'badge-purple'}>
                      {b.type === 'player' ? 'Player App' : 'Coach App'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. FILTERS & CONTROLS BAR                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Audience Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setAudienceFilter('all')}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              audienceFilter === 'all'
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            All Platforms ({banners.length})
          </button>
          <button
            type="button"
            onClick={() => setAudienceFilter('player')}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              audienceFilter === 'player'
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Users className="h-3.5 w-3.5 text-blue-500" />
            Players & Parents ({stats.player})
          </button>
          <button
            type="button"
            onClick={() => setAudienceFilter('coach')}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              audienceFilter === 'coach'
                ? "bg-white text-purple-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <UserCheck className="h-3.5 w-3.5 text-purple-500" />
            Coaches ({stats.coach})
          </button>
        </div>

        {/* Status Filter & View Toggle */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1">
            {(['all', 'active', 'inactive'] as const).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer",
                  statusFilter === st
                    ? "bg-[#F05A22] text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                )}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Grid vs Table Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={clsx("p-1.5 rounded-md cursor-pointer transition-colors", viewMode === 'grid' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800")}
              title="Grid Card View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={clsx("p-1.5 rounded-md cursor-pointer transition-colors", viewMode === 'table' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800")}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. BANNERS LISTING: GRID VIEW                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="h-7 w-7 animate-spin mx-auto mb-2 text-[#F05A22]" />
          <p className="text-xs font-medium text-slate-500">Loading banners...</p>
        </div>
      ) : filteredBanners.length === 0 ? (
        <Card className="py-16 text-center">
          <EmptyState
            icon={<ImageIcon className="h-10 w-10 text-slate-300" />}
            title="No banners found"
            text={
              audienceFilter !== 'all' || statusFilter !== 'all'
                ? "No banners match the selected audience or status filters."
                : "No banners published yet. Click 'Create Banner' to upload your first banner!"
            }
          />
          {can('sports_write') && (
            <Button variant="primary" className="mt-4 text-xs mx-auto" onClick={openCreateModal}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create First Banner
            </Button>
          )}
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredBanners.map((b, idx) => {
            const id = b.id || b._id || `banner_${idx}`;
            const isFirst = idx === 0;
            const isLast = idx === filteredBanners.length - 1;

            return (
              <div
                key={id}
                className={clsx(
                  "bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between",
                  b.isActive ? "border-slate-200/90" : "border-slate-200/60 opacity-80 bg-slate-50/40"
                )}
              >
                {/* Top Banner Image Container */}
                <div>
                  <div className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden group">
                    <img
                      src={b.imageUrl}
                      alt={b.title || 'App Banner'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x338/f8fafc/94a3b8?text=Image+Load+Error';
                      }}
                    />

                    {/* Overlay Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/85 text-white backdrop-blur-xs flex items-center gap-1">
                        <MoveVertical className="h-2.5 w-2.5" /> Order #{b.order ?? (idx + 1)}
                      </span>
                      <Badge className={b.type === 'player' ? 'badge-blue' : 'badge-purple'}>
                        {b.type === 'player' ? 'Players & Parents' : 'Coaches Only'}
                      </Badge>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(b)}
                        className={clsx(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs transition-colors cursor-pointer backdrop-blur-xs",
                          b.isActive
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-slate-700 text-slate-200 hover:bg-slate-800"
                        )}
                        title="Click to toggle banner visibility"
                      >
                        {b.isActive ? '● Live' : '○ Hidden'}
                      </button>
                    </div>

                    {/* External image link open preview */}
                    <a
                      href={b.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                      title="Open full image in new tab"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 space-y-2">
                    {b.title && (
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={b.title}>
                        {b.title}
                      </h4>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-0">
                      <LinkIcon className="h-3 w-3 text-slate-400 flex-shrink-0" />
                      <span className="font-mono text-[11px] truncate flex-1" title={b.link || 'No destination link'}>
                        {b.link ? b.link : <em className="text-slate-400 not-italic">No link (Display only)</em>}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
                  {/* Sequence Reorder Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveOrder(b, 'up')}
                      className={clsx(
                        "p-1 rounded-md border text-xs transition-colors cursor-pointer",
                        isFirst
                          ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      )}
                      title="Move up in carousel"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveOrder(b, 'down')}
                      className={clsx(
                        "p-1 rounded-md border text-xs transition-colors cursor-pointer",
                        isLast
                          ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      )}
                      title="Move down in carousel"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Edit & Delete Controls */}
                  {can('sports_write') && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        className="h-7 text-xs px-2.5 text-slate-700 hover:text-slate-900 border-slate-200"
                        onClick={() => openEditModal(b)}
                        title="Edit Banner"
                      >
                        <Edit2 className="h-3 w-3 mr-1 text-[#F05A22]" /> Edit
                      </Button>
                      <Button
                        variant="danger"
                        className="h-7 text-xs px-2 text-rose-600 hover:bg-rose-50 border-rose-200"
                        onClick={() => setDeleteConfirm(b)}
                        title="Delete Banner"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────────── */
        /* 5B. BANNERS LISTING: TABLE VIEW                                     */
        /* ─────────────────────────────────────────────────────────────────── */
        <Card>
          <Table>
            <Thead>
              <Tr>
                <Th>Order</Th>
                <Th>Preview</Th>
                <Th>Target Platform</Th>
                <Th>Destination Link</Th>
                <Th>Status</Th>
                <Th>Reorder</Th>
                {can('sports_write') && <Th className="text-right">Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {filteredBanners.map((b, idx) => {
                const id = b.id || b._id || `banner_${idx}`;
                const isFirst = idx === 0;
                const isLast = idx === filteredBanners.length - 1;

                return (
                  <Tr key={id}>
                    <Td>
                      <span className="font-mono font-bold text-xs text-slate-800">
                        #{b.order ?? (idx + 1)}
                      </span>
                    </Td>
                    <Td>
                      <div className="h-12 w-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative flex-shrink-0">
                        <img
                          src={b.imageUrl}
                          alt="Banner"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/160x90/f8fafc/94a3b8?text=Image';
                          }}
                        />
                      </div>
                    </Td>
                    <Td>
                      <Badge className={b.type === 'player' ? 'badge-blue' : 'badge-purple'}>
                        {b.type === 'player' ? 'Players & Parents' : 'Coaches'}
                      </Badge>
                    </Td>
                    <Td>
                      <span className="text-xs text-slate-700 font-mono truncate max-w-xs block" title={b.link || 'None'}>
                        {b.link || '—'}
                      </span>
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(b)}
                        className={clsx(
                          "cursor-pointer inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border transition-colors",
                          b.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        )}
                      >
                        {b.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleMoveOrder(b, 'up')}
                          className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleMoveOrder(b, 'down')}
                          className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    </Td>
                    {can('sports_write') && (
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            onClick={() => openEditModal(b)}
                          >
                            <Edit2 className="h-3 w-3 mr-1 text-[#F05A22]" /> Edit
                          </Button>
                          <Button
                            variant="danger"
                            className="h-7 text-xs px-2"
                            onClick={() => setDeleteConfirm(b)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Td>
                    )}
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. CREATE / EDIT BANNER MODAL                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBanner ? 'Edit Banner' : 'Create New Banner'}
        size="lg"
      >
        <form onSubmit={handleSaveBanner} className="space-y-5">
          {/* Target Audience Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-2">
              Target Audience / App Destination <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormType('player')}
                className={clsx(
                  "p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3",
                  formType === 'player'
                    ? "bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/15"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <div className={clsx("p-2 rounded-xl flex-shrink-0", formType === 'player' ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600")}>
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Players & Parents</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Published on Arenova Player/User Home Carousel</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormType('coach')}
                className={clsx(
                  "p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3",
                  formType === 'coach'
                    ? "bg-purple-50/60 border-purple-500 ring-2 ring-purple-500/15"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <div className={clsx("p-2 rounded-xl flex-shrink-0", formType === 'coach' ? "bg-purple-500 text-white" : "bg-slate-100 text-slate-600")}>
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Coaches App</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Published on Coach Portal Home Carousel</p>
                </div>
              </button>
            </div>

            {!editingBanner && (
              <label className="flex items-center gap-2 mt-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForBoth}
                  onChange={e => setCreateForBoth(e.target.checked)}
                  className="rounded border-slate-300 text-[#F05A22] focus:ring-[#F05A22]"
                />
                <span>Also duplicate and create this banner for {formType === 'player' ? 'Coaches' : 'Players & Parents'}</span>
              </label>
            )}
          </div>

          {/* Banner Image Input & File Upload */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-900">
              Banner Artwork / Image <span className="text-rose-500">*</span>
            </label>

            {/* Direct File Upload Drop Zone */}
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50 text-center hover:bg-slate-100/70 transition-colors">
              <input
                type="file"
                id="banner-file-input"
                accept="image/*"
                onChange={handleImageFileChange}
                disabled={uploadingImage}
                className="hidden"
              />
              <label
                htmlFor="banner-file-input"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#F05A22] mb-2 shadow-xs">
                  {uploadingImage ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {uploadingImage ? 'Uploading image to S3...' : 'Click to upload banner image file'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Recommended size: 1200 × 675 px (16:9 ratio) or 1080 × 540 px (2:1). PNG, JPG, WebP.
                </p>
              </label>
            </div>

            {/* Or Paste Direct Image URL */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Or paste direct Image URL:
              </span>
              <input
                type="url"
                value={formImageUrl}
                onChange={e => setFormImageUrl(e.target.value)}
                placeholder="https://..."
                required
                className="input-field text-xs font-mono"
              />
            </div>

            {/* Live Preview Box */}
            {formImageUrl && (
              <div className="mt-2">
                <span className="text-[11px] font-bold text-slate-700 block mb-1">
                  Artwork Preview:
                </span>
                <div className="aspect-[16/9] w-full max-w-md rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm relative">
                  <img
                    src={formImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x338/f8fafc/94a3b8?text=Image+Load+Failed';
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation Link / Destination */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900">
              Click Destination / Deep Link <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={formLink}
              onChange={e => setFormLink(e.target.value)}
              placeholder="e.g. /tournaments or https://arenova.com/special-offer"
              className="input-field text-xs font-mono"
            />

            {/* Link Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Presets:</span>
              {LINK_PRESETS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFormLink(p.value)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Order and Status Row */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Carousel Sequence Order
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={formOrder}
                onChange={e => setFormOrder(parseInt(e.target.value, 10) || 1)}
                className="input-field text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Lower numbers appear first (e.g. 1 = primary first slide).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Visibility Status
              </label>
              <button
                type="button"
                onClick={() => setFormIsActive(prev => !prev)}
                className={clsx(
                  "w-full h-10 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer",
                  formIsActive
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                )}
              >
                <span>{formIsActive ? 'Published (Active)' : 'Draft (Hidden)'}</span>
                <span className={clsx("h-2.5 w-2.5 rounded-full", formIsActive ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-slate-300")} />
              </button>
            </div>
          </div>

          {/* Optional Label / Title */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Internal Label / Campaign Title <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="e.g. Summer Tennis Championship 2026"
              className="input-field text-xs"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="text-xs h-9"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="text-xs h-9 font-semibold"
              disabled={saving || uploadingImage}
            >
              {saving ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. DELETE CONFIRMATION DIALOG                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Banner"
        message="Are you sure you want to permanently delete this banner? It will immediately stop rendering in the app carousel."
        confirmLabel={deleting ? 'Deleting...' : 'Delete Banner'}
        danger
      />
    </div>
  );
}
