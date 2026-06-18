import React, { useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useBookingStore } from '@/store/useBookingStore';

const MinePage: React.FC = () => {
  const orders = useBookingStore(state => state.orders);

  const stats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const totalHours = orders.reduce((sum, o) => sum + o.billing.totalDuration, 0) / 60;
    return { total, active, completed, totalHours: totalHours.toFixed(1) };
  }, [orders]);

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'orders':
        Taro.switchTab({ url: '/pages/orders/index' });
        break;
      case 'rate':
        Taro.navigateTo({ url: '/pages/rate-manage/index' });
        break;
      case 'public':
        Taro.showModal({
          title: '公益时段说明',
          content: '每日12:00-14:00为全民健身公益时段，所有场馆免费向公众开放。欢迎前来健身！',
          showCancel: false,
          confirmText: '我知道了'
        });
        break;
      case 'about':
        Taro.showToast({ title: '关于我们', icon: 'none' });
        break;
      case 'settings':
        Taro.showToast({ title: '设置功能开发中', icon: 'none' });
        break;
      case 'feedback':
        Taro.showToast({ title: '意见反馈开发中', icon: 'none' });
        break;
      default:
        break;
    }
  };

  const menuItems1 = [
    { icon: '📋', text: '我的订单', action: 'orders' },
    { icon: '💰', text: '费率管理', action: 'rate' },
    { icon: '💝', text: '公益时段', action: 'public' }
  ];

  const menuItems2 = [
    { icon: '⚙️', text: '设置', action: 'settings' },
    { icon: '💬', text: '意见反馈', action: 'feedback' },
    { icon: 'ℹ️', text: '关于我们', action: 'about' }
  ];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>🏃</View>
          <View className={styles.userText}>
            <Text className={styles.userName}>运动爱好者</Text>
            <Text className={styles.userDesc}>全民健身 · 快乐运动</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{stats.total}</Text>
            <Text className={styles.statLabel}>总订单</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{stats.active}</Text>
            <Text className={styles.statLabel}>进行中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{stats.completed}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{stats.totalHours}h</Text>
            <Text className={styles.statLabel}>运动时长</Text>
          </View>
        </View>
      </View>

      <View className={styles.rateSection}>
        <View className={styles.rateContent}>
          <Text className={styles.rateTitle}>🎯 了解时段费率</Text>
          <Text className={styles.rateDesc}>高峰平峰不同价，公益时段免费</Text>
        </View>
        <Button
          className={styles.rateButton}
          onClick={() => handleMenuClick('rate')}
        >
          查看详情
        </Button>
      </View>

      <View className={styles.menuSection}>
        <Text className={styles.sectionTitle}>我的服务</Text>
        {menuItems1.map((item, index) => (
          <View
            key={index}
            className={styles.menuItem}
            onClick={() => handleMenuClick(item.action)}
          >
            <View className={styles.menuIcon}>{item.icon}</View>
            <Text className={styles.menuText}>{item.text}</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        ))}
      </View>

      <View className={styles.menuSection}>
        <Text className={styles.sectionTitle}>其他</Text>
        {menuItems2.map((item, index) => (
          <View
            key={index}
            className={styles.menuItem}
            onClick={() => handleMenuClick(item.action)}
          >
            <View className={styles.menuIcon}>{item.icon}</View>
            <Text className={styles.menuText}>{item.text}</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        ))}
      </View>

      <View className={styles.footer}>
        <Text>全民健身中心 v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

export default MinePage;
