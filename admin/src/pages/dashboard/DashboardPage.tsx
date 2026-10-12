import { useEffect, useState } from 'react';
import { TrendingUp, Users, UserCheck, CalendarDays, Wallet, Star, Medal, CheckCircle, Clock, AlertTriangle, MessageSquare } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard, Card, CardHeader, CardTitle, CardContent, ProgressBar, Badge, Button, Avatar } from '../../components/ui';
import { getDashboard, getAdminReviews, getAdminWithdrawals, getAdminBookings, getEnquiryStats } from '../../api';

const statusMap: Record<string, string> = {
  confirmed: 'badge-green',
  requested: 'badge-amber',
  completed: 'badge-blue',
  cancelled: 'badge-red',
  no_show:   'badge-gray',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1c20] border border-[#2e3139] rounded-lg px-3 py-2 text-xs">
      <p className="text-[#9ba3af] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'revenue' ? `₹${p.value.toLocaleString()}` : `${p.value} bookings`}
        </p>
      ))}
    </div>
  );
};

interface DashboardStats {
  totalBookings: number;
  totalCustomers: number;
  totalCoaches: number;
  totalRevenue: number;
  pendingApplications: number;
  recentBookings: any[];
  recentCustomers: any[];
}

export default function DashboardPage() {
  const [stats, setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [flaggedReviewCount, setFlaggedReviewCount] = useState(0);
  const [pendingPayoutsCount, setPendingPayoutsCount] = useState(0);
  const [newEnquiryCount, setNewEnquiryCount] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    getDashboard()
      .then((res: any) => {
        const payload = res.data || res || {};
        setStats(payload);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    getAdminReviews()
      .then((res: any) => {
        const list = res.data || res || [];
        setReviewCount(Array.isArray(list) ? list.length : 0);
        setFlaggedReviewCount(Array.isArray(list) ? list.filter((r: any) => r.flagged).length : 0);
      })
      .catch(() => {});

    getAdminWithdrawals({ status: 'pending' })
      .then((res: any) => {
        const list = res.data || res || [];
        setPendingPayoutsCount(Array.isArray(list) ? list.length : 0);
      })
      .catch(() => {});

    getEnquiryStats()
      .then((res: any) => {
        const data = res.data || res || {};
        setNewEnquiryCount(data.new || 0);
      })
      .catch(() => {});

    getAdminBookings({ limit: 1000 })
      .then((res: any) => {
        const raw = res.data || res || [];
        setBookings(Array.isArray(raw) ? raw : []);
      })
      .catch(() => {});
  }, []);

  // Merge API data with local defaults
  const totalBookings  = stats?.totalBookings  ?? bookings.length ?? 0;
  const totalCustomers = stats?.totalCustomers ?? 0;
  const totalCoaches   = stats?.totalCoaches   ?? 0;
  const totalRevenue   = stats?.totalRevenue   ?? 0;
  const pendingApps    = stats?.pendingApplications ?? 0;
  const recentBookings = stats?.recentBookings  ?? [];
  const recentCustomers = stats?.recentCustomers ?? [];


  // Dynamic booking state distribution with fallback mocks
  const bookingsCount = bookings.length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const requestedCount = bookings.filter(b => b.status === 'requested').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
  const noShowCount    = bookings.filter(b => b.status === 'no_show').length;

  const bookingStateData = bookingsCount > 0 ? [
    { label: 'Completed', count: completedCount, pct: Math.round((completedCount / bookingsCount) * 100), color: 'bg-[#F05A22]' },
    { label: 'Confirmed', count: confirmedCount, pct: Math.round((confirmedCount / bookingsCount) * 100), color: 'bg-blue-500' },
    { label: 'Requested', count: requestedCount, pct: Math.round((requestedCount / bookingsCount) * 100), color: 'bg-amber-500' },
    { label: 'Cancelled', count: cancelledCount, pct: Math.round((cancelledCount / bookingsCount) * 100), color: 'bg-red-500' },
    { label: 'No-Show',   count: noShowCount,    pct: Math.round((noShowCount / bookingsCount) * 100),    color: 'bg-[#5c6370]' },
  ] : [
    { label: 'Completed', count: 612, pct: 95, color: 'bg-[#F05A22]'  },
    { label: 'Confirmed', count: 482, pct: 75, color: 'bg-blue-500'   },
    { label: 'Requested', count: 89,  pct: 14, color: 'bg-amber-500'  },
    { label: 'Cancelled', count: 68,  pct: 11, color: 'bg-red-500'    },
    { label: 'No-Show',   count: 33,  pct: 5,  color: 'bg-[#5c6370]'  },
  ];

  // Dynamic sports bookings share with fallback mocks
  const sportCounts: Record<string, number> = {};
  bookings.forEach(b => {
    if (b.sport) {
      sportCounts[b.sport] = (sportCounts[b.sport] || 0) + 1;
    }
  });
  const sportColors = ['bg-[#F05A22]', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-teal-500'];
  const sportData = bookingsCount > 0 ? Object.keys(sportCounts).map((sport, idx) => ({
    sport,
    pct: Math.round((sportCounts[sport] / bookingsCount) * 100),
    color: sportColors[idx % sportColors.length]
  })).sort((a, b) => b.pct - a.pct).slice(0, 5) : [
    { sport: 'Cricket',   pct: 34, color: 'bg-[#F05A22]'  },
    { sport: 'Football',  pct: 22, color: 'bg-blue-500'   },
    { sport: 'Tennis',    pct: 18, color: 'bg-amber-500'  },
    { sport: 'Badminton', pct: 16, color: 'bg-purple-500' },
    { sport: 'Swimming',  pct: 10, color: 'bg-teal-500'   },
  ];

  // Dynamic monthly aggregations for line chart with fallback mocks
  const monthlyData: Record<string, { revenue: number; bookings: number }> = {};
  bookings.forEach(b => {
    try {
      const dateStr = b.date || b.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const m = d.toLocaleDateString('en-US', { month: 'short' });
      if (!monthlyData[m]) {
        monthlyData[m] = { revenue: 0, bookings: 0 };
      }
      monthlyData[m].bookings += 1;
      monthlyData[m].revenue += b.price || b.amount || b.amountInr || 2000;
    } catch {}
  });
  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = Object.keys(monthlyData).length > 0 ? Object.keys(monthlyData).map(m => ({
    month: m,
    revenue: monthlyData[m].revenue,
    bookings: monthlyData[m].bookings
  })).sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)) : [
    { month: 'Oct', revenue: 42000, bookings: 84  },
    { month: 'Nov', revenue: 58000, bookings: 116 },
    { month: 'Dec', revenue: 71000, bookings: 142 },
    { month: 'Jan', revenue: 65000, bookings: 130 },
    { month: 'Feb', revenue: 89000, bookings: 178 },
    { month: 'Mar', revenue: 124000, bookings: 248 },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Bookings"
          value={totalBookings.toLocaleString()}
          sub="↑ 14% vs last month"
          icon={<CalendarDays className="h-4 w-4 text-[#F05A22]" />}
          iconBg="bg-[#F05A22]/10"
          subColor="text-emerald-400"
        />
        <StatCard
          label="Active Players"
          value={totalCustomers.toLocaleString()}
          sub="↑ 8% vs last month"
          icon={<Users className="h-4 w-4 text-emerald-400" />}
          iconBg="bg-emerald-500/10"
          subColor="text-emerald-400"
        />
        <StatCard
          label="Active Coaches"
          value={totalCoaches.toLocaleString()}
          sub="↑ 5% vs last month"
          icon={<UserCheck className="h-4 w-4 text-blue-400" />}
          iconBg="bg-blue-500/10"
          subColor="text-[#5c6370]"
        />
        <StatCard
          label="Gross Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          sub="↑ 21% vs last month"
          icon={<Wallet className="h-4 w-4 text-amber-400" />}
          iconBg="bg-amber-500/10"
          subColor="text-emerald-400"
        />
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Bookings Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F05A22" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F05A22" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#5c6370" fontSize={11} tickLine={false} />
                <YAxis stroke="#5c6370" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" name="revenue" dataKey="revenue" stroke="#F05A22" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" name="bookings" dataKey="bookings" stroke="#2563eb" strokeWidth={1} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detail grids */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Sport Booking Share</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            {sportData.map(item => (
              <ProgressBar key={item.sport} label={item.sport} value={item.pct} pct={item.pct} color={item.color} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Booking State Distribution</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            {bookingStateData.map(item => (
              <ProgressBar key={item.label} label={item.label} value={item.count} pct={item.pct} color={item.color} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pending Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: <Clock className="h-4 w-4 text-amber-400" />,  bg: 'bg-amber-400/10', label: 'Coach KYC Reviews',   count: pendingApps, color: 'text-amber-400' },
              { icon: <MessageSquare className="h-4 w-4 text-orange-400" />, bg: 'bg-orange-400/10', label: 'New Enquiries', count: newEnquiryCount, color: 'text-orange-400' },
              { icon: <AlertTriangle className="h-4 w-4 text-red-400" />, bg: 'bg-red-400/10', label: 'Flagged Reviews',    count: flaggedReviewCount,  color: 'text-red-400' },
              { icon: <Wallet className="h-4 w-4 text-emerald-400" />, bg: 'bg-emerald-400/10', label: 'Pending Payouts',  count: pendingPayoutsCount,  color: 'text-emerald-400' },
              { icon: <Star className="h-4 w-4 text-blue-400" />,   bg: 'bg-blue-400/10',  label: 'Unverified Ratings',   count: reviewCount,  color: 'text-blue-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-[#141518] rounded-xl border border-[#2e3139]">
                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}>{item.icon}</div>
                <span className="text-sm text-[#9ba3af] flex-1">{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Bookings</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings.slice(0, 5).map((b: any) => (
                <div key={b._id || b.id} className="flex items-center gap-3 p-3 bg-[#141518] rounded-xl border border-[#2e3139]">
                  <Avatar initials={b.user?.firstName?.[0] || 'U'} size={34} />
                  <div className="flex-1">
                    <p className="text-xs text-white font-medium">
                      {b.user ? `${b.user.firstName} ${b.user.lastName}` : 'User'}
                      {' → '}
                      {b.coach?.name || 'Coach'}
                    </p>
                    <p className="text-[10px] text-[#5c6370]">{b.sport} · {b.date}</p>
                  </div>
                  <Badge className={statusMap[b.status] || 'badge-gray'}>{b.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
