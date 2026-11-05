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
  _id?: string;
  name?: string;
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
  _id?: string;
  name:     string;
  firstName?: string;
  lastName?:  string;
  email:    string;
  emailId?: string;
  mailId?:  string;
  phone:    string;
  phoneNumber?: string;
  mobile?:  string;
  mobileNumber?: string;
  contact?: string;
  contactNumber?: string;
  sport?:   string;
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

// ── Audit Logs ─────────────────────────────────────────────────────────────────
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
export type AuditOutcome = 'SUCCESS' | 'FAILURE';

export interface AuditLogItem {
  _id: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: AuditAction | string;
  resource: string;
  resourceId?: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  changedFields?: string[];
  timestamp: string;
  outcome: AuditOutcome | string;
  ipAddress?: string;
  requestId?: string;
  httpStatus?: number;
  snapshotTruncated?: boolean;
  [key: string]: any;
}

export interface AuditLogPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogSummaryData {
  totalActions: number;
  CREATE: number;
  UPDATE: number;
  DELETE: number;
  STATUS_CHANGE: number;
}

export interface AuditLogQueryFilter {
  actorId?: string;
  actorEmail?: string;
  action?: string;
  resource?: string;
  outcome?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ── Super Admin Review & Settlement Tools ─────────────────────────────────────
export interface DisputeItem {
  id: string;
  _id?: string;
  bookingId: string;
  booking?: any;
  customer?: { id?: string; name?: string; email?: string; phone?: string; firstName?: string; lastName?: string };
  coach?: { id?: string; name?: string; email?: string; phone?: string };
  sport?: string;
  amount: number;
  grossPaid?: number;
  commission?: number;
  coachNetAmount?: number;
  reason?: string;
  complaint?: string;
  financialHold?: boolean;
  status: 'pending' | 'under_review' | 'resolved' | 'released' | 'refunded' | string;
  createdAt: string;
  updatedAt?: string;
}

export interface SettlementDetail {
  bookingId: string;
  booking?: any;
  attendanceTimestamps?: {
    checkIn?: string;
    checkOut?: string;
    verified?: boolean;
    durationMinutes?: number;
  };
  customerComplaints?: Array<{
    text: string;
    submittedAt?: string;
    category?: string;
  }>;
  coachReports?: Array<{
    text: string;
    submittedAt?: string;
    sessionStatus?: string;
  }>;
  grossPaid: number;
  platformCommission: number;
  coachNetAmount: number;
  disputeStatus?: string;
  financialHold?: boolean;
}

export interface RefundItem {
  id: string;
  _id?: string;
  bookingId?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  reason?: string;
  sourceType: 'SESSION' | string;
  status: 'pending' | 'approved' | 'rejected' | 'reconciled' | 'processed' | string;
  gatewayReference?: string;
  createdAt: string;
  reconciledAt?: string;
}

// ── Admin Banners ─────────────────────────────────────────────────────────────
export type BannerTargetType = 'coach' | 'player';

export interface Banner {
  id: string;
  _id?: string;
  type: BannerTargetType;
  imageUrl: string;
  link?: string;
  order: number;
  isActive: boolean;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Coaching Academies & Communities ──────────────────────────────────────────
export type CommunityStatus = 'active' | 'inactive' | 'draft' | 'archived';

export interface CommunityPlan {
  _id?: string;
  id?: string;
  duration: number;
  unit: 'week' | 'month';
  price: number;
  label: string;
  isActive: boolean;
}

export interface CommunityProgram {
  id?: string;
  _id?: string;
  communityId?: string;
  sport: string;
  title: string;
  startDate: string;
  endDate: string;
  sessionDays: string[];
  sessionStartTime: string;
  sessionEndTime: string;
  capacity: number;
  plans: CommunityPlan[];
  status?: 'active' | 'inactive' | string;
  coach?: any;
  coachId?: string;
  salary?: number;
  subscriberCount?: number;
  cancellation?: {
    cancelledAt?: string;
    reason?: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REVIEW_REQUIRED';
  };
}

export interface Community {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  attendanceRadius?: number; // metres (1 - 10000)
  timeZone?: string; // Asia/Kolkata
  attendanceEarlyMinutes?: number;
  attendanceGraceMinutes?: number;
  attendanceEndEarlyMinutes?: number;
  status: CommunityStatus;
  programs?: CommunityProgram[];
  subscriberCount?: number;
  activeProgramsCount?: number;
  admins?: Array<{
    adminId: string;
    permissions: string[];
    active: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoachSalaryHistory {
  id?: string;
  _id?: string;
  coachId: string;
  coachName?: string;
  programId?: string;
  salary: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status?: string;
  reason?: string;
}

export interface CommunityAttendanceRecord {
  id?: string;
  _id?: string;
  programId: string;
  programTitle?: string;
  coachId: string;
  coachName?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'started' | 'completed' | 'no_show' | 'flagged' | string;
  distanceMetres?: number;
  reviewAction?: 'ACKNOWLEDGED' | 'EXCUSED' | 'NEEDS_FOLLOW_UP';
  reviewReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface CommunityComplaint {
  id?: string;
  _id?: string;
  programId: string;
  programTitle?: string;
  communityId?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  issue?: string;
  text?: string;
  status: 'OPEN' | 'RESOLVED' | 'MANUAL_REVIEW';
  reason?: string;
  resolutionReason?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface CommunityLedgerEntry {
  id?: string;
  _id?: string;
  eventType: 'SUBSCRIPTION_PAYMENT' | 'REFUND_LIABILITY' | 'REFUND_PROCESSED' | 'SALARY_EXPENSE';
  amount: number;
  currency?: string;
  referenceId?: string;
  description?: string;
  createdAt: string;
}

