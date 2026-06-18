import { create } from 'zustand';
import dayjs from 'dayjs';
import Taro from '@tarojs/taro';
import type {
  BookingOrder,
  BookingForm,
  BillingInfo,
  TimeSlot,
  ConflictResult,
  TimeSlotRate,
  Venue
} from '@/types';
import { mockOrders } from '@/data/orders';
import { venues } from '@/data/venues';
import {
  getDefaultRateTable,
  buildAvailableTimeSlots,
  getCurrentDate,
  validateRateTable
} from '@/utils/timeSlot';
import { calculateBilling } from '@/utils/billing';
import { checkTimeConflict, validateBookingTime } from '@/utils/conflict';

const STORAGE_KEY_ORDERS = 'booking_orders';
const STORAGE_KEY_RATES = 'booking_rate_table';
const STORAGE_KEY_VENUE = 'booking_selected_venue';

function loadOrders(): BookingOrder[] {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY_ORDERS);
    if (stored) {
      return JSON.parse(stored) as BookingOrder[];
    }
  } catch (e) {
    console.error('[BookingStore] 读取订单失败', e);
  }
  return [...mockOrders];
}

function saveOrders(orders: BookingOrder[]) {
  try {
    Taro.setStorageSync(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('[BookingStore] 保存订单失败', e);
  }
}

function loadRateTable(): TimeSlotRate[] {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY_RATES);
    if (stored) {
      return JSON.parse(stored) as TimeSlotRate[];
    }
  } catch (e) {
    console.error('[BookingStore] 读取费率表失败', e);
  }
  return getDefaultRateTable();
}

function saveRateTable(table: TimeSlotRate[]) {
  try {
    Taro.setStorageSync(STORAGE_KEY_RATES, JSON.stringify(table));
  } catch (e) {
    console.error('[BookingStore] 保存费率表失败', e);
  }
}

function loadSelectedVenue(): string {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY_VENUE);
    if (stored && typeof stored === 'string' && stored.trim() !== '') {
      const exists = venues.some(v => v.id === stored);
      if (exists) return stored;
    }
  } catch (e) {
    console.error('[BookingStore] 读取选中场馆失败', e);
  }
  return venues[0]?.id || '';
}

function saveSelectedVenue(venueId: string) {
  try {
    Taro.setStorageSync(STORAGE_KEY_VENUE, venueId);
  } catch (e) {
    console.error('[BookingStore] 保存选中场馆失败', e);
  }
}

function generateOrderNo(): string {
  const now = dayjs();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GYM${now.format('YYYYMMDDHHmmss')}${random}`;
}

interface BookingState {
  orders: BookingOrder[];
  venues: Venue[];
  rateTable: TimeSlotRate[];
  selectedVenueId: string;
  selectedDate: string;
  selectedStartTime: string;
  selectedEndTime: string;

  setSelectedVenue: (venueId: string) => void;
  setSelectedDate: (date: string) => void;
  setSelectedStartTime: (time: string) => void;
  setSelectedEndTime: (time: string) => void;

  getAvailableTimeSlots: (venueId: string, date: string) => TimeSlot[];
  getCurrentVenue: () => Venue | undefined;
  calculateBilling: () => BillingInfo;
  checkConflict: () => ConflictResult;
  createBooking: (form: BookingForm) => Promise<BookingOrder | null>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  getOrderById: (orderId: string) => BookingOrder | undefined;
  getMyOrders: () => BookingOrder[];
  resetSelection: () => void;

  addRate: (rate: TimeSlotRate) => { success: boolean; message: string };
  updateRate: (rate: TimeSlotRate) => { success: boolean; message: string };
  toggleRate: (rateId: string) => void;
  deleteRate: (rateId: string) => void;
  resetRateTable: () => void;
  getActiveRateTable: () => TimeSlotRate[];
  validateRate: (rate: TimeSlotRate, excludeId?: string) => { valid: boolean; message: string };
}

export const useBookingStore = create<BookingState>((set, get) => ({
  orders: loadOrders(),
  venues: venues,
  rateTable: loadRateTable(),
  selectedVenueId: loadSelectedVenue(),
  selectedDate: getCurrentDate(),
  selectedStartTime: '',
  selectedEndTime: '',

  setSelectedVenue: (venueId: string) => {
    saveSelectedVenue(venueId);
    set({ selectedVenueId: venueId, selectedStartTime: '', selectedEndTime: '' });
  },

  setSelectedDate: (date: string) => {
    set({ selectedDate: date, selectedStartTime: '', selectedEndTime: '' });
  },

  setSelectedStartTime: (time: string) => {
    const state = get();
    const venue = state.getCurrentVenue();
    if (!venue) return;

    const endTime = state.selectedEndTime;
    if (endTime) {
      const validation = validateBookingTime(time, endTime, venue.openTime, venue.closeTime);
      if (!validation.valid) {
        set({ selectedStartTime: time, selectedEndTime: '' });
        return;
      }
    }

    set({ selectedStartTime: time });
  },

  setSelectedEndTime: (time: string) => {
    set({ selectedEndTime: time });
  },

  getActiveRateTable: () => {
    return get().rateTable.filter(r => r.enabled !== false);
  },

  getAvailableTimeSlots: (venueId: string, date: string) => {
    const state = get();
    const venue = state.venues.find(v => v.id === venueId);
    if (!venue) return [];

    const bookedSlots = state.orders
      .filter(
        o =>
          o.venueId === venueId &&
          o.date === date &&
          o.status !== 'cancelled' &&
          o.status !== 'refunded'
      )
      .map(o => ({ startTime: o.startTime, endTime: o.endTime }));

    const activeRates = state.getActiveRateTable();
    return buildAvailableTimeSlots(venue.openTime, venue.closeTime, bookedSlots, activeRates);
  },

  getCurrentVenue: () => {
    const state = get();
    return state.venues.find(v => v.id === state.selectedVenueId);
  },

  calculateBilling: () => {
    const state = get();
    if (!state.selectedStartTime || !state.selectedEndTime) {
      return {
        segments: [],
        totalDuration: 0,
        totalAmount: 0,
        discountAmount: 0,
        finalAmount: 0
      };
    }

    const activeRates = state.getActiveRateTable();
    return calculateBilling(state.selectedStartTime, state.selectedEndTime, activeRates);
  },

  checkConflict: () => {
    const state = get();
    if (!state.selectedVenueId || !state.selectedDate || !state.selectedStartTime || !state.selectedEndTime) {
      return { hasConflict: false, conflictOrders: [], message: '' };
    }

    const venueOrders = state.orders.filter(
      o => o.venueId === state.selectedVenueId && o.date === state.selectedDate
    );

    return checkTimeConflict(state.selectedStartTime, state.selectedEndTime, venueOrders);
  },

  validateRate: (rate: TimeSlotRate, excludeId?: string) => {
    const result = validateRateTable(rate, get().rateTable, excludeId);
    return { valid: result.valid, message: result.message };
  },

  addRate: (rate: TimeSlotRate) => {
    const state = get();
    const validation = validateRateTable(rate, state.rateTable);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const newRate: TimeSlotRate = {
      ...rate,
      id: rate.id || `r${Date.now()}`,
      enabled: rate.enabled !== false
    };

    const newTable = [...state.rateTable, newRate].sort(
      (a, b) => a.startTime.localeCompare(b.startTime)
    );
    set({ rateTable: newTable });
    saveRateTable(newTable);
    return { success: true, message: '添加成功' };
  },

  updateRate: (rate: TimeSlotRate) => {
    const state = get();
    const validation = validateRateTable(rate, state.rateTable, rate.id);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const newTable = state.rateTable
      .map(r => (r.id === rate.id ? { ...r, ...rate } : r))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    set({ rateTable: newTable });
    saveRateTable(newTable);
    return { success: true, message: '更新成功' };
  },

  toggleRate: (rateId: string) => {
    const state = get();
    const newTable = state.rateTable.map(r =>
      r.id === rateId ? { ...r, enabled: r.enabled === false ? true : false } : r
    );
    set({ rateTable: newTable });
    saveRateTable(newTable);
  },

  deleteRate: (rateId: string) => {
    const state = get();
    const newTable = state.rateTable.filter(r => r.id !== rateId);
    set({ rateTable: newTable });
    saveRateTable(newTable);
  },

  resetRateTable: () => {
    const defaultTable = getDefaultRateTable();
    set({ rateTable: defaultTable });
    saveRateTable(defaultTable);
  },

  createBooking: async (form: BookingForm) => {
    console.log('[BookingStore] 创建预订', form);

    const state = get();
    const venue = state.venues.find(v => v.id === form.venueId);

    if (!venue) {
      console.error('[BookingStore] 场馆不存在');
      return null;
    }

    const timeValidation = validateBookingTime(
      form.startTime,
      form.endTime,
      venue.openTime,
      venue.closeTime
    );
    if (!timeValidation.valid) {
      console.error('[BookingStore] 时间验证失败', timeValidation.message);
      return null;
    }

    const venueOrders = state.orders.filter(
      o => o.venueId === form.venueId && o.date === form.date
    );
    const conflict = checkTimeConflict(form.startTime, form.endTime, venueOrders);
    if (conflict.hasConflict) {
      console.error('[BookingStore] 时段冲突', conflict.message);
      return null;
    }

    const activeRates = state.getActiveRateTable();
    const billing = calculateBilling(form.startTime, form.endTime, activeRates);

    const newOrder: BookingOrder = {
      id: `o${Date.now()}`,
      orderNo: generateOrderNo(),
      venueId: form.venueId,
      venueName: venue.name,
      venueImage: venue.image,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      status: 'confirmed',
      statusText: '已确认',
      billing,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      remark: form.remark,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm')
    };

    const updatedOrders = [...state.orders, newOrder];
    set({ orders: updatedOrders });
    saveOrders(updatedOrders);

    console.log('[BookingStore] 预订创建成功', { orderId: newOrder.id, amount: billing.finalAmount });
    return newOrder;
  },

  cancelOrder: async (orderId: string) => {
    console.log('[BookingStore] 取消订单', orderId);

    const state = get();
    const orderIndex = state.orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      console.error('[BookingStore] 订单不存在');
      return false;
    }

    const order = state.orders[orderIndex];
    if (order.status === 'cancelled' || order.status === 'refunded') {
      console.warn('[BookingStore] 订单已取消或已退款');
      return false;
    }

    const updatedOrders = [...state.orders];
    updatedOrders[orderIndex] = {
      ...order,
      status: 'cancelled',
      statusText: '已取消',
      cancelledAt: dayjs().format('YYYY-MM-DD HH:mm')
    };

    set({ orders: updatedOrders });
    saveOrders(updatedOrders);

    console.log('[BookingStore] 订单取消成功，时段已释放', { orderId, time: order.startTime + '-' + order.endTime });
    return true;
  },

  getOrderById: (orderId: string) => {
    return get().orders.find(o => o.id === orderId);
  },

  getMyOrders: () => {
    return get().orders.sort((a, b) => {
      const dateA = dayjs(`${a.date} ${a.startTime}`);
      const dateB = dayjs(`${b.date} ${b.startTime}`);
      return dateB.valueOf() - dateA.valueOf();
    });
  },

  resetSelection: () => {
    set({
      selectedStartTime: '',
      selectedEndTime: ''
    });
  }
}));
