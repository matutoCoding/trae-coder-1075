import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import VenueCard from '@/components/VenueCard';
import { categoryOptions, venues } from '@/data/venues';
import { getDefaultRateTable, getRateForTime, getCurrentTime } from '@/utils/timeSlot';
import type { VenueType } from '@/types';

const categoryIcons: Record<string, string> = {
  all: '🏟️',
  badminton: '🏸',
  basketball: '🏀',
  swimming: '🏊',
  'table-tennis': '🏓',
  tennis: '🎾',
  gym: '🏋️',
  yoga: '🧘'
};

const quickActions = [
  { icon: '📅', name: '快速预订', action: 'booking' },
  { icon: '📋', name: '我的订单', action: 'orders' },
  { icon: '💳', name: '公益时段', action: 'public' },
  { icon: '📍', name: '场馆导航', action: 'location' }
];

const HomePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<VenueType | 'all'>('all');

  const rateTable = useMemo(() => getDefaultRateTable(), []);
  const currentTime = getCurrentTime();

  const filteredVenues = useMemo(() => {
    if (selectedCategory === 'all') return venues;
    return venues.filter(v => v.type === selectedCategory);
  }, [selectedCategory]);

  const getCurrentPrice = (): number => {
    const rate = getRateForTime(currentTime, rateTable);
    return rate?.pricePerHour || 40;
  };

  const handleCategoryClick = (type: VenueType | 'all') => {
    setSelectedCategory(type);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'booking':
        Taro.switchTab({ url: '/pages/booking/index' });
        break;
      case 'orders':
        Taro.switchTab({ url: '/pages/orders/index' });
        break;
      case 'public':
        Taro.showToast({ title: '每日12:00-14:00为公益时段，免费开放', icon: 'none', duration: 2000 });
        break;
      case 'location':
        Taro.showToast({ title: '地图导航功能开发中', icon: 'none' });
        break;
    }
  };

  const handleViewAll = () => {
    Taro.switchTab({ url: '/pages/booking/index' });
  };

  const handlePublicWelfare = () => {
    Taro.showModal({
      title: '公益时段说明',
      content: '每日12:00-14:00为全民健身公益时段，所有场馆免费向公众开放。欢迎前来健身！',
      showCancel: false,
      confirmText: '我知道了'
    });
  };

  const handlePullDownRefresh = () => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  React.useEffect(() => {
    Taro.eventCenter.on('pullDownRefresh', handlePullDownRefresh);
    return () => {
      Taro.eventCenter.off('pullDownRefresh', handlePullDownRefresh);
    };
  }, []);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.headerContent}>
          <Text className={styles.title}>全民健身中心</Text>
          <Text className={styles.subtitle}>运动让生活更美好</Text>

          <View className={styles.searchBar} onClick={() => Taro.showToast({ title: '搜索功能开发中', icon: 'none' })}>
            <Text className={styles.searchIcon}>🔍</Text>
            <Text>搜索场馆、运动项目...</Text>
          </View>

          <View className={styles.quickActions}>
            {quickActions.map((action, index) => (
              <View
                key={index}
                className={styles.actionItem}
                onClick={() => handleQuickAction(action.action)}
              >
                <View className={styles.actionIcon}>{action.icon}</View>
                <Text>{action.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.categorySection}>
        <View className={styles.categoryCard}>
          <Text className={styles.sectionTitle}>运动项目</Text>
          <View className={styles.categoryList}>
            {categoryOptions.map((cat) => (
              <View
                key={cat.type}
                className={`${styles.categoryItem} ${selectedCategory === cat.type ? styles.active : ''}`}
                onClick={() => handleCategoryClick(cat.type)}
              >
                <View className={styles.categoryIcon}>
                  {categoryIcons[cat.type] || '🏟️'}
                </View>
                <Text className={styles.categoryName}>{cat.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.publicWelfareBanner}>
        <View className={styles.bannerContent}>
          <Text className={styles.bannerTitle}>🌟 公益时段免费开放</Text>
          <Text className={styles.bannerDesc}>每日12:00-14:00 所有场馆免费</Text>
        </View>
        <Button className={styles.bannerButton} onClick={handlePublicWelfare}>
          了解详情
        </Button>
      </View>

      <View className={styles.venueSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle2}>热门场馆</Text>
          <Text className={styles.viewAll} onClick={handleViewAll}>
            查看全部 ›
          </Text>
        </View>
        <View className={styles.venueList}>
          {filteredVenues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              pricePerHour={getCurrentPrice()}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
