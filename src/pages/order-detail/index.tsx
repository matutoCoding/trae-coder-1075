import React, { useMemo } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBookingStore } from '@/store/useBookingStore';
import { formatDuration, formatDate } from '@/utils/timeSlot';

const statusConfig: Record<string, { icon: string; text: string }> = {
  pending: { icon: '⏳', text: '待确认' },
  confirmed: { icon: '✅', text: '已确认' },
  completed: { icon: '🎉', text: '已完成' },
  cancelled: { icon: '❌', text: '已取消' },
  refunded: { icon: '💰', text: '已退款' }
};

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.params;

  const { getOrderById, cancelOrder } = useBookingStore();

  const order = useMemo(() => getOrderById(id || ''), [id, getOrderById]);

  const handleCancel = async () => {
    const res = await Taro.showModal({
      title: '确认取消',
      content: '确定要取消此预订吗？取消后时段将释放给其他用户。',
      confirmText: '确认取消',
      confirmColor: '#F53F3F',
      cancelText: '再想想'
    });

    if (res.confirm) {
      const success = await cancelOrder(id || '');
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

  const handleBack = () => {
    Taro.navigateBack();
  };

  const handleContact = () => {
    Taro.showToast({ title: '联系客服功能开发中', icon: 'none' });
  };

  if (!order) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '100rpx', textAlign: 'center' }}>
          <Text>订单不存在</Text>
        </View>
      </View>
    );
  }

  const canCancel = order.status === 'pending' || order.status === 'confirmed';
  const isFree = order.billing.finalAmount === 0;
  const statusInfo = statusConfig[order.status] || statusConfig.pending;

  return (
    <View className={styles.page}>
      <View className={styles.statusHeader}>
        <View className={styles.statusRow}>
          <Text className={styles.statusText}>{statusInfo.text}</Text>
          <Text className={styles.statusIcon}>{statusInfo.icon}</Text>
        </View>
        <Text className={styles.orderNo}>订单号：{order.orderNo}</Text>
      </View>

      <ScrollView scrollY>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>预订场馆</Text>
          <View className={styles.venueRow}>
            <Image
              className={styles.venueImage}
              src={order.venueImage}
              mode='aspectFill'
            />
            <View className={styles.venueInfo}>
              <Text className={styles.venueName}>{order.venueName}</Text>
              <Text className={styles.venueAddress}>📍 全民健身中心</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>预订信息</Text>
          <View className={styles.infoGrid}>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>预订日期</Text>
              <Text className={styles.infoValue}>{formatDate(order.date)}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>开始时间</Text>
              <View className={styles.timeTag}>{order.startTime}</View>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>结束时间</Text>
              <View className={styles.timeTag}>{order.endTime}</View>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>总时长</Text>
              <Text className={styles.infoValue}>
                {formatDuration(order.billing.totalDuration)}
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>费用明细</Text>
          <View className={styles.billingSection}>
            {order.billing.segments.map((seg, index) => (
              <View key={index} className={styles.billingItem}>
                <View className={styles.billingLabel}>
                  <View className={classnames(styles.rateTag, styles[seg.rateType])}>
                    {seg.rateName}
                  </View>
                  <Text>{seg.startTime} - {seg.endTime}</Text>
                </View>
                <View className={styles.billingValue}>
                  ¥{seg.subtotal.toFixed(2)}
                </View>
              </View>
            ))}
            <View className={styles.totalRow}>
              <Text className={styles.totalLabel}>合计金额</Text>
              <View className={classnames(styles.totalPrice, {
                [styles.free]: isFree
              })}>
                {isFree ? '免费' : `¥${order.billing.finalAmount.toFixed(2)}`}
              </View>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>联系信息</Text>
          <View className={styles.infoGrid}>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>联系人</Text>
              <Text className={styles.infoValue}>{order.contactName}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>联系电话</Text>
              <Text className={styles.infoValue}>{order.contactPhone}</Text>
            </View>
          </View>
          {order.remark && (
            <View className={styles.remarkSection}>
              <Text className={styles.remarkLabel}>备注信息</Text>
              <Text className={styles.remarkText}>{order.remark}</Text>
            </View>
          )}
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>订单信息</Text>
          <View className={styles.infoGrid}>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>下单时间</Text>
              <Text className={styles.infoValue}>{order.createdAt}</Text>
            </View>
            {order.cancelledAt && (
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>取消时间</Text>
                <Text className={styles.infoValue}>{order.cancelledAt}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        {canCancel && (
          <Button className={styles.btnCancel} onClick={handleCancel}>
            取消预订
          </Button>
        )}
        <Button className={styles.btnPrimary} onClick={handleContact}>
          联系客服
        </Button>
      </View>
    </View>
  );
};

export default OrderDetailPage;
