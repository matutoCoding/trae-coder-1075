import type { BillingInfo, BillingSegment, TimeSlotRate } from '@/types';
import { getRateName, timeToMinutes, minutesToTime, calculateDuration } from './timeSlot';

export function calculateBilling(
  startTime: string,
  endTime: string,
  rateTable: TimeSlotRate[]
): BillingInfo {
  console.log('[Billing] 开始计算费用', { startTime, endTime });

  const segments: BillingSegment[] = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes >= endMinutes) {
    console.warn('[Billing] 结束时间必须晚于开始时间');
    return {
      segments: [],
      totalDuration: 0,
      totalAmount: 0,
      discountAmount: 0,
      finalAmount: 0
    };
  }

  const sortedRates = [...rateTable].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  let currentMinute = startMinutes;

  while (currentMinute < endMinutes) {
    const currentTime = minutesToTime(currentMinute);
    const currentRate = findRateForTime(currentTime, sortedRates);

    if (!currentRate) {
      currentMinute += 60;
      continue;
    }

    const rateEndMinutes = timeToMinutes(currentRate.endTime);
    const segmentEndMinutes = Math.min(rateEndMinutes, endMinutes);
    const segmentDuration = segmentEndMinutes - currentMinute;
    const segmentDurationHours = segmentDuration / 60;
    const subtotal = Number((segmentDurationHours * currentRate.pricePerHour).toFixed(2));

    segments.push({
      startTime: minutesToTime(currentMinute),
      endTime: minutesToTime(segmentEndMinutes),
      duration: segmentDuration,
      rateType: currentRate.rateType,
      rateName: getRateName(currentRate.rateType),
      pricePerHour: currentRate.pricePerHour,
      subtotal
    });

    currentMinute = segmentEndMinutes;
  }

  const totalDuration = calculateDuration(startTime, endTime);
  const totalAmount = Number(
    segments.reduce((sum, seg) => sum + seg.subtotal, 0).toFixed(2)
  );

  const discountAmount = 0;
  const finalAmount = Number((totalAmount - discountAmount).toFixed(2));

  console.log('[Billing] 费用计算完成', {
    totalDuration,
    totalAmount,
    segmentsCount: segments.length,
    finalAmount
  });

  return {
    segments,
    totalDuration,
    totalAmount,
    discountAmount,
    finalAmount
  };
}

function findRateForTime(time: string, sortedRates: TimeSlotRate[]): TimeSlotRate | null {
  const timeMinutes = timeToMinutes(time);

  for (const rate of sortedRates) {
    const startMinutes = timeToMinutes(rate.startTime);
    const endMinutes = timeToMinutes(rate.endTime);

    if (timeMinutes >= startMinutes && timeMinutes < endMinutes) {
      return rate;
    }
  }

  return null;
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return '免费';
  return `¥${amount.toFixed(2)}`;
}

export function formatPrice(amount: number): string {
  if (amount === 0) return '免费';
  return `¥${amount}`;
}

export function getBillingSummary(billing: BillingInfo): string {
  const hours = Math.floor(billing.totalDuration / 60);
  const minutes = billing.totalDuration % 60;
  return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
}

export function isPublicWelfareTime(
  startTime: string,
  endTime: string,
  rateTable: TimeSlotRate[]
): boolean {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  for (const rate of rateTable) {
    if (rate.rateType === 'public-welfare') {
      const rateStartMin = timeToMinutes(rate.startTime);
      const rateEndMin = timeToMinutes(rate.endTime);
      if (startMin >= rateStartMin && endMin <= rateEndMin) {
        return true;
      }
    }
  }

  return false;
}
