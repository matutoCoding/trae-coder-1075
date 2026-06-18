import dayjs from 'dayjs';
import type { BookingOrder, OrderStatus } from '@/types';

const statusTextMap: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款'
};

const today = dayjs();
const tomorrow = dayjs().add(1, 'day');
const yesterday = dayjs().subtract(1, 'day');
const dayBefore = dayjs().subtract(2, 'day');

export const mockOrders: BookingOrder[] = [
  {
    id: 'o001',
    orderNo: 'GYM20260618001',
    venueId: 'v001',
    venueName: '主羽毛球馆',
    venueImage: 'https://picsum.photos/id/1060/750/500',
    date: today.format('YYYY-MM-DD'),
    startTime: '19:00',
    endTime: '21:00',
    status: 'confirmed',
    statusText: statusTextMap.confirmed,
    billing: {
      segments: [
        {
          startTime: '19:00',
          endTime: '21:00',
          duration: 120,
          rateType: 'peak',
          rateName: '高峰时段',
          pricePerHour: 60,
          subtotal: 120
        }
      ],
      totalDuration: 120,
      totalAmount: 120,
      discountAmount: 0,
      finalAmount: 120
    },
    contactName: '张三',
    contactPhone: '138****8888',
    remark: '需要4号场地',
    createdAt: yesterday.format('YYYY-MM-DD HH:mm'),
  },
  {
    id: 'o002',
    orderNo: 'GYM20260618002',
    venueId: 'v003',
    venueName: '室内恒温泳池',
    venueImage: 'https://picsum.photos/id/1039/750/500',
    date: tomorrow.format('YYYY-MM-DD'),
    startTime: '08:00',
    endTime: '10:00',
    status: 'pending',
    statusText: statusTextMap.pending,
    billing: {
      segments: [
        {
          startTime: '08:00',
          endTime: '09:00',
          duration: 60,
          rateType: 'off-peak',
          rateName: '低峰时段',
          pricePerHour: 20,
          subtotal: 20
        },
        {
          startTime: '09:00',
          endTime: '10:00',
          duration: 60,
          rateType: 'normal',
          rateName: '平峰时段',
          pricePerHour: 40,
          subtotal: 40
        }
      ],
      totalDuration: 120,
      totalAmount: 60,
      discountAmount: 0,
      finalAmount: 60
    },
    contactName: '李四',
    contactPhone: '139****9999',
    createdAt: today.format('YYYY-MM-DD HH:mm'),
  },
  {
    id: 'o003',
    orderNo: 'GYM20260618003',
    venueId: 'v002',
    venueName: '篮球主馆',
    venueImage: 'https://picsum.photos/id/1058/750/500',
    date: dayBefore.format('YYYY-MM-DD'),
    startTime: '18:00',
    endTime: '20:00',
    status: 'completed',
    statusText: statusTextMap.completed,
    billing: {
      segments: [
        {
          startTime: '18:00',
          endTime: '20:00',
          duration: 120,
          rateType: 'peak',
          rateName: '高峰时段',
          pricePerHour: 60,
          subtotal: 120
        }
      ],
      totalDuration: 120,
      totalAmount: 120,
      discountAmount: 0,
      finalAmount: 120
    },
    contactName: '王五',
    contactPhone: '137****7777',
    createdAt: dayBefore.subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
  },
  {
    id: 'o004',
    orderNo: 'GYM20260618004',
    venueId: 'v001',
    venueName: '主羽毛球馆',
    venueImage: 'https://picsum.photos/id/1060/750/500',
    date: today.format('YYYY-MM-DD'),
    startTime: '14:00',
    endTime: '16:00',
    status: 'confirmed',
    statusText: statusTextMap.confirmed,
    billing: {
      segments: [
        {
          startTime: '14:00',
          endTime: '16:00',
          duration: 120,
          rateType: 'normal',
          rateName: '平峰时段',
          pricePerHour: 40,
          subtotal: 80
        }
      ],
      totalDuration: 120,
      totalAmount: 80,
      discountAmount: 0,
      finalAmount: 80
    },
    contactName: '赵六',
    contactPhone: '136****6666',
    createdAt: yesterday.format('YYYY-MM-DD HH:mm'),
  },
  {
    id: 'o005',
    orderNo: 'GYM20260618005',
    venueId: 'v006',
    venueName: '综合健身房',
    venueImage: 'https://picsum.photos/id/1060/750/500',
    date: yesterday.format('YYYY-MM-DD'),
    startTime: '12:00',
    endTime: '14:00',
    status: 'cancelled',
    statusText: statusTextMap.cancelled,
    billing: {
      segments: [
        {
          startTime: '12:00',
          endTime: '14:00',
          duration: 120,
          rateType: 'public-welfare',
          rateName: '公益时段',
          pricePerHour: 0,
          subtotal: 0
        }
      ],
      totalDuration: 120,
      totalAmount: 0,
      discountAmount: 0,
      finalAmount: 0
    },
    contactName: '孙七',
    contactPhone: '135****5555',
    remark: '临时有事取消',
    createdAt: dayBefore.format('YYYY-MM-DD HH:mm'),
    cancelledAt: yesterday.format('YYYY-MM-DD HH:mm'),
  },
  {
    id: 'o006',
    orderNo: 'GYM20260618006',
    venueId: 'v004',
    venueName: '乒乓球馆',
    venueImage: 'https://picsum.photos/id/1060/750/500',
    date: today.format('YYYY-MM-DD'),
    startTime: '17:00',
    endTime: '19:00',
    status: 'confirmed',
    statusText: statusTextMap.confirmed,
    billing: {
      segments: [
        {
          startTime: '17:00',
          endTime: '18:00',
          duration: 60,
          rateType: 'normal',
          rateName: '平峰时段',
          pricePerHour: 40,
          subtotal: 40
        },
        {
          startTime: '18:00',
          endTime: '19:00',
          duration: 60,
          rateType: 'peak',
          rateName: '高峰时段',
          pricePerHour: 60,
          subtotal: 60
        }
      ],
      totalDuration: 120,
      totalAmount: 100,
      discountAmount: 0,
      finalAmount: 100
    },
    contactName: '周八',
    contactPhone: '134****4444',
    createdAt: yesterday.format('YYYY-MM-DD HH:mm'),
  }
];

export function getOrderById(id: string): BookingOrder | undefined {
  return mockOrders.find(o => o.id === id);
}

export function getOrdersByStatus(status?: OrderStatus): BookingOrder[] {
  if (!status) return mockOrders;
  return mockOrders.filter(o => o.status === status);
}

export function getOrdersByVenueAndDate(venueId: string, date: string): BookingOrder[] {
  return mockOrders.filter(
    o => o.venueId === venueId && o.date === date &&
    o.status !== 'cancelled' && o.status !== 'refunded'
  );
}
