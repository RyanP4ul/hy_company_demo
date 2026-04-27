'use client';

import { useState } from 'react';
import { useLanguageStore, type Language } from '@/stores/language';
import { useTranslation } from '@/lib/i18n/use-translation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Palette,
  Bell,
  Shield,
  Sun,
  Moon,
  Monitor,
  Lock,
  Clock,
  KeyRound,
  Layout,
  Mail,
  Smartphone,
  Webhook,
  AlertTriangle,
  Package,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageTransition, FadeIn } from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const tabVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="rounded-lg bg-muted p-2 mt-0.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionDivider() {
  return <div className="border-t" />;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const [theme, setTheme] = useState('system');
  const [compactMode, setCompactMode] = useState(false);
  const [sidebarDefault, setSidebarDefault] = useState(true);

  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [deliveryUpdates, setDeliveryUpdates] = useState(true);

  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30min');

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your account and application preferences
            </p>
          </div>
        </FadeIn>

        {/* Settings Tabs */}
        <FadeIn delay={0.1}>
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
              <TabsTrigger value="general" className="gap-1.5 px-3 py-2 text-xs sm:text-sm">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-1.5 px-3 py-2 text-xs sm:text-sm">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5 px-3 py-2 text-xs sm:text-sm">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5 px-3 py-2 text-xs sm:text-sm">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {/* General Tab */}
              <motion.div
                key="general"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <TabsContent value="general">
                  <AnimatedCard title="Company Settings" description="Basic company information">
                    <div className="space-y-1">
                      <SettingRow icon={Layout} label="Company Name" description="The name displayed across the application">
                        <Input defaultValue="HyOps" className="w-64" />
                      </SettingRow>
                      <SectionDivider />
                      <SettingRow icon={Clock} label="Timezone" description="Set the default timezone for your account">
                        <Select defaultValue="utc-5" className="w-64">
                          <SelectTrigger className="w-64">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="utc-8">UTC-8 Pacific Time</SelectItem>
                            <SelectItem value="utc-7">UTC-7 Mountain Time</SelectItem>
                            <SelectItem value="utc-6">UTC-6 Central Time</SelectItem>
                            <SelectItem value="utc-5">UTC-5 Eastern Time</SelectItem>
                            <SelectItem value="utc-0">UTC+0 Greenwich Mean Time</SelectItem>
                            <SelectItem value="utc+1">UTC+1 Central European Time</SelectItem>
                            <SelectItem value="utc+8">UTC+8 China Standard Time</SelectItem>
                            <SelectItem value="utc+9">UTC+9 Japan Standard Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>
                      <SectionDivider />
                      <SettingRow icon={KeyRound} label="Currency" description="Default currency for pricing and reports">
                        <Select defaultValue="usd" className="w-64">
                          <SelectTrigger className="w-64">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="php">PHP (₱)</SelectItem>
                            <SelectItem value="eur">EUR (€)</SelectItem>
                            <SelectItem value="gbp">GBP (£)</SelectItem>
                            <SelectItem value="jpy">JPY (¥)</SelectItem>
                            <SelectItem value="cny">CNY (¥)</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>
                      <SectionDivider />
                      <SettingRow icon={Mail} label={t('settings.language')} description={t('settings.languageDescription')}>
                        <Select value={language} onValueChange={(v) => setLanguage(v as Language)} className="w-64">
                          <SelectTrigger className="w-64">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="tl">Filipino</SelectItem>
                            <SelectItem value="zh">Chinese (简体中文)</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingRow>
                    </div>
                  </AnimatedCard>
                </TabsContent>
              </motion.div>

              {/* Appearance Tab */}
              <motion.div
                key="appearance"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <TabsContent value="appearance">
                  <AnimatedCard title="Theme" description="Customize the look and feel of your dashboard">
                    <div className="space-y-1">
                      <SettingRow icon={Palette} label="Color Theme" description="Choose your preferred color scheme">
                        <div className="flex items-center gap-2">
                          {[
                            { value: 'light', icon: Sun, label: 'Light' },
                            { value: 'dark', icon: Moon, label: 'Dark' },
                            { value: 'system', icon: Monitor, label: 'System' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setTheme(option.value)}
                              className={cn(
                                'flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all min-w-[72px]',
                                theme === option.value
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : 'border-border hover:border-muted-foreground/30'
                              )}
                            >
                              <option.icon className={cn(
                                'h-4 w-4',
                                theme === option.value ? 'text-primary' : 'text-muted-foreground'
                              )} />
                              <span className={cn(
                                'text-xs font-medium',
                                theme === option.value ? 'text-primary' : 'text-muted-foreground'
                              )}>
                                {option.label}
                              </span>
                              {theme === option.value && (
                                <motion.div
                                  layoutId="theme-indicator"
                                  className="h-1 w-1 rounded-full bg-primary"
                                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </SettingRow>
                      <SectionDivider />
                      <SettingRow icon={Layout} label="Compact Mode" description="Reduce spacing and element sizes for a denser layout">
                        <Switch
                          checked={compactMode}
                          onCheckedChange={setCompactMode}
                        />
                      </SettingRow>
                      <SectionDivider />
                      <SettingRow icon={Settings} label="Sidebar Default State" description="Show sidebar expanded by default on desktop">
                        <Switch
                          checked={sidebarDefault}
                          onCheckedChange={setSidebarDefault}
                        />
                      </SettingRow>
                    </div>
                  </AnimatedCard>
                </TabsContent>
              </motion.div>

              {/* Notifications Tab */}
              <motion.div
                key="notifications"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <TabsContent value="notifications">
                  <div className="space-y-4">
                    <AnimatedCard title="Notification Channels" description="Choose how you receive notifications">
                      <div className="space-y-1">
                        <SettingRow icon={Mail} label="Email Notifications" description="Receive updates and alerts via email">
                          <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                        </SettingRow>
                        <SectionDivider />
                        <SettingRow icon={Smartphone} label="SMS Notifications" description="Receive critical alerts via SMS">
                          <Switch checked={smsNotif} onCheckedChange={setSmsNotif} />
                        </SettingRow>
                        <SectionDivider />
                        <SettingRow icon={Webhook} label="Push Notifications" description="Get real-time push notifications in your browser">
                          <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
                        </SettingRow>
                      </div>
                    </AnimatedCard>

                    <AnimatedCard title="Alert Preferences" description="Configure which events trigger notifications">
                      <div className="space-y-1">
                        <SettingRow icon={AlertTriangle} label="Low Stock Alerts" description="Notify when product stock falls below minimum threshold">
                          <Switch checked={lowStockAlerts} onCheckedChange={setLowStockAlerts} />
                        </SettingRow>
                        <SectionDivider />
                        <SettingRow icon={Package} label="Order Updates" description="Receive notifications for new orders and status changes">
                          <Switch checked={orderUpdates} onCheckedChange={setOrderUpdates} />
                        </SettingRow>
                        <SectionDivider />
                        <SettingRow icon={Truck} label="Delivery Updates" description="Track delivery progress and completion events">
                          <Switch checked={deliveryUpdates} onCheckedChange={setDeliveryUpdates} />
                        </SettingRow>
                      </div>
                    </AnimatedCard>
                  </div>
                </TabsContent>
              </motion.div>

              {/* Security Tab */}
              <motion.div
                key="security"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <TabsContent value="security">
                  <div className="space-y-4">
                    <AnimatedCard title="Authentication" description="Secure your account with additional verification">
                      <div className="space-y-1">
                        <SettingRow icon={Lock} label="Two-Factor Authentication" description="Add an extra layer of security to your account">
                          <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                        </SettingRow>
                        <SectionDivider />
                        <SettingRow icon={Clock} label="Session Timeout" description="Automatically log out after inactivity">
                          <Select value={sessionTimeout} onValueChange={setSessionTimeout} className="w-48">
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15min">15 minutes</SelectItem>
                              <SelectItem value="30min">30 minutes</SelectItem>
                              <SelectItem value="1hr">1 hour</SelectItem>
                              <SelectItem value="4hr">4 hours</SelectItem>
                              <SelectItem value="never">Never</SelectItem>
                            </SelectContent>
                          </Select>
                        </SettingRow>
                      </div>
                    </AnimatedCard>

                    <AnimatedCard title="Password Policy" description="Current security requirements for your organization">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <KeyRound className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="space-y-2 flex-1">
                            <p className="text-sm font-medium">Password Requirements</p>
                            <ul className="space-y-1.5">
                              {[
                                { label: 'Minimum 8 characters', met: true },
                                { label: 'At least one uppercase letter', met: true },
                                { label: 'At least one lowercase letter', met: true },
                                { label: 'At least one number', met: true },
                                { label: 'At least one special character (!@#$%^&*)', met: true },
                                { label: 'Cannot reuse last 5 passwords', met: true },
                              ].map((req) => (
                                <li key={req.label} className="flex items-center gap-2 text-xs">
                                  <div className={cn(
                                    'h-1.5 w-1.5 rounded-full',
                                    req.met ? 'bg-green-500' : 'bg-muted-foreground/30'
                                  )} />
                                  <span className={req.met ? 'text-foreground' : 'text-muted-foreground'}>
                                    {req.label}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Password Expiry</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Passwords must be changed every 90 days
                            </p>
                          </div>
                        </div>
                      </div>
                    </AnimatedCard>
                  </div>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
