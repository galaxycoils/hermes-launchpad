import { useState } from 'react';
import { Surface } from '@/components/Surface';
import { Button } from '@/components/Button';
import Badge from '@/components/Badge';
import Avatar from '@/components/Avatar';

function isDevnet(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.includes('workers') || host.includes('dev') || host.includes('localhost') || host.includes('pages.dev');
}

type TabId = 'wallets' | 'security' | 'notifications' | 'apikeys' | 'referrals' | 'danger';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'wallets', label: 'Wallets', icon: '🔗' },
  { id: 'security', label: 'Security', icon: '🛡️' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'apikeys', label: 'API Keys', icon: '🔑' },
  { id: 'referrals', label: 'Referrals', icon: '🎁' },
  { id: 'danger', label: 'Danger Zone', icon: '⚠️' },
];

export default function Account() {
  const [activeTab, setActiveTab] = useState<TabId>('wallets');
  const devnet = isDevnet();

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Devnet preview banner */}
      {devnet && (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-center text-xs font-bold text-yellow-300 max-w-4xl mx-auto mb-4">
          Devnet preview — not mainnet. Use a Devnet wallet and faucet SOL.
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-pump text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'wallets' && <WalletsTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'apikeys' && <ApiKeysTab />}
          {activeTab === 'referrals' && <ReferralsTab />}
          {activeTab === 'danger' && <DangerZoneTab />}
        </div>
      </div>
    </div>
  );
}

function WalletsTab() {
  return (
    <Surface>
      <h2 className="text-lg font-semibold mb-4">Connected Wallets</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-3">
            <Avatar value="Phantom" size="md" connected />
            <div>
              <p className="font-medium">Phantom</p>
              <p className="text-sm text-white/50">Connected • Primary</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">Disconnect</Button>
        </div>
        <Button className="w-full" onClick={() => {}}>+ Connect Another Wallet</Button>
      </div>
    </Surface>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-4">
      <Surface>
        <h2 className="text-lg font-semibold mb-4">Two-Factor Authentication</h2>
        <p className="text-white/70 mb-4">Add an extra layer of security to your account.</p>
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div>
            <p className="font-medium">Authenticator App</p>
            <p className="text-sm text-white/50">Not enabled</p>
          </div>
          <Button variant="ghost" size="sm">Enable 2FA</Button>
        </div>
      </Surface>

      <Surface>
        <h2 className="text-lg font-semibold mb-4">Active Sessions</h2>
        <p className="text-white/70 mb-4">Manage devices signed into your account.</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💻</span>
              <div>
                <p className="font-medium">Current Session</p>
                <p className="text-sm text-white/50">Chrome on macOS • Active now</p>
              </div>
            </div>
            <Badge variant="onchain">Current</Badge>
          </div>
        </div>
        <Button variant="ghost" className="w-full mt-3" onClick={() => {}}>Revoke All Other Sessions</Button>
      </Surface>
    </div>
  );
}

function NotificationsTab() {
  return (
    <Surface>
      <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
      <div className="space-y-4">
        {[
          { label: 'Trade Confirmations', key: 'trade_confirmed', desc: 'Get notified when trades execute' },
          { label: 'Quest Complete', key: 'quest_complete', desc: 'Earn XP and rewards' },
          { label: 'Graduation Alerts', key: 'graduation', desc: 'Token migrated to Raydium' },
          { label: 'Referral Signups', key: 'referral_signup', desc: 'Someone used your code' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-white/50">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pump/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pump"></div>
            </label>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function ApiKeysTab() {
  return (
    <Surface>
      <h2 className="text-lg font-semibold mb-4">API Keys</h2>
      <p className="text-white/70 mb-4">Manage API keys for bot access. Keys are shown only once.</p>
      <Button className="mb-4" onClick={() => {}}>+ Create New Key</Button>
      <div className="space-y-2">
        <div className="p-3 rounded-lg bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-sm">read-only-key</p>
            <Badge variant="onchain">Active</Badge>
          </div>
          <p className="text-sm text-white/50">Created 2 days ago • read scope</p>
        </div>
      </div>
    </Surface>
  );
}

function ReferralsTab() {
  return (
    <Surface>
      <h2 className="text-lg font-semibold mb-4">Referral Analytics</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-white/5 text-center">
          <p className="text-2xl font-bold">HERMES7X</p>
          <p className="text-sm text-white/50">Your Referral Code</p>
        </div>
        <div className="p-4 rounded-lg bg-white/5 text-center">
          <p className="text-2xl font-bold">142</p>
          <p className="text-sm text-white/50">Total Clicks</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-white/5 text-center">
          <p className="text-xl font-bold">23</p>
          <p className="text-sm text-white/50">Signups</p>
        </div>
        <div className="p-4 rounded-lg bg-white/5 text-center">
          <p className="text-xl font-bold">1,725</p>
          <p className="text-sm text-white/50">XP Earned</p>
        </div>
        <div className="p-4 rounded-lg bg-white/5 text-center">
          <p className="text-xl font-bold">0.42</p>
          <p className="text-sm text-white/50">SOL Earned</p>
        </div>
      </div>
      <Button className="w-full" onClick={() => {}}>Copy Referral Link</Button>
    </Surface>
  );
}

function DangerZoneTab() {
  return (
    <Surface className="border-red-500/30">
      <h2 className="text-lg font-semibold mb-4 text-red-400">Danger Zone</h2>
      <p className="text-white/70 mb-6">Deleting your account is irreversible. This will:</p>
      <ul className="list-disc list-inside space-y-2 text-white/70 mb-6">
        <li>Revoke all active sessions and API keys</li>
        <li>Anonymize your social activity (comments, likes)</li>
        <li>Keep your trade history (for transparency)</li>
        <li>Prevent recovery of this account</li>
      </ul>
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          id="confirm-delete"
          className="w-4 h-4 text-pump border-white/30 rounded focus:ring-pump"
        />
        <label htmlFor="confirm-delete" className="text-white/90">
          I understand this action cannot be undone
        </label>
      </div>
      <Button
        variant="danger"
        className="w-full mt-4"
        disabled={true}
        onClick={() => {}}
      >
        Delete Account Permanently
      </Button>
    </Surface>
  );
}
