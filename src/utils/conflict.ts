import type { BookingOrder, ConflictResult } from '@/types';
import { timeToMinutes } from './timeSlot';

export function checkTimeConflict(
  startTime: string,
  endTime: string,
  existingBookings: BookingOrder[],
  excludeOrderId?: string
): ConflictResult {
  console.log('[Conflict] 开始检测时段冲突', { startTime, endTime, existingCount: existingBookings.length });

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  const conflictOrders = existingBookings.filter(order => {
    if (excludeOrderId && order.id === excludeOrderId) return false;
    if (order.status === 'cancelled' || order.status === 'refunded') return false;

    const orderStartMin = timeToMinutes(order.startTime);
    const orderEndMin = timeToMinutes(order.endTime);

    return startMin < orderEndMin && endMin > orderStartMin;
  });

  const hasConflict = conflictOrders.length > 0;

  let message = '';
  if (hasConflict) {
    const times = conflictOrders.map(o => `${o.startTime}-${o.endTime}`).join('、');
    message = `该时段与已有预订冲突（${times}），请选择其他时段`;
  }

  console.log('[Conflict] 冲突检测结果', { hasConflict, conflictCount: conflictOrders.length, message });

  return {
    hasConflict,
    conflictOrders,
    message
  };
}

export function isSlotBooked(
  slotStartTime: string,
  slotEndTime: string,
  bookings: BookingOrder[]
): boolean {
  const slotStart = timeToMinutes(slotStartTime);
  const slotEnd = timeToMinutes(slotEndTime);

  return bookings.some(order => {
    if (order.status === 'cancelled' || order.status === 'refunded') return false;
    const orderStart = timeToMinutes(order.startTime);
    const orderEnd = timeToMinutes(order.endTime);
    return slotStart < orderEnd && slotEnd > orderStart;
  });
}

export function getBookedSlotsForDate(
  venueId: string,
  date: string,
  allOrders: BookingOrder[]
): Array<{ startTime: string; endTime: string }> {
  return allOrders
    .filter(
      order =>
        order.venueId === venueId &&
        order.date === date &&
        order.status !== 'cancelled' &&
        order.status !== 'refunded'
    )
    .map(order => ({
      startTime: order.startTime,
      endTime: order.endTime
    }));
}

export function validateBookingTime(
  startTime: string,
  endTime: string,
  openTime: string,
  closeTime: string
): { valid: boolean; message: string } {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const openMin = timeToMinutes(openTime);
  const closeMin = timeToMinutes(closeTime);

  if (startMin >= endMin) {
    return { valid: false, message: '结束时间必须晚于开始时间' };
  }

  if (startMin < openMin) {
    return { valid: false, message: `开始时间不能早于开馆时间 ${openTime}` };
  }

  if (endMin > closeMin) {
    return { valid: false, message: `结束时间不能晚于闭馆时间 ${closeTime}` };
  }

  return { valid: true, message: '' };
}
