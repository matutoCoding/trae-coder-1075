import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import OrderCard from '@/components/OrderCard';
import { useBookingStore } from '@/store/useBookingStore';
import type { OrderStatus, BookingOrder } from '@/types';

interface TabOption {
  key: OrderStatus | 'all';
  label: string;
}

const tabOptions: TabOption[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待确认' },
  { key: 'confirmed', label: '已确认' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' }
];

const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const orders = useBookingStore(state => state.orders);
  const cancelOrder = useBookingStore(state => state.cancelOrder);

  const allOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.startTime}`).getTime();
      const dateB = new Date(`${b.date} ${b.startTime}`).getTime();
      return dateB - dateA;
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return allOrders;
    return allOrders.filter(o => o.status === activeTab);
  }, [allOrders, activeTab]);

  const stats = useMemo(() => {
    const total = allOrders.length;
    const active = allOrders.filter(
      o => o.status === 'pending' || o.status === 'confirmed'
    ).length;
    const completed = allOrders.filter(o => o.status === 'completed').length;
    return { total, active, completed };
  }, [allOrders]);

  const handleCancelOrder = async (orderId: string) => {
    const res = await Taro.showModal({
      title: '确认取消',
      content: '确定要取消此预订吗？取消后时段将释放给其他用户。',
      confirmText: '确认取消',
      confirmColor: '#F53F3F',
      cancelText: '再想想'
    });

    if (res.confirm) {
      const success = await cancelOrder(orderId);
      if (success) {
        Taro.showToast({
          title: '取消成功',
          icon: 'success'
        });
      } else {
        Taro.showToast({
          title: '取消失败',
          icon: 'none'
        });
      }
    }
  };

  const handleTabClick = (key: OrderStatus | 'all') => {
    setActiveTab(key);
  };

  return (
    <View className={styles.page}>
      <View className={styles.tabBar}>
        {tabOptions.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, {
              [styles.active]: activeTab === tab.key
            })}
            onClick={() => handleTabClick(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.statsBar}>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{stats.total}</Text>
          <Text className={styles.statLabel}>全部订单</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{stats.active}</Text>
          <Text className={styles.statLabel}>进行中</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{stats.completed}</Text>
          <Text className={styles.statLabel}>已完成</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.orderList}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onCancel={handleCancelOrder}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无相关订单</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default OrdersPage;
