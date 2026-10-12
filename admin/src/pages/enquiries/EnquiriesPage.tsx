import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Calendar, User, Mail, Phone, Trash2, Eye, ClipboardList } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, SearchBar, FilterPill, StatCard, Table, Thead, Tbody, Th, Td, Tr, EmptyState, Modal, ConfirmDialog, Select, Textarea, DetailRow } from '../../components/ui';
import { getEnquiryStats, getEnquiries, getEnquiry, updateEnquiryStatus, deleteEnquiry } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_MAP: Record<string, string> = {
  new: 'badge-blue',
  in_progress: 'badge-orange',
  responded: 'badge-green',
  closed: 'badge-gray',
  NEW: 'badge-blue',
  IN_PROGRESS: 'badge-orange',
  RESPONDED: 'badge-green',
  CLOSED: 'badge-gray'
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  in_progress: 'In Progress',
  responded: 'Responded',
  closed: 'Closed'
};

type Enquiry = {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'new' | 'in_progress' | 'responded' | 'closed';
  adminNotes?: string;
  createdAt: string;
};

function EnquiryDetailModal({
  enquiryId,
  open,
  onClose,
  onStatusUpdated
}: {
  enquiryId: string | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}) {
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('new');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!enquiryId || !open) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await getEnquiry(enquiryId);
        const data = res.data || res;
        setEnquiry(data);
        setStatus(data.status);
        setAdminNotes(data.adminNotes || '');
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [enquiryId, open]);

  const handleUpdate = async () => {
    if (!enquiryId) return;
    setUpdating(true);
    try {
      await updateEnquiryStatus(enquiryId, status, adminNotes);
      onStatusUpdated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update enquiry');
    } finally {
      setUpdating(false);
    }
  };

  if (!open || !enquiryId) return null;

  return (
    <Modal open={open} onClose={onClose} title="Enquiry Details" size="lg">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
        </div>
      ) : !enquiry ? (
        <p className="text-center py-4 text-[#5c6370] text-sm">Failed to load enquiry details.</p>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <span style={{ fontSize: 32 }}>💬</span>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">{enquiry.subject || 'General Enquiry'}</h2>
              <p className="text-xs text-[#9ba3af] mt-0.5">
                Received:{' '}
                <span className="text-white font-semibold">
                  {new Date(enquiry.createdAt).toLocaleString('en-IN')}
                </span>
              </p>
            </div>
            <Badge className={STATUS_MAP[enquiry.status] || 'badge-gray'}>
              {STATUS_LABELS[enquiry.status] || enquiry.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-y border-[#2e3139] py-4">
            <DetailRow label="Name" value={enquiry.name} />
            <DetailRow label="Email" value={enquiry.email} />
            <DetailRow label="Phone" value={enquiry.phone || '—'} />
          </div>

          <div className="border border-[#2e3139] bg-[#1a1c20] rounded-lg p-4 text-sm text-[#d1d5db] leading-relaxed">
            <span className="block font-semibold text-white mb-2 uppercase tracking-wider text-[10px]">
              Customer Message
            </span>
            {enquiry.message}
          </div>

          <div className="border-t border-[#2e3139] pt-4 space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Admin Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Select
                  label="Update Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={[
                    { value: 'new', label: 'New' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'responded', label: 'Responded' },
                    { value: 'closed', label: 'Closed' }
                  ]}
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Admin Notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about correspondence or resolution status..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#2e3139]">
            <Button variant="ghost" onClick={onClose} disabled={updating}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdate} disabled={updating}>
              {updating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function EnquiriesPage() {
  const { can } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    in_progress: 0,
    responded: 0,
    closed: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteEnquiryItem, setDeleteEnquiryItem] = useState<Enquiry | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const statsRes = await getEnquiryStats();
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else if (statsRes.data) {
        setStats(statsRes.data);
      }

      const statusParam = filter !== 'All' ? filter.toLowerCase() : undefined;
      const params: Record<string, any> = {};
      if (statusParam) params.status = statusParam;
      if (search) params.search = search;

      const listRes = await getEnquiries(params);
      const items = listRes.data || listRes;
      if (Array.isArray(items)) {
        setEnquiries(items);
      } else {
        setEnquiries([]);
      }
    } catch (err: any) {
      console.error('Failed to load enquiries', err);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteEnquiryItem) return;
    try {
      const id = deleteEnquiryItem._id || deleteEnquiryItem.id;
      await deleteEnquiry(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
    setDeleteEnquiryItem(null);
  };

  const FILTERS = ['All', 'New', 'In_Progress', 'Responded', 'Closed'];

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Total Enquiries"
          value={String(stats.total)}
          icon={<ClipboardList className="h-4 w-4 text-[#F05A22]" />}
          iconBg="bg-[#F05A22]/10"
        />
        <StatCard
          label="New"
          value={String(stats.new)}
          icon={<MessageSquare className="h-4 w-4 text-blue-400" />}
          iconBg="bg-blue-400/10"
        />
        <StatCard
          label="In Progress"
          value={String(stats.in_progress)}
          icon={<Calendar className="h-4 w-4 text-amber-400" />}
          iconBg="bg-amber-400/10"
        />
        <StatCard
          label="Responded"
          value={String(stats.responded)}
          icon={<User className="h-4 w-4 text-emerald-400" />}
          iconBg="bg-emerald-400/10"
        />
        <StatCard
          label="Closed"
          value={String(stats.closed)}
          icon={<Trash2 className="h-4 w-4 text-gray-400" />}
          iconBg="bg-gray-400/10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Enquiries ({enquiries.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search enquiries..." />
            <div className="flex gap-1 flex-wrap">
              {FILTERS.map((f) => (
                <FilterPill
                  key={f}
                  label={f.replace('_', ' ')}
                  active={filter === f}
                  onClick={() => setFilter(f)}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
            </div>
          ) : enquiries.length === 0 ? (
            <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="No enquiries found" />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Customer</Th>
                  <Th>Subject</Th>
                  <Th>Received Date</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {enquiries.map((e) => {
                  const id = e._id || e.id;
                  return (
                    <Tr key={id}>
                      <Td>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{e.name}</span>
                          <span className="text-[10px] text-[#5c6370]">{e.email}</span>
                        </div>
                      </Td>
                      <Td>
                        <div className="max-w-xs truncate font-medium text-white">
                          {e.subject || 'General Inquiry'}
                        </div>
                      </Td>
                      <Td className="text-xs text-[#9ba3af]">
                        {new Date(e.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Td>
                      <Td>
                        <Badge className={STATUS_MAP[e.status] || 'badge-gray'}>
                          {STATUS_LABELS[e.status] || e.status}
                        </Badge>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedId(id)}
                            title="View Enquiry"
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-white hover:bg-[#21242a]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {can('admins') && (
                            <button
                              onClick={() => setDeleteEnquiryItem(e)}
                              title="Delete Enquiry"
                              className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:text-red-400 hover:bg-red-400/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EnquiryDetailModal
        enquiryId={selectedId}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        onStatusUpdated={loadData}
      />

      <ConfirmDialog
        open={!!deleteEnquiryItem}
        onClose={() => setDeleteEnquiryItem(null)}
        title="Delete Enquiry"
        message={`Are you sure you want to delete the enquiry from "${deleteEnquiryItem?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger={true}
        onConfirm={handleDelete}
      />
    </div>
  );
}
