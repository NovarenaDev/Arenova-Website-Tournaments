import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  History, ShieldAlert, Filter, RotateCcw, Eye, Copy, Check,
  Calendar, Clock, AlertTriangle, ArrowRight, ArrowLeft,
  ChevronLeft, ChevronRight, Search, Activity, FileText, CheckCircle2, XCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAuditLogs, getAuditLogDetail, getAuditLogsSummary
} from '../../api';
import {
  AuditLogItem, AuditLogPagination, AuditLogSummaryData
} from '../../types';
import {
  Card, CardHeader, CardTitle, CardContent,
  Badge, Button, StatCard, Table, Thead, Tbody, Th, Td, Tr,
  EmptyState, Modal, DetailRow
} from '../../components/ui';
import { clsx } from 'clsx';

// Human-friendly mapping of resource collection names to dashboard labels
const RESOURCE_LABELS: Record<string, string> = {
  novaretournaments: 'Tournaments',
  novareenquiries: 'Enquiries',
  users: 'User/Customer Accounts',
  coachprofiles: 'Coach Profiles',
  adminusers: 'Administrators',
  sports: 'Sports',
  venues: 'Venues',
  bookings: 'Bookings',
  withdrawalrequests: 'Withdrawals',
};

const getResourceLabel = (resource: string): string => {
  if (!resource) return '—';
  const clean = resource.toLowerCase().trim();
  if (RESOURCE_LABELS[clean]) return RESOURCE_LABELS[clean];
  // Fallback: capitalize snake_case or words
  return resource
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border border-red-500/20',
  STATUS_CHANGE: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
};

// Safe serializer for snapshot values: handles null, undefined, false, 0, [], objects
const formatSnapshotValue = (val: any): { text: string; isObject: boolean } => {
  if (val === null) return { text: 'null', isObject: false };
  if (val === undefined) return { text: 'undefined', isObject: false };
  if (typeof val === 'boolean') return { text: val ? 'true' : 'false', isObject: false };
  if (typeof val === 'number') return { text: String(val), isObject: false };
  if (typeof val === 'string') return { text: val === '' ? '"" (empty string)' : val, isObject: false };
  if (Array.isArray(val)) {
    if (val.length === 0) return { text: '[] (empty array)', isObject: false };
    return { text: JSON.stringify(val, null, 2), isObject: true };
  }
  if (typeof val === 'object') {
    return { text: JSON.stringify(val, null, 2), isObject: true };
  }
  return { text: String(val), isObject: false };
};

export default function AuditLogsPage() {
  const { admin } = useAuth();

  // Role validation: Super Admin only
  const isSuperAdmin = admin?.role === 'super_admin';

  // Summary Metrics State
  const [summary, setSummary] = useState<AuditLogSummaryData>({
    totalActions: 0,
    CREATE: 0,
    UPDATE: 0,
    DELETE: 0,
    STATUS_CHANGE: 0,
  });
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Table Logs & Pagination State
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = useState<AuditLogPagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  // Filter States
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [actorEmailFilter, setActorEmailFilter] = useState('');
  const [actorIdFilter, setActorIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Details Modal State
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<AuditLogItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Detect and format user local timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Request race condition management
  const activeRequestIdRef = useRef(0);

  // ── Load Summary Cards (supports date filters only) ──────────────────────────
  const loadSummary = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoadingSummary(true);
    try {
      const params: { startDate?: string; endDate?: string } = {};
      if (startDate.trim()) params.startDate = startDate.trim();
      if (endDate.trim()) params.endDate = endDate.trim();

      const res = await getAuditLogsSummary(params);
      if (res && res.data) {
        setSummary({
          totalActions: res.data.totalActions ?? 0,
          CREATE: res.data.CREATE ?? 0,
          UPDATE: res.data.UPDATE ?? 0,
          DELETE: res.data.DELETE ?? 0,
          STATUS_CHANGE: res.data.STATUS_CHANGE ?? 0,
        });
      }
    } catch (err: any) {
      if (err?.status === 403 || err?.isForbidden) {
        setIsForbidden(true);
      }
    } finally {
      setLoadingSummary(false);
    }
  }, [isSuperAdmin, startDate, endDate]);

  // ── Load Activity Table ───────────────────────────────────────────────────────
  const loadLogs = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoadingLogs(true);
    setLoadError(null);
    const requestId = ++activeRequestIdRef.current;

    try {
      const params: Record<string, any> = {
        page,
        limit,
      };
      if (actionFilter.trim()) params.action = actionFilter.trim();
      if (resourceFilter.trim()) params.resource = resourceFilter.trim();
      if (outcomeFilter.trim()) params.outcome = outcomeFilter.trim();
      if (actorEmailFilter.trim()) params.actorEmail = actorEmailFilter.trim();
      if (actorIdFilter.trim()) params.actorId = actorIdFilter.trim();
      if (startDate.trim()) params.startDate = startDate.trim();
      if (endDate.trim()) params.endDate = endDate.trim();

      const res = await getAuditLogs(params);

      // Discard response if a newer request was dispatched in the meantime
      if (requestId !== activeRequestIdRef.current) return;

      if (res) {
        const dataList = Array.isArray(res.data) ? res.data : [];
        setLogs(dataList);

        if (res.pagination) {
          setPagination({
            total: Number(res.pagination.total) || 0,
            page: Number(res.pagination.page) || page,
            limit: Number(res.pagination.limit) || limit,
            totalPages: Number(res.pagination.totalPages) || 1,
          });
        } else {
          setPagination(prev => ({
            ...prev,
            total: dataList.length,
            totalPages: Math.ceil(dataList.length / limit) || 1,
          }));
        }
      }
    } catch (err: any) {
      if (requestId !== activeRequestIdRef.current) return;
      if (err?.status === 403 || err?.isForbidden) {
        setIsForbidden(true);
      } else {
        setLoadError(err?.message || 'Failed to retrieve audit logs from server.');
        setLogs([]);
      }
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setLoadingLogs(false);
      }
    }
  }, [
    isSuperAdmin,
    page,
    limit,
    actionFilter,
    resourceFilter,
    outcomeFilter,
    actorEmailFilter,
    actorIdFilter,
    startDate,
    endDate,
  ]);

  // Trigger loads
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Open Details Modal and fetch complete record
  const handleOpenDetail = async (recordId: string) => {
    setSelectedRecordId(recordId);
    setDetailData(null);
    setDetailError(null);
    setLoadingDetail(true);

    try {
      const res = await getAuditLogDetail(recordId);
      if (res && res.data) {
        setDetailData(res.data);
      } else {
        setDetailError('Audit record not found or no longer retained.');
      }
    } catch (err: any) {
      if (err?.status === 404) {
        setDetailError('Audit record not found or no longer retained.');
      } else {
        setDetailError(err?.message || 'Failed to load complete audit record.');
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedRecordId(null);
    setDetailData(null);
    setDetailError(null);
  };

  const handleResetFilters = () => {
    setActionFilter('');
    setResourceFilter('');
    setOutcomeFilter('');
    setActorEmailFilter('');
    setActorIdFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleCopyText = (text: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  // ── Access Denied Screen ──────────────────────────────────────────────────────
  if (!isSuperAdmin || isForbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied: Super Admin Only</h2>
        <p className="text-sm text-[#9ba3af] max-w-md mb-6 leading-relaxed">
          The Admin Activity & Audit Logs section contains sensitive compliance records and is restricted strictly to accounts with the <strong className="text-purple-400 font-semibold">Super Admin</strong> role.
        </p>
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={() => window.location.href = '/admin/dashboard'}
            className="h-9 px-4 text-xs font-semibold"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ── Combine Snapshot Keys for Diff Table ──────────────────────────────────────
  const getSnapshotComparisonKeys = () => {
    if (!detailData) return [];
    const beforeObj = detailData.before && typeof detailData.before === 'object' ? detailData.before : {};
    const afterObj = detailData.after && typeof detailData.after === 'object' ? detailData.after : {};
    const changed = Array.isArray(detailData.changedFields) ? detailData.changedFields : [];

    const keySet = new Set<string>([
      ...changed,
      ...Object.keys(beforeObj),
      ...Object.keys(afterObj),
    ]);

    // Put changed fields first
    const list = Array.from(keySet);
    return list.sort((a, b) => {
      const aIsChanged = changed.includes(a);
      const bIsChanged = changed.includes(b);
      if (aIsChanged && !bIsChanged) return -1;
      if (!aIsChanged && bIsChanged) return 1;
      return a.localeCompare(b);
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 min-w-0 max-w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight">Admin Activity & Audit Logs</h1>
            <Badge className="badge-purple">Super Admin</Badge>
          </div>
          <p className="text-xs text-[#9ba3af] mt-0.5">
            Immutable tracking of administrator actions, schema updates, and compliance events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#5c6370] bg-[#141518] border border-[#2e3139] px-2.5 py-1 rounded-md">
            Timezone: <strong className="text-[#9ba3af]">{userTimezone}</strong> (UTC day query filters)
          </span>
          <button
            onClick={() => { loadSummary(); loadLogs(); }}
            title="Refresh logs"
            className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg border border-[#2e3139] bg-[#141518] text-xs text-[#9ba3af] hover:text-white hover:bg-[#21242a] transition-colors"
          >
            <RotateCcw className={clsx("w-3.5 h-3.5", (loadingLogs || loadingSummary) && "animate-spin text-[#F05A22]")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards (supports date filters only) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5c6370]">
            Action Overview {startDate || endDate ? `(${startDate || 'Start'} to ${endDate || 'Now'})` : '(All Time)'}
          </span>
          {loadingSummary && (
            <span className="text-[10px] text-[#F05A22] animate-pulse">Updating metrics...</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Total Actions"
            value={summary.totalActions.toLocaleString()}
            sub="All logged operations"
            icon={<History className="h-4 w-4 text-[#F05A22]" />}
            iconBg="bg-[#F05A22]/10"
          />
          <StatCard
            label="Created"
            value={summary.CREATE.toLocaleString()}
            sub="CREATE operations"
            icon={<Activity className="h-4 w-4 text-emerald-400" />}
            iconBg="bg-emerald-500/10"
            subColor="text-emerald-400"
          />
          <StatCard
            label="Updated"
            value={summary.UPDATE.toLocaleString()}
            sub="UPDATE operations"
            icon={<FileText className="h-4 w-4 text-blue-400" />}
            iconBg="bg-blue-500/10"
            subColor="text-blue-400"
          />
          <StatCard
            label="Deleted"
            value={summary.DELETE.toLocaleString()}
            sub="DELETE operations"
            icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
            iconBg="bg-red-500/10"
            subColor="text-red-400"
          />
          <StatCard
            label="Status Changes"
            value={summary.STATUS_CHANGE.toLocaleString()}
            sub="Lifecycle state transitions"
            icon={<CheckCircle2 className="h-4 w-4 text-purple-400" />}
            iconBg="bg-purple-500/10"
            subColor="text-purple-400"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Activity Trail</CardTitle>
            <span className="text-xs text-[#5c6370]">
              ({pagination.total.toLocaleString()} {pagination.total === 1 ? 'event' : 'events'})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="h-8 text-xs gap-1.5 text-[#9ba3af] hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </Button>
          </div>
        </CardHeader>

        {/* Filter Controls Bar */}
        <div className="px-4 sm:px-5 py-3 border-y border-[#2e3139] bg-[#111215]/60 flex flex-wrap gap-2.5 items-center">
          {/* Action Filter */}
          <div className="w-full sm:w-36">
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="h-8 w-full rounded-lg border border-[#2e3139] bg-[#1a1c20] px-2.5 text-[12px] text-white focus:outline-none focus:border-[#F05A22]"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            </select>
          </div>

          {/* Module / Resource Filter */}
          <div className="w-full sm:w-44">
            <select
              value={resourceFilter}
              onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
              className="h-8 w-full rounded-lg border border-[#2e3139] bg-[#1a1c20] px-2.5 text-[12px] text-white focus:outline-none focus:border-[#F05A22]"
            >
              <option value="">All Modules</option>
              <option value="novaretournaments">Tournaments</option>
              <option value="novareenquiries">Enquiries</option>
              <option value="users">User Accounts</option>
              <option value="coachprofiles">Coach Profiles</option>
              <option value="adminusers">Administrators</option>
              <option value="sports">Sports</option>
              <option value="venues">Venues</option>
              <option value="bookings">Bookings</option>
              <option value="withdrawalrequests">Withdrawals</option>
            </select>
          </div>

          {/* Outcome Filter */}
          <div className="w-full sm:w-32">
            <select
              value={outcomeFilter}
              onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
              className="h-8 w-full rounded-lg border border-[#2e3139] bg-[#1a1c20] px-2.5 text-[12px] text-white focus:outline-none focus:border-[#F05A22]"
            >
              <option value="">All Results</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILURE">FAILURE</option>
            </select>
          </div>

          {/* Actor Email (exact match per docs) */}
          <div className="relative w-full sm:w-48">
            <input
              type="text"
              value={actorEmailFilter}
              onChange={(e) => { setActorEmailFilter(e.target.value); setPage(1); }}
              placeholder="Exact admin email..."
              className="h-8 w-full rounded-lg border border-[#2e3139] bg-[#1a1c20] px-2.5 text-[12px] text-white placeholder-[#5c6370] focus:outline-none focus:border-[#F05A22]"
            />
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] text-[#5c6370]">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="h-8 rounded-lg border border-[#2e3139] bg-[#1a1c20] px-2 text-[12px] text-white focus:outline-none focus:border-[#F05A22]"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] text-[#5c6370]">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="h-8 rounded-lg border border-[#2e3139] bg-[#1a1c20] px-2 text-[12px] text-white focus:outline-none focus:border-[#F05A22]"
            />
          </div>
        </div>

        <CardContent className="pt-3">
          {/* Error Message */}
          {loadError && (
            <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between text-xs text-red-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{loadError}</span>
              </div>
              <Button
                variant="outline"
                onClick={loadLogs}
                className="h-7 px-2.5 text-[11px] text-red-300 border-red-500/30 hover:bg-red-500/20"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loadingLogs ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <div className="h-7 w-7 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin mb-3" />
              <p className="text-xs text-[#5c6370]">Retrieving verified audit records...</p>
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<History className="h-8 w-8 text-[#5c6370]" />}
              title="No activity found for these filters"
              text="Try adjusting the action, date range, or administrator email filters above."
            />
          ) : (
            <>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Date & Time</Th>
                    <Th>Administrator</Th>
                    <Th>Role</Th>
                    <Th>Action</Th>
                    <Th>Module</Th>
                    <Th>Affected Record</Th>
                    <Th>Result</Th>
                    <Th className="text-right">Details</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {logs.map((record) => {
                    const rowKey = record._id || `${record.timestamp}_${record.action}_${record.resourceId}`;
                    const formattedDate = record.timestamp
                      ? new Date(record.timestamp).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : '—';

                    const actionBadgeClass = ACTION_COLORS[record.action] || 'badge-gray';
                    const isSuccess = record.outcome?.toUpperCase() === 'SUCCESS';

                    return (
                      <Tr key={rowKey}>
                        {/* Timestamp */}
                        <Td>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium text-white whitespace-nowrap" title={record.timestamp}>
                              {formattedDate}
                            </span>
                            <span className="text-[10px] text-[#5c6370] font-mono truncate max-w-[130px]">
                              {record.timestamp}
                            </span>
                          </div>
                        </Td>

                        {/* Administrator */}
                        <Td>
                          <div className="flex flex-col min-w-0 max-w-[190px]">
                            <span className="text-xs font-medium text-white truncate" title={record.actorEmail}>
                              {record.actorEmail || 'System / Automated'}
                            </span>
                            {record.actorId && (
                              <span className="text-[10px] text-[#5c6370] font-mono truncate" title={record.actorId}>
                                ID: {record.actorId}
                              </span>
                            )}
                          </div>
                        </Td>

                        {/* Role */}
                        <Td>
                          <Badge className={record.actorRole === 'super_admin' ? 'badge-purple' : 'badge-blue'}>
                            {record.actorRole || 'admin'}
                          </Badge>
                        </Td>

                        {/* Action */}
                        <Td>
                          <span className={clsx('px-2 py-0.5 text-[11px] font-bold rounded-md whitespace-nowrap', actionBadgeClass)}>
                            {record.action}
                          </span>
                        </Td>

                        {/* Module */}
                        <Td>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium text-white whitespace-nowrap">
                              {getResourceLabel(record.resource)}
                            </span>
                            <span className="text-[10px] text-[#5c6370] font-mono truncate max-w-[110px]" title={record.resource}>
                              {record.resource}
                            </span>
                          </div>
                        </Td>

                        {/* Affected Record */}
                        <Td>
                          {record.resourceId ? (
                            <div className="flex items-center gap-1.5 max-w-[150px]">
                              <span className="text-xs text-[#9ba3af] font-mono truncate" title={record.resourceId}>
                                {record.resourceId}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(record.resourceId || '')}
                                title="Copy record ID"
                                className="text-[#5c6370] hover:text-white flex-shrink-0"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#5c6370]">—</span>
                          )}
                        </Td>

                        {/* Result */}
                        <Td>
                          <div className="flex items-center gap-1.5">
                            {isSuccess ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> SUCCESS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                                <XCircle className="w-3 h-3" /> FAILURE
                              </span>
                            )}
                          </div>
                        </Td>

                        {/* Details Button */}
                        <Td className="text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(record._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg text-[#9ba3af] hover:text-white bg-[#1a1c20] hover:bg-[#252830] border border-[#2e3139] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#2e3139] mt-3">
                <div className="flex items-center gap-2 text-xs text-[#5c6370]">
                  <span>Rows per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-7 rounded border border-[#2e3139] bg-[#1a1c20] px-2 text-xs text-white focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="ml-2">
                    Showing {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} -{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} records
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={pagination.page <= 1 || loadingLogs}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="h-8 px-2.5 rounded-lg border border-[#2e3139] bg-[#1a1c20] text-xs text-[#9ba3af] hover:text-white hover:bg-[#252830] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <span className="text-xs text-[#9ba3af] px-2">
                    Page <strong className="text-white">{pagination.page}</strong> of{' '}
                    <strong className="text-white">{Math.max(1, pagination.totalPages)}</strong>
                  </span>

                  <button
                    disabled={pagination.page >= pagination.totalPages || loadingLogs}
                    onClick={() => setPage(p => p + 1)}
                    className="h-8 px-2.5 rounded-lg border border-[#2e3139] bg-[#1a1c20] text-xs text-[#9ba3af] hover:text-white hover:bg-[#252830] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Read-Only Drawer / Modal */}
      <Modal
        open={!!selectedRecordId}
        onClose={handleCloseDetail}
        title="Audit Record Inspection"
        size="xl"
      >
        {loadingDetail ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="h-7 w-7 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin mb-3" />
            <p className="text-xs text-[#5c6370]">Loading sanitized record payload...</p>
          </div>
        ) : detailError ? (
          <div className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white mb-1">{detailError}</p>
            <p className="text-xs text-[#5c6370]">The requested audit log identifier is not found on the database cluster.</p>
          </div>
        ) : detailData ? (
          <div className="space-y-5 text-xs text-[#9ba3af]">
            {/* Top Bar: Action & Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#141518] border border-[#2e3139] rounded-xl">
              <div className="flex items-center gap-2.5">
                <span className={clsx('px-2.5 py-1 text-xs font-bold rounded-lg', ACTION_COLORS[detailData.action] || 'badge-gray')}>
                  {detailData.action}
                </span>
                <span className={clsx('px-2.5 py-1 text-xs font-bold rounded-lg',
                  detailData.outcome?.toUpperCase() === 'SUCCESS'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                )}>
                  {detailData.outcome}
                </span>
                {detailData.httpStatus && (
                  <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#21242a] text-white">
                    HTTP {detailData.httpStatus}
                  </span>
                )}
              </div>

              <div className="text-right">
                <p className="text-xs text-white font-medium">
                  {detailData.timestamp ? new Date(detailData.timestamp).toLocaleString() : '—'}
                </p>
                <p className="text-[10px] text-[#5c6370] font-mono">
                  {detailData.timestamp} (UTC)
                </p>
              </div>
            </div>

            {/* Truncated Snapshot Notice */}
            {detailData.snapshotTruncated && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>Snapshot Notice:</strong> Some details were omitted or truncated due to payload size limits.
                </span>
              </div>
            )}

            {/* Core Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 bg-[#141518] border border-[#2e3139] rounded-xl">
              <DetailRow
                label="Administrator"
                value={
                  <div>
                    <span className="text-white font-medium">{detailData.actorEmail || 'System'}</span>
                    {detailData.actorRole && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {detailData.actorRole}
                      </span>
                    )}
                  </div>
                }
              />
              <DetailRow
                label="Actor MongoDB ID"
                value={<span className="font-mono text-white">{detailData.actorId || '—'}</span>}
              />
              <DetailRow
                label="Module / Collection"
                value={
                  <div>
                    <span className="text-white font-medium">{getResourceLabel(detailData.resource)}</span>{' '}
                    <span className="text-[#5c6370] font-mono">({detailData.resource})</span>
                  </div>
                }
              />
              <DetailRow
                label="Affected Record ID"
                value={
                  detailData.resourceId ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-white select-all">{detailData.resourceId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(detailData.resourceId || '')}
                        className="text-[#5c6370] hover:text-white"
                        title="Copy ID"
                      >
                        {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ) : '—'
                }
              />
              <DetailRow
                label="IP Address"
                value={<span className="font-mono text-white">{detailData.ipAddress || '—'}</span>}
              />
              <DetailRow
                label="Request ID"
                value={<span className="font-mono text-white">{detailData.requestId || '—'}</span>}
              />
            </div>

            {/* Changed Fields Tags */}
            {Array.isArray(detailData.changedFields) && detailData.changedFields.length > 0 && (
              <div className="p-3.5 bg-[#141518] border border-[#2e3139] rounded-xl">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5c6370] block mb-2">
                  Modified Properties ({detailData.changedFields.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {detailData.changedFields.map(f => (
                    <span key={f} className="px-2 py-0.5 font-mono text-[11px] rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Side-by-Side State Snapshots */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white block">
                State Snapshots (Side-by-Side Verification)
              </span>

              {detailData.outcome === 'FAILURE' && !detailData.before && !detailData.after ? (
                <div className="p-4 bg-[#141518] border border-[#2e3139] rounded-xl text-center text-[#5c6370]">
                  No state snapshots recorded for failed execution attempt.
                </div>
              ) : (
                <div className="border border-[#2e3139] rounded-xl overflow-hidden bg-[#101114]">
                  <div className="grid grid-cols-12 bg-[#181a1f] px-3.5 py-2.5 text-[11px] font-semibold text-[#9ba3af] border-b border-[#2e3139]">
                    <div className="col-span-3">Field</div>
                    <div className="col-span-4 border-l border-[#2e3139] pl-3">Before State</div>
                    <div className="col-span-5 border-l border-[#2e3139] pl-3">After State</div>
                  </div>

                  <div className="divide-y divide-[#22252c] max-h-[360px] overflow-y-auto">
                    {/* CREATE: before is null */}
                    {detailData.action === 'CREATE' && detailData.before === null && (
                      <div className="p-3 bg-emerald-500/5 text-emerald-400 text-xs border-b border-[#2e3139] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>Created new entity: Prior state is empty (null).</span>
                      </div>
                    )}

                    {/* DELETE: after is null */}
                    {detailData.action === 'DELETE' && detailData.after === null && (
                      <div className="p-3 bg-red-500/5 text-red-400 text-xs border-b border-[#2e3139] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Entity deleted: Subsequent state is purged (null).</span>
                      </div>
                    )}

                    {getSnapshotComparisonKeys().map(key => {
                      const beforeVal = detailData.before ? detailData.before[key] : undefined;
                      const afterVal = detailData.after ? detailData.after[key] : undefined;
                      const isFieldChanged = detailData.changedFields?.includes(key);

                      const beforeFmt = formatSnapshotValue(beforeVal);
                      const afterFmt = formatSnapshotValue(afterVal);

                      return (
                        <div
                          key={key}
                          className={clsx(
                            "grid grid-cols-12 px-3.5 py-2.5 items-start text-xs",
                            isFieldChanged && "bg-blue-500/[0.04]"
                          )}
                        >
                          {/* Field Name */}
                          <div className="col-span-3 pr-2 font-mono text-[#9ba3af] break-all">
                            <span className={clsx(isFieldChanged && "text-blue-400 font-bold")}>
                              {key}
                            </span>
                            {isFieldChanged && (
                              <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300">
                                changed
                              </span>
                            )}
                          </div>

                          {/* Before Value */}
                          <div className="col-span-4 border-l border-[#22252c] pl-3 pr-2 font-mono break-all text-[#9ba3af]">
                            {beforeFmt.isObject ? (
                              <pre className="p-2 bg-[#0a0a0d] rounded border border-[#2e3139] text-[10px] overflow-x-auto whitespace-pre-wrap max-h-40">
                                {beforeFmt.text}
                              </pre>
                            ) : (
                              <span>{beforeFmt.text}</span>
                            )}
                          </div>

                          {/* After Value */}
                          <div className="col-span-5 border-l border-[#22252c] pl-3 font-mono break-all text-white">
                            {afterFmt.isObject ? (
                              <pre className="p-2 bg-[#0a0a0d] rounded border border-[#2e3139] text-[10px] overflow-x-auto whitespace-pre-wrap max-h-40 text-emerald-300">
                                {afterFmt.text}
                              </pre>
                            ) : (
                              <span className={clsx(isFieldChanged && "text-emerald-400 font-semibold")}>
                                {afterFmt.text}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {getSnapshotComparisonKeys().length === 0 && (
                      <div className="p-6 text-center text-[#5c6370]">
                        No property differences recorded for this event.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Read-only Security Note */}
            <div className="pt-2 text-[10px] text-[#5c6370] text-center border-t border-[#2e3139]">
              Verified audit logs are tamper-evident and permanently read-only. Modification and deletion are disabled by security policy.
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

