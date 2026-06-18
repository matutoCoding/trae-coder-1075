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
  formatDuration
} from '@/utils/timeSlot';
import { calculateBilling } from '@/utils/billing';
import { checkTimeConflict, validateBookingTime } from '@/utils/conflict';

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
}

const STORAGE_KEY = 'booking_orders';

function loadOrders(): BookingOrder[] {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY);
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
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('[BookingStore] 保存订单失败', e);
  }
}

function generateOrderNo(): string {
  const now = dayjs();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GYM${now.format('YYYYMMDDHHmmss')}${random}`;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  orders: loadOrders(),
  venues: venues,
  rateTable: getDefaultRateTable(),
  selectedVenueId: venues[0]?.id || '',
  selectedDate: getCurrentDate(),
  selectedStartTime: '',
  selectedEndTime: '',

  setSelectedVenue: (venueId: string) => {
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

    return buildAvailableTimeSlots(venue.openTime, venue.closeTime, bookedSlots, state.rateTable);
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

    return calculateBilling(state.selectedStartTime, state.selectedEndTime, state.rateTable);
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

    const billing = calculateBilling(form.startTime, form.endTime, state.rateTable);

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
