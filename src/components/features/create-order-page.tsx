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
import { OrderStatusStepper, type OrderStatus } from '@/components/shared/order-status-stepper';
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

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderForm {
  customer: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryType: 'truck' | 'lalamove';
  scheduleDate: string;
  scheduleTime: string;
  notes: string;
  items: OrderItem[];
}

const TAX_RATE = 0.08;

let itemIdCounter = 0;
function generateItemId() {
  itemIdCounter++;
  return `item-${Date.now()}-${itemIdCounter}`;
}

export default function CreateOrderPage() {
  const setCurrentView = useNavigationStore((s) => s.setCurrentView);
  const returnTo = usePageContext((s) => s.returnTo);

  const [form, setForm] = useState<OrderForm>({
    customer: '',
    priority: 'medium',
    status: 'pending',
    deliveryType: 'truck',
    scheduleDate: '',
    scheduleTime: '',
    notes: '',
    items: [],
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
  const total = subtotal + tax;

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

    // Check if product already added
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

    // Calculate total items count and total
    const totalItems = form.items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = form.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const tax = subtotal * TAX_RATE;
    const orderTotal = parseFloat((subtotal + tax).toFixed(2));

    // Generate new order ID
    const maxNum = 2847; // from mock data
    const newId = `ORD-${maxNum + 1}`;

    // Dispatch custom event with order data so orders-page can pick it up
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
        scheduleDate: form.scheduleDate,
        scheduleTime: form.scheduleTime,
        orderItems: form.items.map((i) => ({
          name: i.name,
          productId: i.productId,
          qty: i.quantity,
          price: i.unitPrice,
        })),
      },
    });
    window.dispatchEvent(orderEvent);

    toast.success(`Order ${newId} created successfully for ${form.customer.trim()}`);
    setCurrentView(returnTo === 'orders' ? 'orders' : 'orders');
  }, [form, returnTo, setCurrentView]);

  const handleGoBack = useCallback(() => {
    setCurrentView(returnTo === 'orders' ? 'orders' : 'orders');
  }, [returnTo, setCurrentView]);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Back Button + Header */}
        <FadeIn>
          <div className="flex items-center gap-4">
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
            <Button
              className="gap-2"
              onClick={handleSubmit}
              disabled={!form.customer.trim() || form.items.length === 0}
            >
              <Package className="h-4 w-4" />
              Place Order
            </Button>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Customer Info + Items */}
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

                        {/* Customer dropdown */}
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

                      {/* Selected customer info card */}
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
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Order Status</Label>
                      <OrderStatusStepper
                        currentStatus={form.status as OrderStatus}
                        onChangeStatus={(v) => setForm((f) => ({ ...f, status: v as OrderForm['status'] }))}
                        interactive={true}
                        size="sm"
                      />
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
                    <div className="space-y-2">
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
                          {form.scheduleDate
                            ? `Scheduled for ${form.scheduleDate}`
                            : 'No date set'}
                          {form.scheduleTime ? ` at ${form.scheduleTime}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
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
                      {/* Header row */}
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
                                {/* Product */}
                                <div className="col-span-5 sm:col-span-5 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">{item.productId}</p>
                                </div>

                                {/* Quantity */}
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

                                {/* Unit Price */}
                                <div className="col-span-3 sm:col-span-3 text-right text-sm tabular-nums">
                                  ${item.unitPrice.toFixed(2)}
                                </div>

                                {/* Line Total + Remove */}
                                <div className="col-span-2 flex items-center justify-end gap-2">
                                  <span className="text-sm font-semibold tabular-nums">
                                    ${(item.quantity * item.unitPrice).toFixed(2)}
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
                        <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Tax ({(TAX_RATE * 100).toFixed(0)}%)
                        </span>
                        <span className="tabular-nums">${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="tabular-nums text-green-600 dark:text-green-400 font-medium">
                          Free
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span className="tabular-nums">${total.toFixed(2)}</span>
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
                      Place Order — ${total.toFixed(2)}
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
                      <li className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        Hover over items to remove them
                      </li>
                    </ul>
                  </div>
                </AnimatedCard>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Add Item Dialog */}
        <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Add Order Item</DialogTitle>
              <DialogDescription>
                Search and select a product from inventory to add to this order.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Product Search/Dropdown */}
              <div className="space-y-2">
                <Label>Product <span className="text-destructive">*</span></Label>
                <div className="relative" data-product-combobox>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or SKU..."
                    className="pl-9 pr-8"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setSelectedProduct('');
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
                  
                  {/* Product dropdown */}
                  {showProductDropdown && !selectedProduct && (
                    <div className="absolute z-50 top-full mt-1 left-0 right-0 max-h-64 overflow-y-auto rounded-lg border bg-popover shadow-lg">
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No products found
                        </div>
                      ) : (
                        filteredProducts.map((product) => (
                          <button
                            key={product.id}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                            onClick={() => handleSelectProduct(product)}
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.id} · {product.category}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold tabular-nums">${product.price.toFixed(2)}</p>
                              <p className={`text-xs ${product.stock === 0 ? 'text-red-500' : product.stock < 10 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                                {product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedProduct && (
                  <div className="rounded-lg border bg-muted/30 p-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{inventoryItems.find((p) => p.id === selectedProduct)?.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedProduct}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Quantity + Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-qty">Quantity</Label>
                  <Input
                    id="item-qty"
                    type="number"
                    min="1"
                    step="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-price">Unit Price ($)</Label>
                  <Input
                    id="item-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Line Total Preview */}
              {selectedProduct && itemQty && itemPrice && Number(itemQty) > 0 && Number(itemPrice) > 0 && (
                <div className="rounded-lg border bg-primary/5 p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Line Total</span>
                  <span className="text-base font-bold tabular-nums">
                    ${(Number(itemQty) * Number(itemPrice)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add to Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
