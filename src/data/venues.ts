import type { Venue, VenueType, CategoryOption } from '@/types';

export const categoryOptions: CategoryOption[] = [
  { type: 'all', name: '全部' },
  { type: 'badminton', name: '羽毛球' },
  { type: 'basketball', name: '篮球' },
  { type: 'swimming', name: '游泳' },
  { type: 'table-tennis', name: '乒乓球' },
  { type: 'tennis', name: '网球' },
  { type: 'gym', name: '健身房' },
  { type: 'yoga', name: '瑜伽' }
];

export const venueTypeNames: Record<VenueType, string> = {
  badminton: '羽毛球馆',
  basketball: '篮球馆',
  swimming: '游泳馆',
  'table-tennis': '乒乓球馆',
  tennis: '网球馆',
  gym: '健身房',
  yoga: '瑜伽馆'
};

export const venues: Venue[] = [
  {
    id: 'v001',
    name: '主羽毛球馆',
    type: 'badminton',
    description: '专业羽毛球场地，拥有8片标准羽毛球场，采用专业木地板和灯光系统，适合训练和比赛使用。',
    capacity: 16,
    address: '全民健身中心A馆1层',
    image: 'https://picsum.photos/id/1060/750/500',
    facilities: ['空调', '更衣室', '淋浴', '储物柜', '饮水处'],
    openTime: '06:00',
    closeTime: '22:00'
  },
  {
    id: 'v002',
    name: '篮球主馆',
    type: 'basketball',
    description: '标准室内篮球场，采用专业运动地板，配备电子计分牌，可承办各类篮球赛事。',
    capacity: 50,
    address: '全民健身中心B馆2层',
    image: 'https://picsum.photos/id/1058/750/500',
    facilities: ['空调', '更衣室', '淋浴', '电子计分', '观众席'],
    openTime: '06:00',
    closeTime: '22:00'
  },
  {
    id: 'v003',
    name: '室内恒温泳池',
    type: 'swimming',
    description: '25米标准短道泳池，8条泳道，水温常年保持26-28度，配备专业救生员。',
    capacity: 80,
    address: '全民健身中心C馆1层',
    image: 'https://picsum.photos/id/1039/750/500',
    facilities: ['恒温', '救生员', '更衣室', '淋浴', '储物柜'],
    openTime: '06:00',
    closeTime: '21:00'
  },
  {
    id: 'v004',
    name: '乒乓球馆',
    type: 'table-tennis',
    description: '12张标准乒乓球台，专业塑胶地面，适合各水平段乒乓球爱好者。',
    capacity: 24,
    address: '全民健身中心A馆2层',
    image: 'https://picsum.photos/id/1060/750/500',
    facilities: ['空调', '更衣室', '饮水处', '休息区'],
    openTime: '06:00',
    closeTime: '22:00'
  },
  {
    id: 'v005',
    name: '网球馆',
    type: 'tennis',
    description: '室内网球场，专业网球场地，配备专业照明系统，全天候可用。',
    capacity: 8,
    address: '全民健身中心D馆',
    image: 'https://picsum.photos/id/1058/750/500',
    facilities: ['空调', '更衣室', '淋浴', '专业灯光'],
    openTime: '06:00',
    closeTime: '22:00'
  },
  {
    id: 'v006',
    name: '综合健身房',
    type: 'gym',
    description: '配备有氧器械、力量器械、自由重量区等多种健身设备，满足全方位健身需求。',
    capacity: 100,
    address: '全民健身中心B馆1层',
    image: 'https://picsum.photos/id/1060/750/500',
    facilities: ['空调', '更衣室', '淋浴', '储物柜', '饮水机'],
    openTime: '06:00',
    closeTime: '22:00'
  },
  {
    id: 'v007',
    name: '瑜伽室',
    type: 'yoga',
    description: '专业瑜伽教室，配备瑜伽垫、瑜伽砖等辅具，环境安静舒适，适合瑜伽练习。',
    capacity: 20,
    address: '全民健身中心A馆3层',
    image: 'https://picsum.photos/id/1039/750/500',
    facilities: ['空调', '瑜伽垫', '瑜伽砖', '镜子', '休息区'],
    openTime: '06:00',
    closeTime: '21:00'
  },
  {
    id: 'v008',
    name: '羽毛球副馆',
    type: 'badminton',
    description: '副羽毛球馆，4片标准场地，环境舒适，适合休闲运动和初学者。',
    capacity: 8,
    address: '全民健身中心C馆2层',
    image: 'https://picsum.photos/id/1060/750/500',
    facilities: ['空调', '更衣室', '淋浴', '储物柜'],
    openTime: '08:00',
    closeTime: '22:00'
  }
];

export function getVenueById(id: string): Venue | undefined {
  return venues.find(v => v.id === id);
}

export function getVenuesByType(type: VenueType | 'all'): Venue[] {
  if (type === 'all') return venues;
  return venues.filter(v => v.type === type);
}
