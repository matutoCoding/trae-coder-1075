import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { BookingOrder } from '@/types';
import { formatDuration, formatDate } from '@/utils/timeSlot';
import { formatCurrency } from '@/utils/billing';

interface OrderCardProps {
  order: BookingOrder;
  onCancel?: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onCancel }) => {
  const handleCardClick = () => {
    Taro.navigateTo({
      url: `/pages/order-detail/index?id=${order.id}`
    });
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCancel) {
      onCancel(order.id);
    }
  };

  const handleDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.navigateTo({
      url: `/pages/order-detail/index?id=${order.id}`
    });
  };

  const canCancel = order.status === 'pending' || order.status === 'confirmed';
  const isFree = order.billing.finalAmount === 0;

  return (
    <View className={styles.card} onClick={handleCardClick}>
      <View className={styles.cardHeader}>
        <Text className={styles.orderNo}>订单号：{order.orderNo}</Text>
        <Text className={classnames(styles.status, styles[order.status])}>
          {order.statusText}
        </Text>
      </View>

      <View className={styles.cardBody}>
        <Image
          className={styles.venueImage}
          src={order.venueImage}
          mode='aspectFill'
        />
        <View className={styles.orderInfo}>
          <View className={styles.venueName}>
            {order.venueName}
            {isFree && <Text className={styles.publicTag}>公益免费</Text>}
          </View>
          <Text className={styles.orderDate}>{formatDate(order.date)}</Text>
          <Text className={styles.orderTime}>
            ⏰ {order.startTime} - {order.endTime}
          </Text>
          <View className={styles.priceRow}>
            <View className={classnames(styles.price, { [styles.free]: isFree })}>
              {formatCurrency(order.billing.finalAmount)}
            </View>
            <Text className={styles.duration}>
              {formatDuration(order.billing.totalDuration)}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.cardFooter}>
        {canCancel && (
          <Button className={styles.btnCancel} onClick={handleCancel}>
            取消预订
          </Button>
        )}
        <Button className={styles.btnDetail} onClick={handleDetail}>
          查看详情
        </Button>
      </View>
    </View>
  );
};

export default OrderCard;
