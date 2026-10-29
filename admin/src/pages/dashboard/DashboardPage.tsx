import { useEffect, useState } from 'react';
import { TrendingUp, Users, UserCheck, CalendarDays, Wallet, Star, Medal, CheckCircle, Clock, AlertTriangle, MessageSquare } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard, Card, CardHeader, CardTitle, CardContent, ProgressBar, Badge, Button, Avatar } from '../../components/ui';
import { getDashboard, getAdminReviews, getAdminWithdrawals, getAdminBookings, getEnquiryStats, extractDataList } from '../../api';

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
        const list = extractDataList(res);
        setReviewCount(list.length);
        setFlaggedReviewCount(list.filter((r: any) => r.flagged).length);
      })
      .catch(() => {});

    getAdminWithdrawals({ status: 'pending' })
      .then((res: any) => {
        const list = extractDataList(res);
        setPendingPayoutsCount(list.length);
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
        const raw = extractDataList(res);
        const seen = new Set<string>();
        const unique: any[] = [];
        for (const b of raw) {
          const id = b?._id || b?.id;
          if (id && !seen.has(String(id))) {
            seen.add(String(id));
            unique.push(b);
          } else if (!id) {
            unique.push(b);
          }
        }
        setBookings(unique);
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

  // Dynamic booking state distribution strictly based on real data
  const bookingsCount = bookings.length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const requestedCount = bookings.filter(b => b.status === 'requested').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
  const noShowCount    = bookings.filter(b => b.status === 'no_show').length;

  const bookingStateData = [
    { label: 'Completed', count: completedCount, pct: bookingsCount ? Math.round((completedCount / bookingsCount) * 100) : 0, color: 'bg-[#F05A22]' },
    { label: 'Confirmed', count: confirmedCount, pct: bookingsCount ? Math.round((confirmedCount / bookingsCount) * 100) : 0, color: 'bg-blue-500' },
    { label: 'Requested', count: requestedCount, pct: bookingsCount ? Math.round((requestedCount / bookingsCount) * 100) : 0, color: 'bg-amber-500' },
    { label: 'Cancelled', count: cancelledCount, pct: bookingsCount ? Math.round((cancelledCount / bookingsCount) * 100) : 0, color: 'bg-red-500' },
    { label: 'No-Show',   count: noShowCount,    pct: bookingsCount ? Math.round((noShowCount / bookingsCount) * 100) : 0,    color: 'bg-[#5c6370]' },
  ];

  // Dynamic sports bookings share strictly based on real data
  const sportCounts: Record<string, number> = {};
  bookings.forEach(b => {
    if (b.sport) {
      const s = typeof b.sport === 'object' ? b.sport.name : b.sport;
      if (s) {
        sportCounts[s] = (sportCounts[s] || 0) + 1;
      }
    }
  });
  const sportColors = ['bg-[#F05A22]', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-teal-500'];
  const sportData = Object.keys(sportCounts).map((sport, idx) => ({
    sport,
    pct: bookingsCount ? Math.round((sportCounts[sport] / bookingsCount) * 100) : 0,
    color: sportColors[idx % sportColors.length]
  })).sort((a, b) => b.pct - a.pct).slice(0, 5);

  // Dynamic monthly aggregations for line chart strictly based on real data
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
      monthlyData[m].revenue += b.price || b.amount || b.amountInr || 0;
    } catch {}
  });

  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const defaultMonths = () => {
    const list = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        revenue: 0,
        bookings: 0
      });
    }
    return list;
  };

  const revenueData = Object.keys(monthlyData).length > 0 ? Object.keys(monthlyData).map(m => ({
    month: m,
    revenue: monthlyData[m].revenue,
    bookings: monthlyData[m].bookings
  })).sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)) : defaultMonths();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#F05A22] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 min-w-0 max-w-full">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3 min-w-0">
        <Card>
          <CardHeader><CardTitle>Sport Booking Share</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            {sportData.length === 0 ? (
              <p className="text-xs text-[#5c6370] py-4 text-center">No sport bookings recorded yet</p>
            ) : (
              sportData.map(item => (
                <ProgressBar key={item.sport} label={item.sport} value={item.pct} pct={item.pct} color={item.color} />
              ))
            )}
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
              <div key={item.label} className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-[#141518] rounded-xl border border-[#2e3139] min-w-0">
                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>{item.icon}</div>
                <span className="text-sm text-[#9ba3af] flex-1 truncate">{item.label}</span>
                <span className={`text-sm font-bold ${item.color} flex-shrink-0`}>{item.count}</span>
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
                <div key={b._id || b.id} className="flex items-center gap-3 p-3 bg-[#141518] rounded-xl border border-[#2e3139] min-w-0">
                  <Avatar initials={b.user?.firstName?.[0] || 'U'} size={34} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium truncate">
                      {b.user ? `${b.user.firstName} ${b.user.lastName}` : 'User'}
                      {' → '}
                      {b.coach?.name || 'Coach'}
                    </p>
                    <p className="text-[10px] text-[#5c6370] truncate">{b.sport} · {b.date}</p>
                  </div>
                  <Badge className={`${statusMap[b.status] || 'badge-gray'} flex-shrink-0`}>{b.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
