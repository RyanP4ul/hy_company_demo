'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/shared/animated-components';
import { cn } from '@/lib/utils';
import {
  inboxConversations,
  type InboxConversation,
  type InboxChannel,
  type InboxMessage,
  type ConversationStatus,
} from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  MessageCircle,
  Send,
  Search,
  MoreHorizontal,
  Phone,
  UserCheck,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  ArrowLeft,
  Tag,
  Zap,
  Star,
  ChevronRight,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Channel Config ──────────────────────────────────────────────────────────

const channelConfig: Record<InboxChannel, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  badgeBg: string;
  badgeText: string;
}> = {
  viber: {
    label: 'Viber',
    icon: MessageCircle,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    border: 'border-violet-200 dark:border-violet-800',
    badgeBg: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    badgeText: 'text-violet-700 dark:text-violet-300',
  },
  wechat: {
    label: 'WeChat',
    icon: MessageSquare,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    badgeBg: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    badgeText: 'text-green-700 dark:text-green-300',
  },
};

const statusConfig: Record<ConversationStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}> = {
  open: { label: 'Open', icon: CircleDot, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .replace(/[()（）/]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Customer Type Badge ────────────────────────────────────────────────────

function CustomerTypeBadge({ type }: { type: 'regular' | 'new' }) {
  if (type === 'new') {
    return (
      <Badge className="gap-1 border-0 bg-amber-100 text-amber-700 text-[10px] font-semibold px-1.5 py-0 dark:bg-amber-900/40 dark:text-amber-300">
        <UserPlus className="size-3" />
        NEW
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 border-0 bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-1.5 py-0 dark:bg-emerald-900/40 dark:text-emerald-300">
      <Star className="size-3" />
      REGULAR
    </Badge>
  );
}

// ─── Channel Badge ──────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: InboxChannel }) {
  const config = channelConfig[channel];
  const ChannelIcon = config.icon;
  return (
    <Badge variant="outline" className={cn('gap-1 text-[10px] font-semibold border', config.border, config.badgeText)}>
      <ChannelIcon className="size-3" />
      {config.label}
    </Badge>
  );
}

// ─── Conversation List Item ─────────────────────────────────────────────────

function ConversationListItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: InboxConversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const channelConf = channelConfig[conversation.channel];
  const statusConf = statusConfig[conversation.status];
  const ChannelIcon = channelConf.icon;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all',
        isActive
          ? 'border-primary/30 bg-primary/5 shadow-sm'
          : 'border-transparent hover:bg-muted/50 hover:border-muted',
        conversation.unreadCount > 0 && !isActive && 'bg-muted/30'
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className={cn('size-10 ring-2', isActive ? 'ring-primary/30' : 'ring-transparent')}>
          <AvatarFallback className={cn('text-xs font-semibold', channelConf.bg, channelConf.color)}>
            {getInitials(conversation.customerName)}
          </AvatarFallback>
        </Avatar>
        {/* Channel indicator dot */}
        <div className={cn('absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full ring-2 ring-background', channelConf.bg)}>
          <ChannelIcon className={cn('size-2.5', channelConf.color)} />
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn('truncate text-sm', conversation.unreadCount > 0 ? 'font-bold' : 'font-medium')}>
              {conversation.customerName}
            </span>
            <CustomerTypeBadge type={conversation.customerType} />
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground">{conversation.lastMessageTime}</span>
        </div>

        <p className={cn('mt-0.5 truncate text-xs', conversation.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
          {conversation.lastMessage}
        </p>

        {/* Bottom meta */}
        <div className="mt-1.5 flex items-center gap-2">
          <StatusIcon status={conversation.status} />
          {conversation.assignedTo && (
            <span className="text-[10px] text-muted-foreground">
              {conversation.assignedTo}
            </span>
          )}
          {conversation.unreadCount > 0 && (
            <span className={cn('ml-auto flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white', channelConf.bg.replace('100', '500'))}>
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {conversation.unreadCount}
              </span>
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function StatusIcon({ status }: { status: ConversationStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex size-5 items-center justify-center rounded', config.bg)}>
          <Icon className={cn('size-3', config.color)} />
        </div>
      </TooltipTrigger>
      <TooltipContent>{config.label}</TooltipContent>
    </Tooltip>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────────────────

function MessageBubble({ message, channel }: { message: InboxMessage; channel: InboxChannel }) {
  const isCustomer = message.sender === 'customer';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex', isCustomer ? 'justify-start' : 'justify-end')}
    >
      <div className={cn('max-w-[75%] sm:max-w-[65%]')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isCustomer
              ? 'rounded-tl-md bg-muted'
              : 'rounded-tr-md bg-primary text-primary-foreground'
          )}
        >
          {message.content}
        </div>
        <div className={cn('mt-1 flex items-center gap-2 px-1', isCustomer ? '' : 'justify-end')}>
          <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Customer Info Panel ────────────────────────────────────────────────────

function CustomerInfoPanel({
  conversation,
  onAssign,
  onResolve,
}: {
  conversation: InboxConversation;
  onAssign: () => void;
  onResolve: () => void;
}) {
  const channelConf = channelConfig[conversation.channel];
  const statusConf = statusConfig[conversation.status];
  const StatusIcon = statusConf.icon;

  return (
    <div className="space-y-4">
      {/* Customer Header */}
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarFallback className={cn('text-sm font-semibold', channelConf.bg, channelConf.color)}>
            {getInitials(conversation.customerName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{conversation.customerName}</h3>
            <CustomerTypeBadge type={conversation.customerType} />
          </div>
          <p className="text-xs text-muted-foreground">{conversation.customerPhone}</p>
        </div>
      </div>

      <Separator />

      {/* Customer Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border bg-muted/20 p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Orders</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums">{conversation.customerOrders}</p>
        </div>
        <div className="rounded-lg border bg-muted/20 p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Spent</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums">{formatCurrency(conversation.customerTotalSpent)}</p>
        </div>
      </div>

      {/* Customer Since */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="size-3.5" />
        <span>Customer since {conversation.customerSince}</span>
      </div>

      {/* Webhook Event */}
      {conversation.webhookEventId && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-2.5">
          <Zap className="size-3.5 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Webhook Event</p>
            <p className="truncate text-xs font-mono text-muted-foreground">{conversation.webhookEventId}</p>
          </div>
        </div>
      )}

      <Separator />

      {/* Status & Actions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <StatusIcon status={conversation.status} />
          <span className="text-xs font-medium">{statusConf.label}</span>
          {conversation.assignedTo && (
            <span className="ml-auto text-[10px] text-muted-foreground">
              Assigned: {conversation.assignedTo}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={onAssign}>
            <UserCheck className="size-3.5" />
            Assign
          </Button>
          {conversation.status !== 'resolved' && (
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={onResolve}>
              <CheckCircle2 className="size-3.5" />
              Resolve
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function CentralInboxPage() {
  const [conversations, setConversations] = useState<InboxConversation[]>(inboxConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<'all' | InboxChannel>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ConversationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  // Scroll to bottom of messages when switching conversation or sending a message
  const messagesWrapperRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (!messagesWrapperRef.current) return;
    const viewport = messagesWrapperRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      setTimeout(scrollToBottom, 100);
    }
  }, [selectedConversation?.messages.length, selectedConversation?.id, scrollToBottom]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.customerName.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q) ||
          c.customerPhone.includes(q)
        );
      }
      return true;
    });
  }, [conversations, channelFilter, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    const viberCount = conversations.filter((c) => c.channel === 'viber').length;
    const wechatCount = conversations.filter((c) => c.channel === 'wechat').length;
    const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
    const openCount = conversations.filter((c) => c.status === 'open').length;
    const newCustomers = conversations.filter((c) => c.customerType === 'new').length;
    return { totalMessages, viberCount, wechatCount, unreadTotal, openCount, newCustomers };
  }, [conversations]);

  const handleSelectConversation = useCallback((id: string) => {
    setSelectedId(id);
    setMobileShowChat(true);
    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!replyText.trim() || !selectedId) return;

    const newMessage: InboxMessage = {
      id: `MSG-${Date.now()}`,
      conversationId: selectedId,
      sender: 'agent',
      content: replyText.trim(),
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      type: 'text',
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              messages: [...c.messages, newMessage],
              lastMessage: replyText.trim(),
              lastMessageTime: 'Just now',
            }
          : c
      )
    );
    setReplyText('');
    toast.success('Message sent');
  }, [replyText, selectedId]);

  const handleResolve = useCallback(() => {
    if (!selectedId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, status: 'resolved' as ConversationStatus } : c))
    );
    toast.success('Conversation resolved');
  }, [selectedId]);

  const handleAssign = useCallback(() => {
    if (!selectedId) return;
    setAssignDialogOpen(true);
  }, [selectedId]);

  const handleAssignConfirm = useCallback(() => {
    if (!selectedId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, assignedTo: 'Alex Johnson', status: 'open' as ConversationStatus } : c
      )
    );
    setAssignDialogOpen(false);
    toast.success('Conversation assigned to Alex Johnson');
  }, [selectedId]);

  const handleBackToList = useCallback(() => {
    setMobileShowChat(false);
  }, []);

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Central Inbox</h1>
              <p className="text-muted-foreground">
                Manage Viber &amp; WeChat webhook conversations in one place.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {stats.unreadTotal > 0 && (
                <Badge className="gap-1.5 px-3 py-1 text-xs font-semibold">
                  <MessageSquare className="size-3.5" />
                  {stats.unreadTotal} unread
                </Badge>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Stats Cards */}
        <StaggerContainer className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Total Messages', value: stats.totalMessages, icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Viber', value: stats.viberCount, icon: MessageCircle, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30' },
            { label: 'WeChat', value: stats.wechatCount, icon: MessageSquare, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
            { label: 'Open', value: stats.openCount, icon: CircleDot, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
            { label: 'New Customers', value: stats.newCustomers, icon: UserPlus, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
            { label: 'Unread', value: stats.unreadTotal, icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <StaggerItem key={stat.label}>
                <motion.div
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', stat.bg)}>
                    <Icon className={cn('size-4', stat.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold tabular-nums leading-tight">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Channel Filter + Search */}
        <FadeIn delay={0.1}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={channelFilter} onValueChange={(v) => setChannelFilter(v as 'all' | InboxChannel)}>
              <TabsList>
                {[
                  { value: 'all', label: 'All Channels' },
                  { value: 'viber', label: 'Viber' },
                  { value: 'wechat', label: 'WeChat' },
                ].map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs">
                    {tab.value === 'viber' && <MessageCircle className="size-3.5 text-violet-500" />}
                    {tab.value === 'wechat' && <MessageSquare className="size-3.5 text-green-500" />}
                    {tab.label}
                    {tab.value !== 'all' && (
                      <Badge variant="secondary" className="ml-0.5 h-4 min-w-[16px] px-1 text-[10px]">
                        {tab.value === 'viber' ? stats.viberCount : stats.wechatCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full pl-8 text-xs sm:w-56"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Tag className="size-3.5" />
                    Status
                    <ChevronRight className="size-3 rotate-90" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter('all')} className={statusFilter === 'all' ? 'bg-accent' : ''}>
                    <CircleDot className="mr-2 size-3.5" /> All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('open')} className={statusFilter === 'open' ? 'bg-accent' : ''}>
                    <CircleDot className="mr-2 size-3.5 text-emerald-500" /> Open
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('pending')} className={statusFilter === 'pending' ? 'bg-accent' : ''}>
                    <Clock className="mr-2 size-3.5 text-amber-500" /> Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('resolved')} className={statusFilter === 'resolved' ? 'bg-accent' : ''}>
                    <CheckCircle2 className="mr-2 size-3.5 text-slate-500" /> Resolved
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </FadeIn>

        {/* Main Content: Conversation List + Chat Area */}
        <FadeIn delay={0.15}>
          <div className="flex gap-0 rounded-xl border bg-card shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 340px)', minHeight: '480px', maxHeight: 'calc(100vh - 280px)' }}>
            {/* Left Panel: Conversation List */}
            <div
              className={cn(
                'w-full shrink-0 border-r md:w-80 lg:w-96 overflow-hidden',
                mobileShowChat ? 'hidden md:block' : 'block'
              )}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b px-3 py-2.5 shrink-0">
                  <h2 className="text-sm font-semibold">Conversations</h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {filteredConversations.length}
                  </Badge>
                </div>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="space-y-1 p-2">
                    {filteredConversations.length > 0 ? (
                      filteredConversations.map((conv) => (
                        <ConversationListItem
                          key={conv.id}
                          conversation={conv}
                          isActive={selectedId === conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                        />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquare className="mb-2 size-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No conversations found</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <div className="hidden md:block w-px bg-border" />

            {/* Right Panel: Chat Area */}
            <div
              className={cn(
                'hidden flex-1 md:flex md:flex-col overflow-hidden min-w-0',
                mobileShowChat && '!flex'
              )}
            >
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 border-b px-4 py-3 shrink-0">
                    {/* Mobile back button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 md:hidden"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft className="size-4" />
                    </Button>

                    <Avatar className="size-9">
                      <AvatarFallback className={cn(
                        'text-xs font-semibold',
                        channelConfig[selectedConversation.channel].bg,
                        channelConfig[selectedConversation.channel].color
                      )}>
                        {getInitials(selectedConversation.customerName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">
                          {selectedConversation.customerName}
                        </h3>
                        <CustomerTypeBadge type={selectedConversation.customerType} />
                        <ChannelBadge channel={selectedConversation.channel} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.customerPhone}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleAssign}>
                          <UserCheck className="mr-2 size-4" />
                          Assign
                        </DropdownMenuItem>
                        {selectedConversation.status !== 'resolved' && (
                          <DropdownMenuItem onClick={handleResolve}>
                            <CheckCircle2 className="mr-2 size-4" />
                            Mark as Resolved
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Phone className="mr-2 size-4" />
                          Call Customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Chat Body: Messages + Customer Info Sidebar */}
                  <div className="flex flex-1 min-h-0 overflow-hidden">
                    {/* Messages Area */}
                    <div className="flex flex-1 flex-col min-w-0">
                      <div ref={messagesWrapperRef} className="flex-1 min-h-0 overflow-hidden">
                        <ScrollArea className="flex-1 min-h-0">
                        <div className="space-y-3 p-4">
                          {/* Conversation date divider */}
                          <div className="flex items-center gap-3 py-1">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                              {selectedConversation.messages[0]?.timestamp?.split(',')[0] || 'Today'}
                            </span>
                            <div className="h-px flex-1 bg-border" />
                          </div>
                          {selectedConversation.messages.map((msg) => (
                            <MessageBubble
                              key={msg.id}
                              message={msg}
                              channel={selectedConversation.channel}
                            />
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                      </div>

                      {/* Reply Input */}
                      <div className="border-t p-3 shrink-0">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            className="flex-1 text-sm"
                          />
                          <Button
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={!replyText.trim()}
                            className="shrink-0"
                          >
                            <Send className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Customer Info Sidebar (Desktop only) */}
                    <div className="hidden w-64 shrink-0 border-l lg:block overflow-hidden">
                      <ScrollArea className="h-full">
                        <div className="p-4">
                          <CustomerInfoPanel
                            conversation={selectedConversation}
                            onAssign={handleAssign}
                            onResolve={handleResolve}
                          />
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </>
              ) : (
                // Empty state when no conversation selected
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                    <MessageSquare className="size-8 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Select a conversation</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Choose a conversation from the left to view messages
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Assign Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Assign Conversation</DialogTitle>
              <DialogDescription>
                Assign this conversation to a team member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <p className="text-sm">
                Conversation with <strong>{selectedConversation?.customerName}</strong> will be assigned to:
              </p>
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">AJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Alex Johnson</p>
                    <p className="text-xs text-muted-foreground">Admin</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignConfirm}>
                Confirm Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
