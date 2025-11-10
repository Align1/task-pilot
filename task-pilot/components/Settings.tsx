import React from 'react';
import { Achievement, Goal, NotificationSettings, User } from '../types';
import { Button, Card, Input, Label, Switch } from './ui';
import { Icon } from './icons';

interface SettingsProps {
  user: User | null;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  achievements: Achievement[];
  unlockedAchievements: string[];
  goals: Goal[];
  timezone: string;
  notificationSettings: NotificationSettings;
  onNotificationSettingsChange: (settings: NotificationSettings) => void;
  onUpdateUser: (user: User) => void;
}

type SettingsTab = 'Profile' | 'Appearance' | 'Notifications' | 'Goals' | 'Data';

export const Settings: React.FC<SettingsProps> = (props) => {
  const { user, theme, setTheme, achievements, unlockedAchievements, timezone, notificationSettings, onNotificationSettingsChange, onUpdateUser } = props;
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('Profile');
  
  const [displayName, setDisplayName] = React.useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = React.useState(user?.photoURL || '');
  const [avatarError, setAvatarError] = React.useState<string | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');

  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setPhotoURL(user.photoURL);
    }
  }, [user]);

  const validateImageUrl = (url: string) => {
    if (!url) return false;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }
    if (url.includes('picsum.photos')) {
      return true;
    }
    return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
  };

  const handleSaveProfile = () => {
    if (!user) return;

    if (!validateImageUrl(photoURL)) {
      setAvatarError('Please enter a valid image URL.');
      return;
    }
    
    setAvatarError(null);
    setSaveStatus('saving');

    const updatedUser: User = {
      ...user,
      displayName,
      photoURL,
    };
    onUpdateUser(updatedUser);

    setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };
  
  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'Profile', label: 'Profile', icon: 'User' },
    { id: 'Appearance', label: 'Appearance', icon: 'Eye' },
    { id: 'Notifications', label: 'Notifications', icon: 'Bell' },
    { id: 'Goals', label: 'Goals', icon: 'Target' },
    { id: 'Data', label: 'Data', icon: 'Database' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Profile':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Profile</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={user?.email || ''} disabled />
                  </div>
                  <div>
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input id="avatarUrl" value={photoURL} onChange={e => { setPhotoURL(e.target.value); if (avatarError) setAvatarError(null); }} />
                    {avatarError && <p className="text-sm text-red-500 mt-1">{avatarError}</p>}
                  </div>
                  <Button className="w-full" onClick={handleSaveProfile} disabled={saveStatus !== 'idle'}>
                    {saveStatus === 'idle' && 'Save Profile'}
                    {saveStatus === 'saving' && 'Saving...'}
                    {saveStatus === 'saved' && 'Saved!'}
                  </Button>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Achievements</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {achievements.map(ach => {
                    const isUnlocked = unlockedAchievements.includes(ach.id);
                    return (
                      <div key={ach.id} className="relative group">
                        <div className={`p-4 border rounded-xl flex flex-col items-center justify-center text-center transition-all duration-300 h-full ${isUnlocked ? 'border-yellow-500/50 bg-yellow-500/10 shadow-lg shadow-yellow-500/10' : 'border-slate-200 dark:border-slate-700/50'}`}>
                          <div className={`p-3 rounded-full ${isUnlocked ? 'bg-yellow-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            <Icon name={ach.icon} className={`w-6 h-6 ${isUnlocked ? 'text-yellow-400' : 'text-slate-400'}`} />
                          </div>
                          <p className={`mt-2 text-sm font-semibold ${isUnlocked ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>{ach.name}</p>
                        </div>
                        <div className="absolute bottom-full mb-2 w-48 px-3 py-2 text-xs font-medium text-center text-white bg-slate-800 dark:bg-slate-950 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none left-1/2 -translate-x-1/2 z-10">
                          {ach.description}
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800 dark:border-t-slate-950"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        );
      case 'Appearance':
        return (
          <Card className="p-6 max-w-2xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Appearance</h3>
            <div className="space-y-4 divide-y divide-slate-200 dark:divide-slate-700/50">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 first:pt-0">
                <div>
                  <Label className="font-semibold">Dark Mode</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Toggle between light and dark themes.</p>
                </div>
                <Switch checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
              </div>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
                <div>
                  <Label className="font-semibold">Timezone</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Detected automatically from your browser.</p>
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-lg">{timezone}</span>
              </div>
            </div>
          </Card>
        );
      case 'Notifications':
        return (
          <Card className="p-6 max-w-2xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Email Notifications</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Manage which emails you receive.</p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly-report" className="flex flex-col cursor-pointer">
                  <span className="font-medium text-sm">Weekly Progress Report</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">A summary of your weekly activity.</span>
                </Label>
                <Switch
                  checked={notificationSettings.weeklyReport}
                  onCheckedChange={(checked) => onNotificationSettingsChange({ ...notificationSettings, weeklyReport: checked })}
                  id="weekly-report"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="goal-reminders" className="flex flex-col cursor-pointer">
                  <span className="font-medium text-sm">Goal Reminders</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Notifications when you're close to a goal.</span>
                </Label>
                <Switch
                  checked={notificationSettings.goalReminders}
                  onCheckedChange={(checked) => onNotificationSettingsChange({ ...notificationSettings, goalReminders: checked })}
                  id="goal-reminders"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="achievement-unlocked" className="flex flex-col cursor-pointer">
                  <span className="font-medium text-sm">New Achievement Unlocked</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">An email when you unlock a new achievement.</span>
                </Label>
                <Switch
                  checked={notificationSettings.achievementUnlocked}
                  onCheckedChange={(checked) => onNotificationSettingsChange({ ...notificationSettings, achievementUnlocked: checked })}
                  id="achievement-unlocked"
                />
              </div>
            </div>
          </Card>
        );
       case 'Goals':
        return (
            <Card className="p-6 max-w-2xl text-center">
                 <Icon name="Target" className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Goal Management</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">Set and manage your weekly and monthly goals to stay on track.</p>
                <Button disabled>Add New Goal</Button>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">This feature is coming soon!</p>
            </Card>
        );
       case 'Data':
        return (
            <div className="space-y-6 max-w-2xl">
                <Card className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Data Management</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Export your task data for your own records or for invoicing.</p>
                    <Button disabled>Export as CSV</Button>
                </Card>
                <Card className="p-6 border-red-500/50">
                    <h3 className="text-xl font-semibold mb-2 text-red-500">Danger Zone</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">These actions are permanent and cannot be undone. Proceed with caution.</p>
                    <Button variant="destructive" disabled>Delete All Tasks</Button>
                </Card>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your account and preferences.</p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-3 font-semibold text-sm transition-colors ${
                activeTab === tab.id
                ? 'border-b-2 border-indigo-500 text-indigo-500 dark:text-indigo-400'
                : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon name={tab.icon} className="w-5 h-5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      
      <div>{renderTabContent()}</div>
    </div>
  );
};