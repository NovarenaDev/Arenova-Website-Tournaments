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
  return <div className={clsx('flex items-center justify-between px-5 pt-5 pb-3', className)}>{children}</div>;
}
export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={clsx('text-sm font-semibold text-white', className)}>{children}</h3>;
}
export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('px-5 pb-5', className)}>{children}</div>;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps { label: string; value: string; sub?: string; subColor?: string; icon: ReactNode; iconBg?: string; }
export function StatCard({ label, value, sub, subColor = 'text-emerald-400', icon, iconBg = 'bg-emerald-500/10' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5c6370]">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">{value}</p>
          {sub && <p className={clsx('mt-1 text-[11px]', subColor)}>{sub}</p>}
        </div>
        <div className={clsx('rounded-lg p-2', iconBg)}>{icon}</div>
      </div>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({ children }: { children: ReactNode }) { return <table className="w-full border-collapse text-[12px]">{children}</table>; }
export function Thead({ children }: { children: ReactNode }) { return <thead>{children}</thead>; }
export function Tbody({ children }: { children: ReactNode }) { return <tbody>{children}</tbody>; }
export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={clsx('px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#5c6370]', className)}>{children}</th>;
}
export function Td({ children, className, colSpan, onClick }: { children: ReactNode; className?: string; colSpan?: number; onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void }) {
  return <td colSpan={colSpan} onClick={onClick} className={clsx('px-4 py-3 text-white', className)}>{children}</td>;
}
export function Tr({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void }) {
  return <tr onClick={onClick} className={clsx('table-row last:border-0', className)}>{children}</tr>;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const COLORS = [
  'bg-[#F05A22]/15 text-[#F05A22]',
  'bg-[#1B2B6B]/30 text-blue-300',
  'bg-amber-500/10 text-amber-400',
  'bg-emerald-500/10 text-emerald-400',
  'bg-purple-500/10 text-purple-400',
  'bg-teal-500/10 text-teal-400',
];
export function Avatar({ initials, size = 32, className }: { initials: string; size?: number; className?: string }) {
  const idx = (initials.charCodeAt(0) || 0) % COLORS.length;
  return (
    <div className={clsx('flex items-center justify-center rounded-full font-semibold flex-shrink-0', COLORS[idx], className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'outline' | 'danger' | 'ghost'; }
export function Button({ variant = 'outline', className, children, ...props }: BtnProps) {
  return (
    <button className={clsx({ 'btn-primary': variant==='primary', 'btn-outline': variant==='outline', 'btn-danger': variant==='danger', 'text-[#9ba3af] hover:text-white text-sm': variant==='ghost' },
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
      {label && <label className="text-xs font-medium text-[#9ba3af]">{label}</label>}
      <input className={clsx('input-field', className)} {...props} />
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; }
export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-[#9ba3af]">{label}</label>}
      <textarea className={clsx('input-field resize-none', className)} {...props} />
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; options: { value: string; label: string }[]; }
export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-[#9ba3af]">{label}</label>}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className={clsx('relative w-full bg-[#141518] border border-[#2e3139] rounded-2xl shadow-2xl max-h-[90vh] flex flex-col', widths[size])}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2e3139] flex-shrink-0">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5c6370] hover:bg-[#21242a] hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }:
  { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; danger?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#141518] border border-[#2e3139] rounded-2xl shadow-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={clsx('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', danger ? 'bg-red-500/10' : 'bg-amber-500/10')}>
            <AlertTriangle className={clsx('h-5 w-5', danger ? 'text-red-400' : 'text-amber-400')} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{title}</h3>
            <p className="text-xs text-[#9ba3af] mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} className="h-8 text-xs" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

// ── Search Bar ────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5c6370]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="h-8 w-52 rounded-lg border border-[#2e3139] bg-[#1a1c20] pl-8 pr-3 text-[12px] text-white placeholder-[#5c6370] focus:outline-none focus:border-[#F05A22] transition-colors"/>
    </div>
  );
}

// ── Filter Pill ───────────────────────────────────────────────────────────────
export function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={clsx('text-[11px] font-medium px-3 py-1 rounded-full border transition-colors cursor-pointer',
      active ? 'bg-[#F05A22]/10 text-[#F05A22] border-[#F05A22]/30' : 'border-[#2e3139] text-[#5c6370] hover:border-[#3a3e48] hover:text-[#9ba3af]')}>
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
          <span className="text-[#9ba3af]">{label}</span>
          <span className="font-medium text-white tabular-nums">{value}</span>
        </div>
      )}
      <div className="h-1 w-full overflow-hidden rounded-full bg-[#21242a]">
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
        <span key={i} className={i < rating ? 'text-amber-400' : 'text-[#2e3139]'} style={{ fontSize: 13 }}>★</span>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ emoji, icon, text, title }: { emoji?: string; icon?: ReactNode; text?: string; title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon ? <div className="mb-3">{icon}</div> : <span style={{ fontSize: 40 }} className="mb-3">{emoji}</span>}
      <p className="text-sm text-[#5c6370]">{text || title}</p>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {action}
    </div>
  );
}

// ── Detail Row (for view modals) ──────────────────────────────────────────────
export function DetailRow({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-col gap-0.5', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5c6370]">{label}</p>
      <div className="text-sm text-white">{value}</div>
    </div>
  );
}
