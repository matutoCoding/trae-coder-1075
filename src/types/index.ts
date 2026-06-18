// 场馆类型
export type VenueType = 'badminton' | 'basketball' | 'swimming' | 'table-tennis' | 'tennis' | 'gym' | 'yoga';

// 场馆信息
export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  description: string;
  capacity: number;
  address: string;
  image: string;
  facilities: string[];
  openTime: string;
  closeTime: string;
}

// 费率类型
export type RateType = 'peak' | 'normal' | 'off-peak' | 'public-welfare';

// 时段费率
export interface TimeSlotRate {
  id: string;
  startTime: string;
  endTime: string;
  rateType: RateType;
  pricePerHour: number;
}

// 时段信息
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  rateType: RateType;
  pricePerHour: number;
}

// 订单状态
export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';

// 分段计费明细
export interface BillingSegment {
  startTime: string;
  endTime: string;
  duration: number;
  rateType: RateType;
  rateName: string;
  pricePerHour: number;
  subtotal: number;
}

// 账单信息
export interface BillingInfo {
  segments: BillingSegment[];
  totalDuration: number;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

// 订单信息
export interface BookingOrder {
  id: string;
  orderNo: string;
  venueId: string;
  venueName: string;
  venueImage: string;
  date: string;
  startTime: string;
  endTime: string;
  status: OrderStatus;
  statusText: string;
  billing: BillingInfo;
  contactName: string;
  contactPhone: string;
  remark?: string;
  createdAt: string;
  cancelledAt?: string;
  refundedAt?: string;
}

// 预订表单
export interface BookingForm {
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  contactName: string;
  contactPhone: string;
  remark?: string;
}

// 日期选项
export interface DateOption {
  date: string;
  dayOfWeek: string;
  dayText: string;
  isToday: boolean;
}

// 分类选项
export interface CategoryOption {
  type: VenueType | 'all';
  name: string;
}

// 冲突检测结果
export interface ConflictResult {
  hasConflict: boolean;
  conflictOrders: BookingOrder[];
  message: string;
}
