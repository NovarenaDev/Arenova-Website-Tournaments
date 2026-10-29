// ── Admin Roles & Permissions ──────────────────────────────────────────────────
export type AdminRole =
  | 'super_admin'
  | 'customer_manager'
  | 'coach_manager'
  | 'payment_manager'
  | 'booking_manager'
  | 'content_manager'
  | 'viewer';

export type Permission =
  | 'dashboard'
  | 'customers'   | 'customers_write'
  | 'coaches'     | 'coaches_write'
  | 'bookings'    | 'bookings_write'
  | 'payments'    | 'payments_write'
  | 'ratings'     | 'ratings_write'
  | 'sports'      | 'sports_write'
  | 'admins'      | 'admins_write';

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin:      ['dashboard','customers','customers_write','coaches','coaches_write','bookings','bookings_write','payments','payments_write','ratings','ratings_write','sports','sports_write','admins','admins_write'],
  customer_manager: ['dashboard','customers','customers_write'],
  coach_manager:    ['dashboard','coaches','coaches_write'],
  payment_manager:  ['dashboard','payments','payments_write','bookings'],
  booking_manager:  ['dashboard','bookings','bookings_write','customers','coaches'],
  content_manager:  ['dashboard','sports','sports_write','ratings','ratings_write'],
  viewer:           ['dashboard','customers','coaches','bookings','payments','ratings','sports'],
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin:      'Super Admin',
  customer_manager: 'Customer Manager',
  coach_manager:    'Coach Manager',
  payment_manager:  'Payment Manager',
  booking_manager:  'Booking Manager',
  content_manager:  'Content Manager',
  viewer:           'Viewer',
};

export const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin:      'badge-purple',
  customer_manager: 'badge-blue',
  coach_manager:    'badge-green',
  payment_manager:  'badge-amber',
  booking_manager:  'badge-blue',
  content_manager:  'badge-gray',
  viewer:           'badge-gray',
};

// ── Auth ───────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  firstName: string;
  lastName:  string;
  email:     string;
  role:      AdminRole;
  avatar?:   string;
  isActive:  boolean;
  lastLogin?: string;
  createdAt: string;
  createdBy?: string;
}

// ── Data Models ────────────────────────────────────────────────────────────────
export type BookingStatus = 'requested'|'accepted'|'confirmed'|'completed'|'cancelled'|'no_show';
export type KycStatus     = 'pending'|'approved'|'rejected'|'under_review';
export type PayoutStatus  = 'pending'|'processing'|'processed'|'failed';

export interface Address {
  line1:    string;
  line2?:   string;
  city:     string;
  state:    string;
  pincode:  string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName:  string;
  email:     string;
  emailId?:  string;
  mailId?:   string;
  phone:     string;
  role:      'individual'|'parent';
  children:  number;
  walletCredits: number;
  bookings:  number;
  status:    'active'|'flagged'|'suspended';
  joined:    string;
  address?:  Address;
  lastActive?: string;      // for inactive days calc
}

export interface AvailabilitySlot {
  day:       string;        // e.g. "Monday"
  startTime: string;        // e.g. "09:00 AM"
  endTime:   string;        // e.g. "12:00 PM"
}

export interface Coach {
  id: string;
  name:     string;
  email:    string;
  emailId?: string;
  mailId?:  string;
  phone:    string;
  phoneNumber?: string;
  mobile?:  string;
  mobileNumber?: string;
  contact?: string;
  contactNumber?: string;
  sports:   string[];
  rating:   number;
  sessions: number;
  grossEarnings: number;
  netEarnings:   number;
  pendingPayout: number;
  kyc:      KycStatus;
  noShows:  number;
  isActive: boolean;
  joined:   string;
  // NEW fields
  bio?:          string;
  description?:  string;
  experience?:   number;    // years
  address?:      Address;
  availability?: AvailabilitySlot[];
  requestedIndividualPrice?: number;
  requestedGroupPricePerPerson?: number;
  requestedIndividualFee?: number;
  requestedGroupFee?: number;
  requestedPrice?: number;
  requestedGroupPrice?: number;
  individualPrice?: number;
  groupPricePerPerson?: number;
  fee?:          number;
  groupFee?:     number;
  user?:         any;
  profile?:      any;
  pricing?:      any;
}

export interface Booking {
  id:        string;
  user:      string;
  coach:     string;
  sport:     string;
  date:      string;
  time:      string;
  location:  string;
  status:    BookingStatus;
  credits:   number;
  amountInr: number;
  child?:    string;
}

export interface Payment {
  id:          string;
  user:        string;
  type:        'credit_purchase'|'booking_debit'|'refund'|'payout';
  credits:     number;
  amountInr:   number;
  status:      'success'|'failed'|'pending';
  method?:     string;
  createdAt:   string;
}

export interface Payout {
  id:        string;
  coach:     string;
  amount:    number;
  method:    string;
  account:   string;
  status:    PayoutStatus;
  date:      string;
}

export interface Review {
  id:         string;
  bookingId:  string;
  user:       string;
  coach:      string;
  rating:     number;
  text:       string;
  tags:       string[];
  flagged:    boolean;
  date:       string;
}

export interface Sport {
  id:       string;
  name:     string;
  emoji:    string;
  image?:    string;
  coaches:  number;
  bookings: number;
  revenue:  number;
  status:   'active'|'inactive';
  trend:    string;
  trendUp:  boolean;
}
