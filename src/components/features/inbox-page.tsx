'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  inboxConversations as initialConversations,
  customers,
  type InboxConversation,
  type InboxMessage,
  type WebhookSource,
} from '@/lib/mock-data';
import { PageTransition, FadeIn } from '@/components/shared/animated-components';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  MessageSquare,
  Phone,
  Building2,
  ShoppingCart,
  Clock,
  Send,
  ArrowLeft,
  UserPlus,
  Star,
  Zap,
  Webhook,
  MailOpen,
} from 'lucide-react';

// ========================
// Helpers
// ========================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getRelativeTime(timeStr: string): string {
  const date = new Date(timeStr.replace(' ', 'T'));
  const now = new Date('2024-01-15T15:00:00');
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return timeStr.split(' ')[0];
}

const SOURCE_CONFIG: Record<WebhookSource, { label: string; color: string; bg: string; badge: string; icon: React.ReactNode }> = {
  viber: {
    label: 'Viber',
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/50',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    icon: <MessageSquare className="size-3.5" />,
  },
  wechat: {
    label: 'WeChat',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: <MessageSquare className="size-3.5" />,
  },
};

const CUSTOMER_TYPE_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  regular: {
    label: 'Regular',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: <Star className="size-3" />,
  },
  new: {
    label: 'New',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    icon: <UserPlus className="size-3" />,
  },
};

// ========================
// Component
// ========================

export default function InboxPage() {
  const [conversations, setConversations] = useState<InboxConversation[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | WebhookSource>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'regular' | 'new'>('all');
  const [replyText, setReplyText] = useState('');
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  // Derived
  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const selectedCustomer = useMemo(() => {
    if (!selected?.customerId) return null;
    return customers.find((c) => c.id === selected.customerId) ?? null;
  }, [selected]);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      const matchSearch =
        !search ||
        c.customerName.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(search.toLowerCase());
      const matchSource = sourceFilter === 'all' || c.source === sourceFilter;
      const matchType = typeFilter === 'all' || c.customerType === typeFilter;
      return matchSearch && matchSource && matchType;
    });
  }, [conversations, search, sourceFilter, typeFilter]);

  // Stats
  const totalConversations = conversations.length;
  const unreadCount = conversations.reduce((s, c) => s + c.unread, 0);
  const viberCount = conversations.filter((c) => c.source === 'viber').length;
  const wechatCount = conversations.filter((c) => c.source === 'wechat').length;
  const regularCount = conversations.filter((c) => c.customerType === 'regular').length;
  const newCount = conversations.filter((c) => c.customerType === 'new').length;

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (selected) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [selected?.id, selected?.messages.length]);

  // Handlers
  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      setShowMobileDetail(true);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
      );
    },
    []
  );

  const handleBack = useCallback(() => {
    setShowMobileDetail(false);
  }, []);

  const handleSendReply = useCallback(() => {
    if (!replyText.trim() || !selectedId) return;
    const newMsg: InboxMessage = {
      id: `MSG-REPLY-${Date.now()}`,
      from: 'agent',
      senderName: 'You',
      content: replyText.trim(),
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== selectedId) return c;
        return {
          ...c,
          messages: [...c.messages, newMsg],
          lastMessage: newMsg.content,
          lastMessageTime: newMsg.timestamp,
        };
      })
    );
    setReplyText('');
    replyInputRef.current?.focus();
    toast.success('Reply sent');
  }, [replyText, selectedId]);

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
              <p className="text-muted-foreground">
                Centralized webhook inbox for Viber & WeChat messages.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Webhook className="size-4" />
              <span>Webhook-powered</span>
            </div>
          </div>
        </FadeIn>

        {/* Summary Stats */}
        <FadeIn delay={0.05}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Total', value: totalConversations, className: 'bg-primary/10 text-primary' },
              { label: 'Unread', value: unreadCount, className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
              { label: 'Viber', value: viberCount, className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
              { label: 'WeChat', value: wechatCount, className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
              { label: 'Regular', value: regularCount, className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
              { label: 'New', value: newCount, className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between rounded-lg border bg-card p-3"
              >
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums">{stat.value}</p>
                </div>
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', stat.className)}>
                  {stat.label === 'Unread' && <MailOpen className="size-4" />}
                  {stat.label === 'Viber' && <MessageSquare className="size-4" />}
                  {stat.label === 'WeChat' && <MessageSquare className="size-4" />}
                  {stat.label === 'Regular' && <Star className="size-4" />}
                  {stat.label === 'New' && <UserPlus className="size-4" />}
                  {stat.label === 'Total' && <MessageSquare className="size-4" />}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Main Split Layout */}
        <FadeIn delay={0.1}>
          <div className="flex overflow-hidden rounded-lg border bg-card" style={{ height: 'calc(100vh - 340px)', minHeight: '480px' }}>
            {/* Left Panel — Conversation List */}
            <div
              className={cn(
                'flex w-full min-h-0 flex-col border-r md:w-[380px] md:flex-shrink-0',
                showMobileDetail ? 'hidden md:flex' : 'flex'
              )}
            >
              {/* Search & Filters */}
              <div className="space-y-3 border-b p-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-8 text-sm"
                  />
                </div>
                {/* Source filter */}
                <div className="flex gap-1.5">
                  {(['all', 'viber', 'wechat'] as const).map((s) => (
                    <Button
                      key={s}
                      variant={sourceFilter === s ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 flex-1 gap-1 text-xs capitalize"
                      onClick={() => setSourceFilter(s)}
                    >
                      {s !== 'all' && SOURCE_CONFIG[s].icon}
                      {s === 'all' ? 'All' : SOURCE_CONFIG[s].label}
                    </Button>
                  ))}
                </div>
                {/* Customer type filter */}
                <div className="flex gap-1.5">
                  {(['all', 'regular', 'new'] as const).map((t) => (
                    <Button
                      key={t}
                      variant={typeFilter === t ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 flex-1 gap-1 text-xs capitalize"
                      onClick={() => setTypeFilter(t)}
                    >
                      {t !== 'all' && CUSTOMER_TYPE_CONFIG[t].icon}
                      {t === 'all' ? 'All Types' : CUSTOMER_TYPE_CONFIG[t].label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Conversation list */}
              <ScrollArea className="min-h-0 flex-1">
                <div className="p-1.5">
                  {filtered.length > 0 ? (
                    filtered.map((conv, idx) => {
                      const src = SOURCE_CONFIG[conv.source];
                      const ct = CUSTOMER_TYPE_CONFIG[conv.customerType];
                      const isActive = selectedId === conv.id;
                      return (
                        <motion.button
                          key={conv.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, delay: idx * 0.02 }}
                          onClick={() => handleSelect(conv.id)}
                          className={cn(
                            'mb-0.5 flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors',
                            isActive
                              ? 'bg-primary/10'
                              : 'hover:bg-muted/80'
                          )}
                        >
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            <Avatar className="size-10">
                              <AvatarFallback
                                className={cn(
                                  'text-xs font-semibold',
                                  conv.customerType === 'regular'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                                )}
                              >
                                {getInitials(conv.customerName)}
                              </AvatarFallback>
                            </Avatar>
                            {/* Unread dot */}
                            {conv.unread > 0 && (
                              <div className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                                {conv.unread > 9 ? '9+' : conv.unread}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={cn('truncate text-sm font-medium', conv.unread > 0 && 'font-bold')}>
                                {conv.customerName}
                              </span>
                              <Badge variant="secondary" className={cn('gap-0.5 px-1.5 py-0 text-[10px] font-medium', ct.className)}>
                                {ct.icon}
                                {ct.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className={cn('gap-0.5 px-1.5 py-0 text-[10px]', src.badge)}>
                                {src.icon}
                                {src.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {getRelativeTime(conv.lastMessageTime)}
                              </span>
                            </div>
                            <p className={cn('mt-1 truncate text-xs text-muted-foreground', conv.unread > 0 && 'text-foreground/80 font-medium')}>
                              {conv.lastMessage}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <MessageSquare className="mb-2 size-8 opacity-40" />
                      <p className="text-sm">No conversations found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel — Conversation Detail */}
            <div
              className={cn(
                'flex min-h-0 flex-1 flex-col',
                !showMobileDetail ? 'hidden md:flex' : 'flex'
              )}
            >
              {selected ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 border-b px-4 py-3">
                    {/* Mobile back button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 md:hidden"
                      onClick={handleBack}
                    >
                      <ArrowLeft className="size-4" />
                    </Button>

                    <Avatar className="size-9">
                      <AvatarFallback
                        className={cn(
                          'text-xs font-semibold',
                          selected.customerType === 'regular'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                        )}
                      >
                        {getInitials(selected.customerName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-sm">{selected.customerName}</span>
                        <Badge variant="secondary" className={cn('gap-0.5 px-1.5 py-0 text-[10px] font-medium', CUSTOMER_TYPE_CONFIG[selected.customerType].className)}>
                          {CUSTOMER_TYPE_CONFIG[selected.customerType].icon}
                          {CUSTOMER_TYPE_CONFIG[selected.customerType].label}
                        </Badge>
                        <Badge variant="outline" className={cn('gap-0.5 px-1.5 py-0 text-[10px]', SOURCE_CONFIG[selected.source].badge)}>
                          {SOURCE_CONFIG[selected.source].icon}
                          {SOURCE_CONFIG[selected.source].label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selected.phone && `${selected.phone}`}
                        {selected.customerId && ` · ${selected.customerId}`}
                      </p>
                    </div>

                    {/* Customer info tooltip */}
                    {selectedCustomer && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg cursor-default', SOURCE_CONFIG[selected.source].bg)}>
                            <Zap className={cn('size-4', SOURCE_CONFIG[selected.source].color)} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[240px]">
                          <div className="space-y-1.5 text-xs">
                            <p className="font-semibold">{selectedCustomer.name}</p>
                            <p className="text-muted-foreground">{selectedCustomer.company || 'Individual'}</p>
                            <p className="text-muted-foreground">{selectedCustomer.address}</p>
                            <Separator className="my-1" />
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Orders</span>
                              <span className="font-semibold">{selectedCustomer.totalOrders}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Spent</span>
                              <span className="font-semibold">{formatCurrency(selectedCustomer.totalSpent)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Since</span>
                              <span className="font-semibold">{selectedCustomer.joinDate}</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Messages Area */}
                  <ScrollArea className="min-h-0 flex-1 px-4 py-4">
                    <div className="mx-auto max-w-2xl space-y-3">
                      {/* Channel info banner */}
                      <div className="flex justify-center">
                        <div className={cn('flex items-center gap-2 rounded-full px-3 py-1 text-[11px] text-muted-foreground', SOURCE_CONFIG[selected.source].bg)}>
                          <Webhook className="size-3" />
                          <span>
                            Webhook from {SOURCE_CONFIG[selected.source].label}
                            {selected.messages[0]?.webhookId && ` · ${selected.messages[0].webhookId}`}
                          </span>
                        </div>
                      </div>

                      {/* Messages */}
                      {selected.messages.map((msg, idx) => {
                        const isCustomer = msg.from === 'customer';
                        const showAvatar = idx === 0 || selected.messages[idx - 1]?.from !== msg.from;
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15 }}
                            className={cn('flex gap-2', isCustomer ? 'justify-start' : 'justify-end')}
                          >
                            {/* Customer avatar */}
                            {isCustomer && (
                              <div className="w-7 shrink-0 pt-1">
                                {showAvatar && (
                                  <Avatar className="size-7">
                                    <AvatarFallback className="text-[10px] font-medium bg-muted">
                                      {getInitials(selected.customerName)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            )}

                            <div className={cn('max-w-[75%] space-y-0.5', isCustomer ? '' : 'items-end flex flex-col')}>
                              {/* Sender name */}
                              {showAvatar && (
                                <p className={cn('text-[10px] font-medium px-1', isCustomer ? 'text-muted-foreground' : 'text-right text-muted-foreground')}>
                                  {msg.senderName}
                                </p>
                              )}
                              {/* Bubble */}
                              <div
                                className={cn(
                                  'rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                                  isCustomer
                                    ? 'rounded-tl-md bg-muted'
                                    : 'rounded-tr-md bg-primary text-primary-foreground'
                                )}
                              >
                                {msg.content}
                              </div>
                              {/* Timestamp + webhook indicator */}
                              <div className={cn('flex items-center gap-1 px-1', isCustomer ? '' : 'justify-end')}>
                                {msg.webhookId && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Webhook className="size-2.5 text-muted-foreground/50" />
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                      <p className="text-xs font-mono">{msg.webhookId}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  {msg.timestamp}
                                </span>
                              </div>
                            </div>

                            {/* Agent avatar */}
                            {!isCustomer && (
                              <div className="w-7 shrink-0 pt-1">
                                {showAvatar && (
                                  <Avatar className="size-7">
                                    <AvatarFallback className="text-[10px] font-medium bg-primary text-primary-foreground">
                                      <Send className="size-3" />
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Reply Input */}
                  <div className="border-t px-4 py-3">
                    {selectedCustomer && (
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className={cn('gap-1 text-[10px]', CUSTOMER_TYPE_CONFIG.regular.className)}>
                          <Star className="size-3" />
                          Regular Customer
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          <ShoppingCart className="mr-1 size-3" />
                          {selectedCustomer.totalOrders} orders
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          <Building2 className="mr-1 size-3" />
                          {selectedCustomer.company || 'Individual'}
                        </Badge>
                      </div>
                    )}
                    {!selectedCustomer && selected.customerType === 'new' && (
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className={cn('gap-1 text-[10px]', CUSTOMER_TYPE_CONFIG.new.className)}>
                          <UserPlus className="size-3" />
                          New Customer
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          <Phone className="mr-1 size-3" />
                          {selected.phone || 'No phone'}
                        </Badge>
                      </div>
                    )}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendReply();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        ref={replyInputRef}
                        placeholder={`Reply via ${SOURCE_CONFIG[selected.source].label}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" size="icon" disabled={!replyText.trim()}>
                        <Send className="size-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                /* Empty state */
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <MessageSquare className="size-8 opacity-40" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Select a conversation</p>
                    <p className="mt-1 text-sm">Choose a thread from the left to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
