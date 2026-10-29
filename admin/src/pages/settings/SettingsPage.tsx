import { useState } from 'react';
import { Settings, Shield, Bell, Save, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../../components/ui';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    platformName: 'Arenova Admin Portal',
    supportEmail: 'support@arenova.app',
    platformFeePercent: '15',
    currencySymbol: '₹',
    autoApproveKycs: false,
    emailNotifications: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 max-w-4xl min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 truncate">
            <Settings className="h-5 w-5 text-[#F05A22] flex-shrink-0" /> Portal Settings
          </h2>
          <p className="text-xs text-[#9ba3af] truncate">Configure general platform preferences and system thresholds</p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs text-emerald-400 flex-shrink-0">
            <CheckCircle className="h-4 w-4" /> Settings saved successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#F05A22]" /> General Platform Configurations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Platform Name"
                value={formData.platformName}
                onChange={e => setFormData({ ...formData, platformName: e.target.value })}
              />
              <Input
                label="Support Contact Email"
                type="email"
                value={formData.supportEmail}
                onChange={e => setFormData({ ...formData, supportEmail: e.target.value })}
              />
              <Input
                label="Platform Commission Fee (%)"
                type="number"
                value={formData.platformFeePercent}
                onChange={e => setFormData({ ...formData, platformFeePercent: e.target.value })}
              />
              <Input
                label="Default Currency Symbol"
                value={formData.currencySymbol}
                onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#F05A22]" /> Automation & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-[#2e3139] rounded-xl bg-[#0e0f11]">
              <div>
                <p className="text-xs font-semibold text-white">Email Alert Notifications</p>
                <p className="text-[11px] text-[#5c6370]">Receive email alerts for new coach KYC applications and payouts</p>
              </div>
              <input
                type="checkbox"
                checked={formData.emailNotifications}
                onChange={e => setFormData({ ...formData, emailNotifications: e.target.checked })}
                className="h-4 w-4 rounded border-[#2e3139] bg-[#141518] text-[#F05A22] focus:ring-0 cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" className="px-6">
            <Save className="h-4 w-4 mr-2" /> Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
