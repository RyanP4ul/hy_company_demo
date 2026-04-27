'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  ShoppingCart,
  AlertCircle,
  Search,
  ChevronDown,
  Building2,
  Phone,
  UserCheck,
  Truck,
  Bike,
  CalendarClock,
  MapPin,
  MapPinOff,
  Zap,
  Clock,
  Users,
  Car,
  Timer,
  CircleDot,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { useNavigationStore } from '@/stores/navigation';
import { usePageContext } from '@/stores/page-context';
import { inventoryItems, customers } from '@/lib/mock-data';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// ─── Lalamove Vehicle Types ──────────────────────────────────────────────────
const VEHICLE_TYPES = [
  { id: 'bike', label: 'Bike', icon: Bike, basePrice: 49, capacity: 'Up to 5kg', description: 'Small parcels, documents, food' },
  { id: 'car', label: 'Car', icon: Car, basePrice: 149, capacity: 'Up to 200kg', description: 'Medium parcels, electronics' },
  { id: 'mpv', label: 'MPV', icon: Users, basePrice: 199, capacity: 'Up to 400kg', description: 'Large parcels, multiple items' },
  { id: 'van-17', label: 'Van (1.7m)', icon: Truck, basePrice: 349, capacity: 'Up to 800kg', description: 'Bulky items, small furniture' },
  { id: 'van-24', label: 'Van (2.4m)', icon: Truck, basePrice: 499, capacity: 'Up to 1,000kg', description: 'Large furniture, appliances' },
  { id: 'lorry-10', label: 'Lorry (10ft)', icon: Truck, basePrice: 799, capacity: 'Up to 2,000kg', description: 'Heavy cargo, pallets' },
  { id: 'lorry-14', label: 'Lorry (14ft)', icon: Truck, basePrice: 1099, capacity: 'Up to 3,000kg', description: 'Industrial cargo, bulk items' },
] as const;

// ─── Lalamove Service Priority ───────────────────────────────────────────────
const SERVICE_PRIORITIES = [
  { id: 'priority', label: 'Priority', multiplier: 1.3, icon: Zap, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-950/30', borderColor: 'border-rose-200 dark:border-rose-800', description: 'Match faster for quick deliveries (higher price)' },
  { id: 'regular', label: 'Regular', multiplier: 1.0, icon: CircleDot, color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-950/30', borderColor: 'border-sky-200 dark:border-sky-800', description: 'Standard delivery speed' },
  { id: 'pooling', label: 'Pooling', multiplier: 0.7, icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', borderColor: 'border-emerald-200 dark:border-emerald-800', description: 'Save costs — wait a little longer' },
] as const;

// ─── Lalamove Additional Services ────────────────────────────────────────────
const ADDITIONAL_SERVICES = [
  { id: 'buy-for-me', label: 'Buy for me', price: 50, icon: ShoppingCart, description: 'Driver purchases items on your behalf' },
  { id: 'extra-waiting', label: 'Extra waiting time (Queuing service)', price: 30, icon: Timer, description: 'Additional wait time for driver' },
] as const;

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface LalamoveConfig {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  dropoffName: string;
  dropoffPhone: string;
  dropoffAddress: string;
  dropoffCity: string;
  vehicleType: string;
  servicePriority: string;
  additionalServices: string[];
}

interface OrderForm {
  customer: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryType: 'truck' | 'lalamove';
  paymentStatus: 'paid' | 'unpaid';
  scheduleDate: string;
  scheduleTime: string;
  notes: string;
  items: OrderItem[];
  lalamove: LalamoveConfig;
}

const TAX_RATE = 0.08;

let itemIdCounter = 0;
function generateItemId() {
  itemIdCounter++;
  return `item-${Date.now()}-${itemIdCounter}`;
}

const defaultLalamove: LalamoveConfig = {
  senderName: '',
  senderPhone: '',
  senderAddress: '',
  senderCity: '',
  dropoffName: '',
  dropoffPhone: '',
  dropoffAddress: '',
  dropoffCity: '',
  vehicleType: 'bike',
  servicePriority: 'regular',
  additionalServices: [],
};

export default function CreateOrderPage() {
  const setCurrentView = useNavigationStore((s) => s.setCurrentView);
  const returnTo = usePageContext((s) => s.returnTo);

  const [form, setForm] = useState<OrderForm>({
    customer: '',
    priority: 'medium',
    status: 'pending',
    deliveryType: 'truck',
    paymentStatus: 'unpaid',
    scheduleDate: '',
    scheduleTime: '',
    notes: '',
    items: [],
    lalamove: { ...defaultLalamove },
  });

  // Customer combobox state
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Vehicle type combobox
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);

  // Service priority combobox
  const [prioritySearch, setPrioritySearch] = useState('');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  // Filter customers by search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    return customers.filter((c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.company.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.contactNumber.includes(customerSearch) ||
      c.id.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customerSearch]);

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId]);

  // Vehicle type search filter
  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch.trim()) return VEHICLE_TYPES;
    return VEHICLE_TYPES.filter((v) =>
      v.label.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.description.toLowerCase().includes(vehicleSearch.toLowerCase())
    );
  }, [vehicleSearch]);

  const selectedVehicle = useMemo(() => {
    return VEHICLE_TYPES.find((v) => v.id === form.lalamove.vehicleType) || VEHICLE_TYPES[0];
  }, [form.lalamove.vehicleType]);

  // Service priority search filter
  const filteredPriorities = useMemo(() => {
    if (!prioritySearch.trim()) return SERVICE_PRIORITIES;
    return SERVICE_PRIORITIES.filter((p) =>
      p.label.toLowerCase().includes(prioritySearch.toLowerCase()) ||
      p.description.toLowerCase().includes(prioritySearch.toLowerCase())
    );
  }, [prioritySearch]);

  const selectedPriority = useMemo(() => {
    return SERVICE_PRIORITIES.find((p) => p.id === form.lalamove.servicePriority) || SERVICE_PRIORITIES[1];
  }, [form.lalamove.servicePriority]);

  // Calculate Lalamove delivery fee
  const lalamoveDeliveryFee = useMemo(() => {
    if (form.deliveryType !== 'lalamove') return 0;
    const base = selectedVehicle.basePrice;
    const priorityMultiplier = selectedPriority.multiplier;
    const additionalFees = form.lalamove.additionalServices.reduce((sum, serviceId) => {
      const service = ADDITIONAL_SERVICES.find((s) => s.id === serviceId);
      return sum + (service?.price ?? 0);
    }, 0);
    return Math.round(base * priorityMultiplier + additionalFees);
  }, [form.deliveryType, selectedVehicle, selectedPriority, form.lalamove.additionalServices]);

  // Handle customer selection
  const handleSelectCustomer = useCallback((customer: typeof customers[number]) => {
    setSelectedCustomerId(customer.id);
    setCustomerSearch(customer.name);
    setForm((f) => ({ ...f, customer: customer.name }));
    setShowCustomerDropdown(false);
  }, []);

  const handleClearCustomer = useCallback(() => {
    setSelectedCustomerId('');
    setCustomerSearch('');
    setForm((f) => ({ ...f, customer: '' }));
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-customer-combobox]')) {
        setShowCustomerDropdown(false);
      }
      if (!target.closest('[data-product-combobox]')) {
        setShowProductDropdown(false);
      }
      if (!target.closest('[data-vehicle-combobox]')) {
        setShowVehicleDropdown(false);
      }
      if (!target.closest('[data-priority-combobox]')) {
        setShowPriorityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return inventoryItems;
    return inventoryItems.filter((p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [productSearch]);

  // Calculate totals
  const subtotal = useMemo(
    () => form.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [form.items]
  );
  const tax = subtotal * TAX_RATE;
  const deliveryFee = form.deliveryType === 'lalamove' ? lalamoveDeliveryFee : 0;
  const grandTotal = subtotal + tax + deliveryFee;

  // Update lalamove config
  const updateLalamove = useCallback(<K extends keyof LalamoveConfig>(key: K, value: LalamoveConfig[K]) => {
    setForm((f) => ({ ...f, lalamove: { ...f.lalamove, [key]: value } }));
  }, []);

  // Toggle additional service
  const toggleAdditionalService = useCallback((serviceId: string) => {
    setForm((f) => ({
      ...f,
      lalamove: {
        ...f.lalamove,
        additionalServices: f.lalamove.additionalServices.includes(serviceId)
          ? f.lalamove.additionalServices.filter((s) => s !== serviceId)
          : [...f.lalamove.additionalServices, serviceId],
      },
    }));
  }, []);

  // Open add item dialog
  const openAddItemDialog = useCallback(() => {
    setSelectedProduct('');
    setItemQty('1');
    setItemPrice('');
    setProductSearch('');
    setShowProductDropdown(false);
    setItemDialogOpen(true);
  }, []);

  // Select product from dropdown
  const handleSelectProduct = useCallback((product: typeof inventoryItems[number]) => {
    setSelectedProduct(product.id);
    setProductSearch(product.name);
    setItemPrice(String(product.price));
    setShowProductDropdown(false);
  }, []);

  // Add item to order
  const handleAddItem = useCallback(() => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }
    if (!itemQty || isNaN(Number(itemQty)) || Number(itemQty) < 1) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (!itemPrice || isNaN(Number(itemPrice)) || Number(itemPrice) <= 0) {
      toast.error('Please enter a valid unit price');
      return;
    }

    const product = inventoryItems.find((p) => p.id === selectedProduct);
    if (!product) return;

    const existing = form.items.find((i) => i.productId === selectedProduct);
    if (existing) {
      toast.error(`${product.name} is already in the order. Please edit the quantity instead.`);
      return;
    }

    const newItem: OrderItem = {
      id: generateItemId(),
      productId: product.id,
      name: product.name,
      quantity: Math.floor(Number(itemQty)),
      unitPrice: parseFloat(Number(itemPrice).toFixed(2)),
    };

    setForm((f) => ({ ...f, items: [...f.items, newItem] }));
    setItemDialogOpen(false);
    toast.success(`${product.name} added to order`);
  }, [selectedProduct, itemQty, itemPrice, form.items]);

  // Remove item from order
  const handleRemoveItem = useCallback((itemId: string) => {
    const item = form.items.find((i) => i.id === itemId);
    setForm((f) => ({ ...f, items: f.items.filter((i) => i.id !== itemId) }));
    if (item) toast.info(`${item.name} removed`);
  }, [form.items]);

  // Update item quantity
  const handleUpdateQty = useCallback((itemId: string, qty: number) => {
    if (qty < 1) return;
    setForm((f) => ({
      ...f,
      items: f.items.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i)),
    }));
  }, []);

  // Submit order
  const handleSubmit = useCallback(() => {
    if (!form.customer.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (form.items.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }
    if (form.deliveryType === 'lalamove' && !form.lalamove.senderAddress.trim()) {
      toast.error('Sender address is required for Lalamove delivery');
      return;
    }
    if (form.deliveryType === 'lalamove' && !form.lalamove.dropoffAddress.trim()) {
      toast.error('Drop-off address is required for Lalamove delivery');
      return;
    }

    const totalItems = form.items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = form.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const tax = subtotal * TAX_RATE;
    const deliveryFee = form.deliveryType === 'lalamove' ? lalamoveDeliveryFee : 0;
    const orderTotal = parseFloat((subtotal + tax + deliveryFee).toFixed(2));

    const maxNum = 2847;
    const newId = `ORD-${maxNum + 1}`;

    const orderEvent = new CustomEvent('order:created', {
      detail: {
        id: newId,
        customer: form.customer.trim(),
        items: totalItems,
        total: orderTotal,
        status: form.status,
        date: new Date().toISOString().split('T')[0],
        priority: form.priority,
        deliveryType: form.deliveryType,
        paymentStatus: form.paymentStatus,
        scheduleDate: form.scheduleDate,
        scheduleTime: form.scheduleTime,
        orderItems: form.items.map((i) => ({
          name: i.name,
          productId: i.productId,
          qty: i.quantity,
          price: i.unitPrice,
        })),
        lalamove: form.deliveryType === 'lalamove' ? form.lalamove : undefined,
      },
    });
    window.dispatchEvent(orderEvent);

    toast.success(`Order ${newId} created successfully for ${form.customer.trim()}`);
    setCurrentView(returnTo === 'orders' ? 'orders' : 'orders');
  }, [form, returnTo, setCurrentView, lalamoveDeliveryFee]);

  const handleGoBack = useCallback(() => {
    setCurrentView(returnTo === 'orders' ? 'orders' : 'orders');
  }, [returnTo, setCurrentView]);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Back Button + Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleGoBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Create New Order</h1>
                  <p className="text-sm text-muted-foreground">
                    Add customer details and order items
                  </p>
                </div>
              </div>
            </div>
            <Button
              className="gap-2 w-full sm:w-auto"
              onClick={handleSubmit}
              disabled={!form.customer.trim() || form.items.length === 0}
            >
              <Package className="h-4 w-4" />
              Place Order
            </Button>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Customer Info + Items + Lalamove */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <FadeIn delay={0.05}>
              <AnimatedCard>
                <div className="space-y-4">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    Customer Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="customer-name">
                        Customer / Company Name <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative" data-customer-combobox>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="customer-name"
                          placeholder="Search by name, company, or phone..."
                          className="pl-9 pr-8"
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setSelectedCustomerId('');
                            setForm((f) => ({ ...f, customer: e.target.value }));
                            setShowCustomerDropdown(true);
                          }}
                          onFocus={() => setShowCustomerDropdown(true)}
                        />
                        {selectedCustomerId && (
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted transition-colors"
                            onClick={handleClearCustomer}
                          >
                            <span className="text-muted-foreground text-xs">✕</span>
                          </button>
                        )}

                        {showCustomerDropdown && !selectedCustomerId && (
                          <div className="absolute z-50 top-full mt-1 left-0 right-0 max-h-64 overflow-y-auto rounded-lg border bg-popover shadow-lg">
                            {filteredCustomers.length === 0 ? (
                              <div className="p-4 text-center">
                                <p className="text-sm text-muted-foreground">No customers found</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                  Type to create a new customer entry
                                </p>
                              </div>
                            ) : (
                              filteredCustomers.map((customer) => (
                                <button
                                  key={customer.id}
                                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                                  onClick={() => handleSelectCustomer(customer)}
                                >
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                    {customer.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{customer.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {customer.company && (
                                        <>
                                          <span className="flex items-center gap-0.5">
                                            <Building2 className="h-3 w-3" />
                                            {customer.company}
                                          </span>
                                          <span>·</span>
                                        </>
                                      )}
                                      <span className="flex items-center gap-0.5">
                                        <Phone className="h-3 w-3" />
                                        {customer.contactNumber}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="flex items-center gap-1">
                                      <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                                      <p className="text-sm font-semibold tabular-nums">{customer.totalOrders}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">orders</p>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {selectedCustomer && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                          className="rounded-lg border bg-muted/30 p-3 space-y-2"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {selectedCustomer.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{selectedCustomer.name}</p>
                              <p className="text-xs text-muted-foreground">{selectedCustomer.id}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 pl-[52px]">
                            {selectedCustomer.company && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3 shrink-0" />
                                <span className="truncate">{selectedCustomer.company}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{selectedCustomer.contactNumber}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <ShoppingCart className="h-3 w-3 shrink-0" />
                              <span>{selectedCustomer.totalOrders} orders</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <UserCheck className="h-3 w-3 shrink-0" />
                              <span className={selectedCustomer.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                                {selectedCustomer.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="order-priority">Priority</Label>
                      <Select
                        value={form.priority}
                        onValueChange={(v) => setForm((f) => ({ ...f, priority: v as 'high' | 'medium' | 'low' }))}
                      >
                        <SelectTrigger id="order-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-red-500" />
                              High
                            </span>
                          </SelectItem>
                          <SelectItem value="medium">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              Medium
                            </span>
                          </SelectItem>
                          <SelectItem value="low">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              Low
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order-delivery-type">
                        <span className="flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5" />
                          Delivery Type
                        </span>
                      </Label>
                      <Select
                        value={form.deliveryType}
                        onValueChange={(v) => setForm((f) => ({ ...f, deliveryType: v as 'truck' | 'lalamove' }))}
                      >
                        <SelectTrigger id="order-delivery-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="truck">
                            <span className="flex items-center gap-2">
                              <Truck className="h-3.5 w-3.5 text-sky-600" />
                              Truck (Company Delivery)
                            </span>
                          </SelectItem>
                          <SelectItem value="lalamove">
                            <span className="flex items-center gap-2">
                              <Bike className="h-3.5 w-3.5 text-rose-600" />
                              Lalamove (Express)
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Schedule Date & Time */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label>
                        <span className="flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5" />
                          Schedule (optional)
                        </span>
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          type="date"
                          value={form.scheduleDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setForm((f) => ({ ...f, scheduleDate: e.target.value }))}
                          className="w-full"
                        />
                        <Input
                          type="time"
                          value={form.scheduleTime}
                          onChange={(e) => setForm((f) => ({ ...f, scheduleTime: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                      {(form.scheduleDate || form.scheduleTime) && (
                        <p className="text-xs text-muted-foreground">
                          {form.scheduleDate ? `Scheduled for ${form.scheduleDate}` : 'No date set'}
                          {form.scheduleTime ? ` at ${form.scheduleTime}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="order-notes">Notes (optional)</Label>
                      <Input
                        id="order-notes"
                        placeholder="Any special instructions..."
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </FadeIn>

            {/* ─── Lalamove Delivery Configuration ─────────────────────────── */}
            <AnimatePresence>
              {form.deliveryType === 'lalamove' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <FadeIn delay={0.08}>
                    <AnimatedCard>
                      <div className="space-y-5">
                        {/* Section header */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                            <Bike className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-base font-semibold">Lalamove Delivery</h2>
                            <p className="text-xs text-muted-foreground">Configure express delivery details</p>
                          </div>
                        </div>

                        <Separator />

                        {/* ─── Sender (Pickup) Address ──────────────────────── */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                            Sender (Pickup Location)
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Sender Name</Label>
                              <Input
                                placeholder="Warehouse or sender name"
                                value={form.lalamove.senderName}
                                onChange={(e) => updateLalamove('senderName', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Phone Number</Label>
                              <Input
                                placeholder="+63 9XX XXX XXXX"
                                value={form.lalamove.senderPhone}
                                onChange={(e) => updateLalamove('senderPhone', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label className="text-xs text-muted-foreground">
                                Pickup Address <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                placeholder="Full pickup address (street, building, etc.)"
                                value={form.lalamove.senderAddress}
                                onChange={(e) => updateLalamove('senderAddress', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label className="text-xs text-muted-foreground">City / Municipality</Label>
                              <Input
                                placeholder="e.g. Makati City"
                                value={form.lalamove.senderCity}
                                onChange={(e) => updateLalamove('senderCity', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* ─── Drop-off Location ───────────────────────────── */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <MapPinOff className="h-3.5 w-3.5 text-rose-500" />
                            Drop-off Location
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Recipient Name</Label>
                              <Input
                                placeholder="Receiver name"
                                value={form.lalamove.dropoffName}
                                onChange={(e) => updateLalamove('dropoffName', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Phone Number</Label>
                              <Input
                                placeholder="+63 9XX XXX XXXX"
                                value={form.lalamove.dropoffPhone}
                                onChange={(e) => updateLalamove('dropoffPhone', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label className="text-xs text-muted-foreground">
                                Drop-off Address <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                placeholder="Full delivery address (street, building, etc.)"
                                value={form.lalamove.dropoffAddress}
                                onChange={(e) => updateLalamove('dropoffAddress', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label className="text-xs text-muted-foreground">City / Municipality</Label>
                              <Input
                                placeholder="e.g. Taguig City"
                                value={form.lalamove.dropoffCity}
                                onChange={(e) => updateLalamove('dropoffCity', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* ─── Vehicle Type Combobox ───────────────────────── */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Vehicle Type
                          </Label>
                          <div className="relative" data-vehicle-combobox>
                            <button
                              type="button"
                              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => {
                                setShowVehicleDropdown((v) => !v);
                                setShowPriorityDropdown(false);
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <selectedVehicle.icon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{selectedVehicle.label}</span>
                                <span className="text-xs text-muted-foreground">— {selectedVehicle.capacity}</span>
                              </span>
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </button>

                            <AnimatePresence>
                              {showVehicleDropdown && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute z-50 top-full mt-1 left-0 right-0 max-h-80 overflow-y-auto rounded-lg border bg-popover shadow-lg"
                                >
                                  {/* Search */}
                                  <div className="sticky top-0 bg-popover border-b p-2">
                                    <div className="relative">
                                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                      <Input
                                        placeholder="Search vehicle type..."
                                        className="h-8 pl-8 text-xs"
                                        value={vehicleSearch}
                                        onChange={(e) => setVehicleSearch(e.target.value)}
                                        onKeyDown={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  </div>

                                  {filteredVehicles.map((vehicle) => {
                                    const VehicleIcon = vehicle.icon;
                                    const isSelected = form.lalamove.vehicleType === vehicle.id;
                                    return (
                                      <button
                                        key={vehicle.id}
                                        type="button"
                                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-border/50 last:border-0 ${
                                          isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                                        }`}
                                        onClick={() => {
                                          updateLalamove('vehicleType', vehicle.id);
                                          setVehicleSearch(vehicle.label);
                                          setShowVehicleDropdown(false);
                                        }}
                                      >
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                          isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                        }`}>
                                          <VehicleIcon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">{vehicle.label}</p>
                                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                                          </div>
                                          <p className="text-xs text-muted-foreground">{vehicle.description}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <p className="text-sm font-semibold tabular-nums">₱{vehicle.basePrice.toLocaleString()}</p>
                                          <p className="text-xs text-muted-foreground">{vehicle.capacity}</p>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <Separator />

                        {/* ─── Service Priority Combobox ───────────────────── */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Service Priority
                          </Label>
                          <div className="relative" data-priority-combobox>
                            <button
                              type="button"
                              className={`flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                                selectedPriority.id === 'priority'
                                  ? 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20'
                                  : selectedPriority.id === 'pooling'
                                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20'
                                    : 'border-input bg-background'
                              }`}
                              onClick={() => {
                                setShowPriorityDropdown((v) => !v);
                                setShowVehicleDropdown(false);
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <selectedPriority.icon className={`h-4 w-4 ${selectedPriority.color}`} />
                                <span className="font-medium">{selectedPriority.label}</span>
                                <span className="text-xs text-muted-foreground hidden sm:inline">
                                  — {selectedPriority.description.split('(')[0].trim()}
                                </span>
                              </span>
                              <span className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-xs ${selectedPriority.borderColor} ${selectedPriority.bgColor} ${selectedPriority.color}`}>
                                  {selectedPriority.multiplier === 1.0 ? '1.0x' : selectedPriority.multiplier > 1 ? `+${((selectedPriority.multiplier - 1) * 100).toFixed(0)}%` : `-${((1 - selectedPriority.multiplier) * 100).toFixed(0)}%`}
                                </Badge>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              </span>
                            </button>

                            <AnimatePresence>
                              {showPriorityDropdown && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute z-50 top-full mt-1 left-0 right-0 rounded-lg border bg-popover shadow-lg overflow-hidden"
                                >
                                  {filteredPriorities.map((priority) => {
                                    const PriorityIcon = priority.icon;
                                    const isSelected = form.lalamove.servicePriority === priority.id;
                                    return (
                                      <button
                                        key={priority.id}
                                        type="button"
                                        className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors border-b border-border/50 last:border-0 ${
                                          isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                                        }`}
                                        onClick={() => {
                                          updateLalamove('servicePriority', priority.id);
                                          setPrioritySearch(priority.label);
                                          setShowPriorityDropdown(false);
                                        }}
                                      >
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                          isSelected ? 'bg-primary/10 text-primary' : `${priority.bgColor} ${priority.color}`
                                        }`}>
                                          <PriorityIcon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">{priority.label}</p>
                                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                                          </div>
                                          <p className="text-xs text-muted-foreground">{priority.description}</p>
                                        </div>
                                        <Badge variant="outline" className={`text-xs shrink-0 ${priority.borderColor} ${priority.bgColor} ${priority.color}`}>
                                          {priority.multiplier === 1.0 ? '1.0x' : priority.multiplier > 1 ? `+${((priority.multiplier - 1) * 100).toFixed(0)}%` : `-${((1 - priority.multiplier) * 100).toFixed(0)}%`}
                                        </Badge>
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <Separator />

                        {/* ─── Additional Services ─────────────────────────── */}
                        <div className="space-y-3">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Additional Services
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ADDITIONAL_SERVICES.map((service) => {
                              const ServiceIcon = service.icon;
                              const isChecked = form.lalamove.additionalServices.includes(service.id);
                              return (
                                <button
                                  key={service.id}
                                  type="button"
                                  onClick={() => toggleAdditionalService(service.id)}
                                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                                    isChecked
                                      ? 'border-primary bg-primary/5 shadow-sm'
                                      : 'border-border hover:border-primary/30 hover:bg-muted/30'
                                  }`}
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => toggleAdditionalService(service.id)}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <ServiceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                      <p className="text-sm font-medium">{service.label}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                                  </div>
                                  <Badge variant="outline" className="shrink-0 text-xs tabular-nums">
                                    +₱{service.price}
                                  </Badge>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <Separator />

                        {/* ─── Delivery Price Summary ──────────────────────── */}
                        <div className="rounded-lg border bg-muted/30 p-4 space-y-2.5">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery Fee Breakdown</h4>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <selectedVehicle.icon className="h-3.5 w-3.5" />
                              {selectedVehicle.label} (base)
                            </span>
                            <span className="tabular-nums">₱{selectedVehicle.basePrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <selectedPriority.icon className="h-3.5 w-3.5" />
                              {selectedPriority.label} multiplier
                            </span>
                            <span className="tabular-nums">
                              {selectedPriority.multiplier === 1.0 ? '' : `${selectedPriority.multiplier}x → `}
                              <span className={selectedPriority.multiplier > 1 ? 'text-rose-600 dark:text-rose-400' : selectedPriority.multiplier < 1 ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                                ₱{Math.round(selectedVehicle.basePrice * selectedPriority.multiplier).toLocaleString()}
                              </span>
                            </span>
                          </div>
                          {form.lalamove.additionalServices.map((serviceId) => {
                            const service = ADDITIONAL_SERVICES.find((s) => s.id === serviceId);
                            if (!service) return null;
                            return (
                              <div key={serviceId} className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                  <service.icon className="h-3.5 w-3.5" />
                                  {service.label}
                                </span>
                                <span className="tabular-nums">+₱{service.price}</span>
                              </div>
                            );
                          })}
                          <Separator />
                          <div className="flex justify-between font-semibold">
                            <span>Delivery Fee</span>
                            <span className="tabular-nums text-lg">₱{lalamoveDeliveryFee.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </AnimatedCard>
                  </FadeIn>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Order Items */}
            <FadeIn delay={0.1}>
              <AnimatedCard>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Order Items
                      {form.items.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {form.items.length} {form.items.length === 1 ? 'item' : 'items'}
                        </Badge>
                      )}
                    </h2>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={openAddItemDialog}>
                      <Plus className="h-3.5 w-3.5" />
                      Add Item
                    </Button>
                  </div>

                  {form.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">No items added yet</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Click &quot;Add Item&quot; to start building the order
                      </p>
                      <Button
                        size="sm"
                        className="mt-4 gap-1.5"
                        onClick={openAddItemDialog}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add First Item
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="col-span-5 sm:col-span-5">Product</div>
                        <div className="col-span-2 sm:col-span-2 text-center">Qty</div>
                        <div className="col-span-3 sm:col-span-3 text-right">Unit Price</div>
                        <div className="col-span-2 text-right">Total</div>
                      </div>
                      <Separator />

                      <StaggerContainer staggerDelay={0.03}>
                        <AnimatePresence mode="popLayout">
                          {form.items.map((item) => (
                            <StaggerItem key={item.id}>
                              <motion.div
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="grid grid-cols-12 gap-2 items-center rounded-lg border bg-background px-3 py-2.5 group"
                              >
                                <div className="col-span-5 sm:col-span-5 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">{item.productId}</p>
                                </div>
                                <div className="col-span-2 sm:col-span-2 flex items-center justify-center gap-1">
                                  <button
                                    className="flex h-6 w-6 items-center justify-center rounded border hover:bg-muted transition-colors text-xs"
                                    onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                  >
                                    −
                                  </button>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateQty(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                                    className="h-6 w-12 text-center text-xs px-1"
                                  />
                                  <button
                                    className="flex h-6 w-6 items-center justify-center rounded border hover:bg-muted transition-colors text-xs"
                                    onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="col-span-3 sm:col-span-3 text-right text-sm tabular-nums">
                                  ₱{item.unitPrice.toFixed(2)}
                                </div>
                                <div className="col-span-2 flex items-center justify-end gap-2">
                                  <span className="text-sm font-semibold tabular-nums">
                                    ₱{(item.quantity * item.unitPrice).toFixed(2)}
                                  </span>
                                  <button
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                                    onClick={() => handleRemoveItem(item.id)}
                                    aria-label="Remove item"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </motion.div>
                            </StaggerItem>
                          ))}
                        </AnimatePresence>
                      </StaggerContainer>

                      <div className="flex items-center justify-end pt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-muted-foreground"
                          onClick={openAddItemDialog}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add another item
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            </FadeIn>
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-6">
            <FadeIn delay={0.15}>
              <div className="sticky top-6 space-y-4">
                <AnimatedCard>
                  <div className="space-y-4">
                    <h2 className="text-base font-semibold">Order Summary</h2>

                    {/* Validation warnings */}
                    {!form.customer.trim() && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>Customer name is required</span>
                      </div>
                    )}
                    {form.items.length === 0 && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>Add at least one item to place the order</span>
                      </div>
                    )}
                    {form.deliveryType === 'lalamove' && !form.lalamove.senderAddress.trim() && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>Sender pickup address is required for Lalamove</span>
                      </div>
                    )}
                    {form.deliveryType === 'lalamove' && !form.lalamove.dropoffAddress.trim() && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>Drop-off address is required for Lalamove</span>
                      </div>
                    )}

                    {/* Summary details */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Items</span>
                        <span className="font-medium">
                          {form.items.reduce((s, i) => s + i.quantity, 0)} total
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Unique Products</span>
                        <span className="font-medium">{form.items.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          variant="outline"
                          className={
                            form.status === 'pending' ? 'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400'
                            : form.status === 'processing' ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400'
                            : form.status === 'shipped' ? 'border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-400'
                            : form.status === 'delivered' ? 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-400'
                            : 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400'
                          }
                        >
                          {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Priority</span>
                        <Badge
                          variant="outline"
                          className={
                            form.priority === 'high'
                              ? 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400'
                              : form.priority === 'medium'
                                ? 'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400'
                                : 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-400'
                          }
                        >
                          {form.priority.charAt(0).toUpperCase() + form.priority.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Type</span>
                        <Badge
                          variant="outline"
                          className={
                            form.deliveryType === 'truck'
                              ? 'gap-1 border-sky-200 text-sky-700 dark:border-sky-800 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30'
                              : 'gap-1 border-rose-200 text-rose-700 dark:border-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30'
                          }
                        >
                          {form.deliveryType === 'truck' ? (
                            <><Truck className="h-3 w-3" /> Truck</>
                          ) : (
                            <><Bike className="h-3 w-3" /> Lalamove</>
                          )}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Payment</span>
                        {form.paymentStatus === 'paid' ? (
                          <Badge className="gap-1 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-medium px-2">
                            <CheckCircle2 className="size-3" /> Paid
                          </Badge>
                        ) : (
                          <Badge className="gap-1 border-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-xs font-medium px-2">
                            <XCircle className="size-3" /> Unpaid
                          </Badge>
                        )}
                      </div>

                      {/* Lalamove details in summary */}
                      {form.deliveryType === 'lalamove' && (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                          >
                            <Separator />
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Vehicle</span>
                              <Badge variant="outline" className="gap-1">
                                <selectedVehicle.icon className="h-3 w-3" />
                                {selectedVehicle.label}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Service</span>
                              <Badge variant="outline" className={`${selectedPriority.borderColor} ${selectedPriority.bgColor} ${selectedPriority.color}`}>
                                {selectedPriority.label}
                              </Badge>
                            </div>
                            {form.lalamove.additionalServices.length > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Add-ons</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {form.lalamove.additionalServices.map((id) => {
                                    const svc = ADDITIONAL_SERVICES.find((s) => s.id === id);
                                    if (!svc) return null;
                                    return (
                                      <Badge key={id} variant="secondary" className="text-xs">
                                        {svc.label}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {form.lalamove.senderAddress && (
                              <div className="flex items-start gap-2 text-sm">
                                <MapPin className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                <span className="text-muted-foreground text-xs truncate">
                                  {form.lalamove.senderAddress}
                                  {form.lalamove.senderCity && `, ${form.lalamove.senderCity}`}
                                </span>
                              </div>
                            )}
                            {form.lalamove.dropoffAddress && (
                              <div className="flex items-start gap-2 text-sm">
                                <MapPinOff className="h-3.5 w-3.5 text-rose-500 mt-0.5 shrink-0" />
                                <span className="text-muted-foreground text-xs truncate">
                                  {form.lalamove.dropoffAddress}
                                  {form.lalamove.dropoffCity && `, ${form.lalamove.dropoffCity}`}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Schedule</span>
                        <span className="text-sm">
                          {(form.scheduleDate || form.scheduleTime) ? (
                            <span className="font-medium">
                              {form.scheduleDate || 'No date'}
                              {form.scheduleTime ? ` ${form.scheduleTime}` : ''}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Not set</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Price breakdown */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="tabular-nums">₱{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Tax ({(TAX_RATE * 100).toFixed(0)}%)
                        </span>
                        <span className="tabular-nums">₱{tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        {form.deliveryType === 'lalamove' ? (
                          <span className="tabular-nums text-rose-600 dark:text-rose-400 font-medium">
                            ₱{lalamoveDeliveryFee.toLocaleString()}
                          </span>
                        ) : (
                          <span className="tabular-nums text-green-600 dark:text-green-400 font-medium">
                            Free
                          </span>
                        )}
                      </div>
                      {form.deliveryType === 'lalamove' && (
                        <div className="rounded-md bg-muted/50 p-2 space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{selectedVehicle.label} base</span>
                            <span className="tabular-nums">₱{selectedVehicle.basePrice.toLocaleString()}</span>
                          </div>
                          {selectedPriority.multiplier !== 1.0 && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{selectedPriority.label} ({selectedPriority.multiplier}x)</span>
                              <span className="tabular-nums">
                                {selectedPriority.multiplier > 1 ? '+' : ''}₱{Math.round(selectedVehicle.basePrice * (selectedPriority.multiplier - 1)).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {form.lalamove.additionalServices.map((id) => {
                            const svc = ADDITIONAL_SERVICES.find((s) => s.id === id);
                            if (!svc) return null;
                            return (
                              <div key={id} className="flex justify-between text-xs text-muted-foreground">
                                <span>{svc.label}</span>
                                <span className="tabular-nums">+₱{svc.price}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span className="tabular-nums">₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* Payment Status Selector */}
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="summary-payment-status">Payment Status</Label>
                      <Select
                        value={form.paymentStatus}
                        onValueChange={(v) => setForm((f) => ({ ...f, paymentStatus: v as 'paid' | 'unpaid' }))}
                      >
                        <SelectTrigger id="summary-payment-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-red-500" />
                              Unpaid
                            </span>
                          </SelectItem>
                          <SelectItem value="paid">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              Paid
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        {form.paymentStatus === 'paid' ? (
                          <Badge className="gap-1 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-medium px-2.5 py-1">
                            💰 Paid
                          </Badge>
                        ) : (
                          <Badge className="gap-1 border-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-xs font-medium px-2.5 py-1">
                            ⏳ Unpaid
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Submit */}
                    <Button
                      className="w-full gap-2"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={!form.customer.trim() || form.items.length === 0}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Place Order — ₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={handleGoBack}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </AnimatedCard>

                {/* Quick Tips */}
                <AnimatedCard delay={0.2}>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Tips</h3>
                    <ul className="text-xs text-muted-foreground/80 space-y-1.5">
                      <li className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        Search products by name or SKU
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        Adjust quantity with +/- buttons
                      </li>
                      {form.deliveryType === 'lalamove' && (
                        <>
                          <li className="flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            Pooling saves up to 30% on delivery fees
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            Priority matches faster but costs more
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </AnimatedCard>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* ─── Add Item Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Item to Order</DialogTitle>
            <DialogDescription>
              Search and select a product from inventory
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Product</Label>
              <div className="relative" data-product-combobox>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or SKU..."
                  className="pl-9 pr-8"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setSelectedProduct('');
                    setItemPrice('');
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                />
                {selectedProduct && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted transition-colors"
                    onClick={() => {
                      setSelectedProduct('');
                      setProductSearch('');
                      setItemPrice('');
                    }}
                  >
                    <span className="text-muted-foreground text-xs">✕</span>
                  </button>
                )}

                {showProductDropdown && !selectedProduct && (
                  <div className="absolute z-50 top-full mt-1 left-0 right-0 max-h-48 overflow-y-auto rounded-lg border bg-popover shadow-lg">
                    {filteredProducts.length === 0 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        No products found
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                          onClick={() => handleSelectProduct(product)}
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.id}</p>
                          </div>
                          <span className="text-sm font-semibold tabular-nums">₱{product.price.toFixed(2)}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit Price (₱)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
