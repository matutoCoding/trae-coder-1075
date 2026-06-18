import dayjs from 'dayjs';
import type { TimeSlot, DateOption, TimeSlotRate, RateType } from '@/types';

const RATE_NAMES: Record<RateType, string> = {
  peak: '高峰时段',
  normal: '平峰时段',
  'off-peak': '低峰时段',
  'public-welfare': '公益时段'
};

export function getRateName(rateType: RateType): string {
  return RATE_NAMES[rateType] || '平峰时段';
}

export function generateDateOptions(days: number = 7): DateOption[] {
  const options: DateOption[] = [];
  const today = dayjs();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  for (let i = 0; i < days; i++) {
    const date = today.add(i, 'day');
    options.push({
      date: date.format('YYYY-MM-DD'),
      dayOfWeek: weekDays[date.day()],
      dayText: i === 0 ? '今天' : date.format('MM/DD'),
      isToday: i === 0
    });
  }

  return options;
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number = 60
): Array<{ startTime: string; endTime: string }> {
  const slots: Array<{ startTime: string; endTime: string }> = [];
  let current = dayjs(`2000-01-01 ${startTime}`);
  const end = dayjs(`2000-01-01 ${endTime}`);

  while (current.isBefore(end)) {
    const next = current.add(intervalMinutes, 'minute');
    if (next.isAfter(end)) break;

    slots.push({
      startTime: current.format('HH:mm'),
      endTime: next.format('HH:mm')
    });

    current = next;
  }

  return slots;
}

export function getDefaultRateTable(): TimeSlotRate[] {
  return [
    { id: 'r1', startTime: '06:00', endTime: '09:00', rateType: 'off-peak', pricePerHour: 20 },
    { id: 'r2', startTime: '09:00', endTime: '12:00', rateType: 'normal', pricePerHour: 40 },
    { id: 'r3', startTime: '12:00', endTime: '14:00', rateType: 'public-welfare', pricePerHour: 0 },
    { id: 'r4', startTime: '14:00', endTime: '18:00', rateType: 'normal', pricePerHour: 40 },
    { id: 'r5', startTime: '18:00', endTime: '21:00', rateType: 'peak', pricePerHour: 60 },
    { id: 'r6', startTime: '21:00', endTime: '22:00', rateType: 'normal', pricePerHour: 40 }
  ];
}

export function getRateForTime(time: string, rateTable: TimeSlotRate[]): TimeSlotRate | null {
  const timeMinutes = timeToMinutes(time);

  for (const rate of rateTable) {
    const startMinutes = timeToMinutes(rate.startTime);
    const endMinutes = timeToMinutes(rate.endTime);

    if (timeMinutes >= startMinutes && timeMinutes < endMinutes) {
      return rate;
    }
  }

  return null;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function calculateDuration(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return Math.max(0, end - start);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}分钟`;
  } else if (mins === 0) {
    return `${hours}小时`;
  } else {
    return `${hours}小时${mins}分钟`;
  }
}

export function formatDateTime(date: string, time: string): string {
  return dayjs(`${date} ${time}`).format('YYYY-MM-DD HH:mm');
}

export function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  const t = timeToMinutes(time);
  const s = timeToMinutes(startTime);
  const e = timeToMinutes(endTime);
  return t >= s && t < e;
}

export function buildAvailableTimeSlots(
  openTime: string,
  closeTime: string,
  bookedSlots: Array<{ startTime: string; endTime: string }>,
  rateTable: TimeSlotRate[]
): TimeSlot[] {
  const baseSlots = generateTimeSlots(openTime, closeTime, 60);

  return baseSlots.map(slot => {
    const rate = getRateForTime(slot.startTime, rateTable);
    const isBooked = bookedSlots.some(
      booked =>
        timeToMinutes(slot.startTime) < timeToMinutes(booked.endTime) &&
        timeToMinutes(slot.endTime) > timeToMinutes(booked.startTime)
    );

    return {
      id: `${slot.startTime}-${slot.endTime}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: !isBooked,
      rateType: rate?.rateType || 'normal',
      pricePerHour: rate?.pricePerHour || 40
    };
  });
}

export function getCurrentDate(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function getCurrentTime(): string {
  return dayjs().format('HH:mm');
}

export function formatDate(dateStr: string): string {
  return dayjs(dateStr).format('YYYY年MM月DD日');
}
