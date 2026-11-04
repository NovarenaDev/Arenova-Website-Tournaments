import React, { ReactNode, useEffect } from 'react';
import { clsx } from 'clsx';
import { X, AlertTriangle } from 'lucide-react';

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={clsx('badge', className)}>{children}</span>;
}

// ── Card ──────────────────────────────────────────────────────────────────────
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

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps { label: string; value: string; sub?: string; subColor?: string; icon: ReactNode; iconBg?: string; }
export function StatCard({ label, value, sub, subColor = 'text-emerald-600', icon, iconBg = 'bg-emerald-50 text-emerald-600' }: StatCardProps) {
  return (
    <div className="stat-card min-w-0 w-full overflow-hidden">
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">{label}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">{value}</p>
          {sub && <p className={clsx('mt-1 text-xs truncate font-medium', subColor)}>{sub}</p>}
        </div>
        <div className={clsx('rounded-xl p-2.5 flex-shrink-0 border border-slate-100', iconBg)}>{icon}</div>
      </div>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto min-w-0">
      <table className={clsx('w-full border-collapse text-[12px] min-w-[550px]', className)}>{children}</table>
    </div>
  );
}
export function Thead({ children }: { children: ReactNode }) { return <thead className="bg-slate-50/75 border-b border-slate-200/80">{children}</thead>; }
export function Tbody({ children }: { children: ReactNode }) { return <tbody>{children}</tbody>; }
export function Th({ children, className, title }: { children?: ReactNode; className?: string; title?: string }) {
  return <th title={title} className={clsx('px-3 sm:px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap', className)}>{children}</th>;
}
export function Td({ children, className, colSpan, onClick, title }: { children: ReactNode; className?: string; colSpan?: number; onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void; title?: string }) {
  return <td title={title} colSpan={colSpan} onClick={onClick} className={clsx('px-3 sm:px-4 py-3.5 text-slate-800', className)}>{children}</td>;
}
export function Tr({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void }) {
  return <tr onClick={onClick} className={clsx('table-row last:border-0', className)}>{children}</tr>;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const COLORS = [
  'bg-[#F05A22]/10 text-[#F05A22] border border-[#F05A22]/20',
  'bg-blue-50 text-blue-600 border border-blue-200',
  'bg-amber-50 text-amber-600 border border-amber-200',
  'bg-emerald-50 text-emerald-600 border border-emerald-200',
  'bg-purple-50 text-purple-600 border border-purple-200',
  'bg-teal-50 text-teal-600 border border-teal-200',
];
export function Avatar({ initials, size = 32, className }: { initials: string; size?: number; className?: string }) {
  const idx = (initials.charCodeAt(0) || 0) % COLORS.length;
  return (
    <div className={clsx('flex items-center justify-center rounded-full font-bold flex-shrink-0', COLORS[idx], className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'outline' | 'danger' | 'ghost'; }
export function Button({ variant = 'outline', className, children, ...props }: BtnProps) {
  return (
    <button className={clsx({ 'btn-primary': variant==='primary', 'btn-outline': variant==='outline', 'btn-danger': variant==='danger', 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl px-3 py-1.5 text-sm': variant==='ghost' },
      'inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed', className)} {...props}>
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; }
export function Input({ label, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-slate-700">{label}</label>}
      <input className={clsx('input-field', className)} {...props} />
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; }
export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-slate-700">{label}</label>}
      <textarea className={clsx('input-field resize-none', className)} {...props} />
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; options: { value: string; label: string }[]; }
export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-slate-700">{label}</label>}
      <select className={clsx('input-field', className)} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm'|'md'|'lg'|'xl' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  const widths = { sm:'max-w-md', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div className={clsx('relative w-full max-w-[calc(100vw-1rem)] bg-white border border-slate-200 rounded-3xl shadow-2xl max-h-[92vh] flex flex-col', widths[size])}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-bold text-slate-900 truncate min-w-0 pr-2">{title}</h2>
          <button onClick={onClose} className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5 min-w-0">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }:
  { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; danger?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl p-5 sm:p-6">
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

// ── Search Bar ────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Search...', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={clsx("relative w-full sm:w-64 min-w-0 flex-shrink", className)}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#F05A22] transition-colors"/>
    </div>
  );
}

// ── Filter Pill ───────────────────────────────────────────────────────────────
export function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={clsx('text-[11px] font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer',
      active ? 'bg-[#F05A22] text-white border-[#F05A22] shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900')}>
      {label}
    </button>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
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

// ── Stars ─────────────────────────────────────────────────────────────────────
export function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < rating ? 'text-amber-400' : 'text-slate-200'} style={{ fontSize: 13 }}>★</span>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ emoji, icon, text, title }: { emoji?: string; icon?: ReactNode; text?: string; title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon ? <div className="mb-3 text-slate-400">{icon}</div> : <span style={{ fontSize: 40 }} className="mb-3">{emoji}</span>}
      <p className="text-sm font-medium text-slate-500">{text || title}</p>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 min-w-0">
      <h2 className="text-base font-bold text-slate-900 truncate min-w-0">{title}</h2>
      {action}
    </div>
  );
}

// ── Detail Row (for view modals) ──────────────────────────────────────────────
export function DetailRow({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-col gap-0.5 min-w-0', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">{label}</p>
      <div className="text-sm font-medium text-slate-800 break-words min-w-0">{value}</div>
    </div>
  );
}
