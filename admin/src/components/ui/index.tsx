import React, { ReactNode, useEffect, useId, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { X, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={clsx('badge', className)}>{children}</span>;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('card', className)}>{children}</div>;
}
export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 min-w-0 border-b border-slate-100', className)}>{children}</div>;
}
export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={clsx('text-sm font-semibold text-slate-900 truncate min-w-0', className)}>{children}</h3>;
}
export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('px-4 sm:px-5 py-4 sm:py-5 min-w-0', className)}>{children}</div>;
}

const STAT_TONES: Record<string, { card: string; spark: string }> = {
  blue:    { card: 'bg-gradient-to-br from-[#fafcff] via-[#f3f8ff] to-[#e7f0ff] border-blue-100/90',       spark: 'text-blue-500' },
  emerald: { card: 'bg-gradient-to-br from-[#fafdfb] via-[#f1fcf6] to-[#e2f8ec] border-emerald-100/90',    spark: 'text-emerald-500' },
  amber:   { card: 'bg-gradient-to-br from-[#fffdfb] via-[#fff9ed] to-[#fef0d4] border-amber-100/90',      spark: 'text-amber-500' },
  rose:    { card: 'bg-gradient-to-br from-[#fffbfc] via-[#fff4f6] to-[#ffe5e9] border-rose-100/90',       spark: 'text-rose-500' },
  purple:  { card: 'bg-gradient-to-br from-[#fcfaff] via-[#f7f2ff] to-[#ede4ff] border-purple-100/90',     spark: 'text-purple-500' },
  orange:  { card: 'bg-gradient-to-br from-[#fffcfb] via-[#fff6f0] to-[#ffe9db] border-orange-100/90',     spark: 'text-[#F05A22]' },
};

function buildSparklinePath(data: number[]): { line: string; area: string } | null {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 64;
  const h = 24;
  const padY = 3;
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * w;
    const norm = max === min ? 0.5 : (val - min) / (max - min);
    const y = max === 0 ? h - padY : h - padY - norm * (h - padY * 2);
    return { x, y };
  });
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return { line, area };
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  icon: ReactNode;
  iconBg?: string;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'orange';
  sparklineData?: number[];
  onClick?: () => void;
  active?: boolean;
}
export function StatCard({
  label,
  value,
  sub,
  subColor = 'text-emerald-600',
  icon,
  iconBg = 'bg-emerald-50 text-emerald-600',
  tone = 'blue',
  sparklineData,
  onClick,
  active = false,
}: StatCardProps) {
  const toneStyle = STAT_TONES[tone] || STAT_TONES.blue;
  const spark = sparklineData ? buildSparklinePath(sparklineData) : null;
  return (
    <div
      onClick={onClick}
      className={clsx(
        'stat-card min-w-0 w-full overflow-hidden relative transition-transform',
        toneStyle.card,
        onClick && 'cursor-pointer hover:scale-[1.01]'
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0 relative z-10">
        <div className={clsx('h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/90 shadow-xs', iconBg)}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{label}</p>
          <p className="mt-0.5 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate">{value}</p>
          {sub && <p className={clsx('mt-0.5 text-[11px] truncate font-medium', subColor)}>{sub}</p>}
        </div>
      </div>
      {spark && (
        <svg className={clsx('pointer-events-none absolute right-3 bottom-2 w-16 h-6 opacity-60', toneStyle.spark)} viewBox="0 0 64 24" fill="none">
          <path d={spark.area} fill="currentColor" fillOpacity="0.14" />
          <path d={spark.line} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto min-w-0">
      <table className={clsx('w-full border-collapse text-[12px] min-w-[640px] lg:min-w-full', className)}>{children}</table>
    </div>
  );
}
export function Thead({ children }: { children: ReactNode }) { return <thead className="bg-slate-100/80 border-b border-slate-200/80">{children}</thead>; }
export function Tbody({ children }: { children: ReactNode }) { return <tbody>{children}</tbody>; }
export function Th({ children, className, title }: { children?: ReactNode; className?: string; title?: string }) {
  return <th title={title} className={clsx('px-3 sm:px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap', className)}>{children}</th>;
}
export function Td({ children, className, colSpan, onClick, title }: { children: ReactNode; className?: string; colSpan?: number; onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void; title?: string }) {
  return <td title={title} colSpan={colSpan} onClick={onClick} className={clsx('px-3 sm:px-4 py-2.5 text-slate-800', className)}>{children}</td>;
}
export function Tr({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void }) {
  return <tr onClick={onClick} className={clsx('table-row last:border-0', className)}>{children}</tr>;
}

const COLORS = [
  'bg-[#F05A22]/10 text-[#F05A22] border border-[#F05A22]/20',
  'bg-blue-50 text-blue-600 border border-blue-200',
  'bg-amber-50 text-amber-600 border border-amber-200',
  'bg-emerald-50 text-emerald-600 border border-emerald-200',
  'bg-purple-50 text-purple-600 border border-purple-200',
  'bg-teal-50 text-teal-600 border border-teal-200',
];
export function Avatar({ initials, src, size = 32, className }: { initials: string; src?: string; size?: number; className?: string }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [src]);
  const idx = (initials.charCodeAt(0) || 0) % COLORS.length;
  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={initials}
        onError={() => setImgError(true)}
        className={clsx('rounded-full object-cover flex-shrink-0 border border-slate-200', className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div className={clsx('flex items-center justify-center rounded-full font-bold flex-shrink-0', COLORS[idx], className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'outline' | 'danger' | 'ghost'; }
export function Button({ variant = 'outline', className, children, ...props }: BtnProps) {
  return (
    <button className={clsx({ 'btn-primary': variant==='primary', 'btn-outline': variant==='outline', 'btn-danger': variant==='danger', 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl px-3 py-1.5 text-sm': variant==='ghost' },
      'inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed', className)} {...props}>
      {children}
    </button>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; }
export function Input({ label, className, id, name, ...props }: InputProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={fieldId} className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{label}</label>}
      <input id={fieldId} name={name || fieldId} className={clsx('input-field', className)} {...props} />
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; }
export function Textarea({ label, className, id, name, ...props }: TextareaProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={fieldId} className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{label}</label>}
      <textarea id={fieldId} name={name || fieldId} className={clsx('input-field resize-none', className)} {...props} />
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; options: { value: string; label: string }[]; }
export function Select({ label, options, className, id, name, ...props }: SelectProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={fieldId} className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{label}</label>}
      <select id={fieldId} name={name || fieldId} className={clsx('input-field', className)} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md', closeOnBackdropClick = true }: { open: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm'|'md'|'lg'|'xl'; closeOnBackdropClick?: boolean }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  const widths = { sm:'max-w-md', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" onClick={closeOnBackdropClick ? onClose : undefined}>
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" />
      <div className={clsx('relative w-full max-w-[calc(100vw-1rem)] bg-[#fafbfd] border border-slate-200/90 rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden', widths[size])}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-gradient-to-r from-[#f2f6fc] to-white border-b border-slate-200/80 flex-shrink-0">
          <h2 className="text-base font-extrabold tracking-tight text-slate-900 truncate min-w-0 pr-2">{title}</h2>
          <button onClick={onClose} className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5 min-w-0 bg-white/70">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }:
  { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; danger?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#fafbfd] border border-slate-200/90 rounded-3xl shadow-2xl p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={clsx('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl', danger ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100')}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-sm truncate">{title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" className="h-9 text-xs" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} className="h-9 text-xs" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search...', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const searchId = useId();
  return (
    <div className={clsx("relative w-full sm:w-64 min-w-0 flex-shrink", className)}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <input id={searchId} name="search" aria-label={placeholder} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#F05A22] transition-colors"/>
    </div>
  );
}

export function FilterPill({
  label,
  active,
  onClick,
  dotColor,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  accent?: 'blue' | 'orange';
  dotColor?: string;
  count?: number | string;
}) {
  const activeClass =
    'bg-gradient-to-r from-[#fff6f0] via-[#ffecdf] to-[#ffe1cc] text-[#c2410c] border-[#fdba74]/85 shadow-[0_2px_8px_rgba(240,90,34,0.12)]';
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 text-[11px] font-semibold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap',
        active
          ? activeClass
          : 'border-slate-200/90 bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
      )}
    >
      {dotColor && (
        <span className={clsx('h-2 w-2 rounded-full flex-shrink-0', active ? 'bg-[#F05A22]' : dotColor)} />
      )}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={clsx(
            'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
            active
              ? 'bg-white/90 text-[#c2410c] border border-orange-200/80'
              : 'bg-white text-slate-600'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function ProgressBar({ label, value, pct, color = 'bg-emerald-500' }: { label?: string; value?: string | number; pct?: number; color?: string }) {
  const percent = pct ?? (typeof value === 'number' ? value : parseFloat(String(value || '0')) || 0);
  return (
    <div>
      {label && (
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-slate-500 font-medium">{label}</span>
          <span className="font-semibold text-slate-800 tabular-nums">{value}</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={clsx('h-full rounded-full transition-all duration-700', color)} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

export function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < rating ? 'text-amber-400' : 'text-slate-200'} style={{ fontSize: 13 }}>★</span>
      ))}
    </div>
  );
}

export function EmptyState({ emoji, icon, text, title }: { emoji?: string; icon?: ReactNode; text?: string; title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon ? <div className="mb-3 text-slate-400">{icon}</div> : <span style={{ fontSize: 40 }} className="mb-3">{emoji}</span>}
      <p className="text-sm font-medium text-slate-500">{text || title}</p>
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 min-w-0">
      <h2 className="text-base font-bold text-slate-900 truncate min-w-0">{title}</h2>
      {action}
    </div>
  );
}

export function DetailRow({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-col gap-0.5 min-w-0', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">{label}</p>
      <div className="text-sm font-medium text-slate-800 break-words min-w-0">{value}</div>
    </div>
  );
}

export function usePagination<T>(items: T[], initialPageSize = 8) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize === 10 ? 8 : initialPageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const startIdx = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalItems);

  return { page, setPage, pageSize, setPageSize, totalItems, totalPages, paginatedItems, startIdx, endIdx };
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  startIdx,
  endIdx,
  onPageChange,
  onPageSizeChange,
  noun = 'records',
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  startIdx: number;
  endIdx: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
  noun?: string;
}) {
  if (totalItems === 0) return null;

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
      pages.push(p);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-slate-200/70 bg-gradient-to-r from-slate-50/90 via-white/95 to-slate-50/90">
      <div className="flex items-center gap-2.5 text-xs text-slate-500 flex-wrap justify-center sm:justify-start">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/90 border border-slate-200/80 px-3 py-1 text-[11px] font-medium text-slate-600">
          Showing <strong className="text-slate-900">{startIdx}–{endIdx}</strong> of <strong className="text-slate-900">{totalItems}</strong> {noun}
        </span>
        <label className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 shadow-2xs">
          <span>Per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-transparent py-0.5 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
          >
            {[8, 15, 25, 50].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-2xs">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="h-7 px-2.5 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-2xs disabled:opacity-35 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer transition-all"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {getPageNumbers().map((item, idx) =>
          item === '...' ? (
            <span key={`e-${idx}`} className="px-1.5 text-xs text-slate-400">...</span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={clsx(
                'h-7 min-w-[28px] px-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                page === item
                  ? 'bg-gradient-to-r from-[#fff6f0] via-[#ffecdf] to-[#ffe1cc] text-[#c2410c] border border-[#fdba74]/90 shadow-sm'
                  : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
              )}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="h-7 px-2.5 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-2xs disabled:opacity-35 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer transition-all"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-xl bg-gradient-to-r from-slate-200/80 via-slate-100/90 to-slate-200/80', className)} />;
}

export function PageSkeleton({ statCount = 4, cols = 6, rows = 6 }: { statCount?: number; cols?: number; rows?: number }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 min-w-0 max-w-full">
      <StatCardsSkeleton count={statCount} />
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-44 rounded-xl" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </div>
        <TableSkeleton rows={rows} cols={cols} />
      </div>
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  const cols =
    count === 5
      ? 'grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'
      : 'grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4';
  return (
    <div className={clsx('grid', cols)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card bg-white/80 border-slate-200/80">
          <div className="flex items-center gap-3.5">
            <Skeleton className="h-11 w-11 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-6 w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full overflow-hidden">
      <div className="bg-slate-100/80 border-y border-slate-200/80 px-4 py-3 flex items-center gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1 max-w-[120px]" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-3.5 flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0 max-w-[200px]">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
            {Array.from({ length: Math.max(1, cols - 2) }).map((_, c) => (
              <Skeleton key={c} className="h-5 flex-1 max-w-[96px] rounded-full hidden sm:block" />
            ))}
            <div className="ml-auto flex gap-1.5">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 space-y-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 min-w-0 max-w-full">
      <StatCardsSkeleton count={4} />
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AppShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden md:flex w-[224px] flex-shrink-0 flex-col bg-[#0b1c3d] p-4 gap-3">
        <Skeleton className="h-12 w-full bg-white/10 rounded-xl" />
        <Skeleton className="h-6 w-24 bg-white/10 rounded-full" />
        <div className="space-y-2 pt-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col min-w-0 bg-gradient-to-br from-[#eef2f7] via-[#f6f8fc] to-[#e7edf6]">
        <div className="h-[96px] border-b border-slate-200/70 bg-white/70 px-6 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-3 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-xl" />
            <Skeleton className="h-9 w-20 rounded-xl" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>
        <DashboardSkeleton />
      </div>
    </div>
  );
}

