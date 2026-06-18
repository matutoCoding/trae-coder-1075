import React, { useMemo } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { getVenueById, venueTypeNames } from '@/data/venues';
import { getCurrentTime, getRateForTime } from '@/utils/timeSlot';
import { getRateName } from '@/utils/timeSlot';
import { useBookingStore } from '@/store/useBookingStore';
import type { Venue } from '@/types';

const VenueDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.params;

  const { getActiveRateTable, setSelectedVenue } = useBookingStore();

  const venue = useMemo(() => getVenueById(id || ''), [id]);
  const rateTable = useMemo(() => getActiveRateTable(), [getActiveRateTable]);
  const currentTime = getCurrentTime();

  const currentRate = useMemo(() => {
    return getRateForTime(currentTime, rateTable);
  }, [currentTime, rateTable]);

  const handleBack = () => {
    Taro.navigateBack();
  };

  const handleBook = () => {
    if (venue?.id) {
      setSelectedVenue(venue.id);
    }
    Taro.switchTab({
      url: '/pages/booking/index'
    });
  };

  if (!venue) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '100rpx', textAlign: 'center' }}>
          <Text>场馆不存在</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.imageWrapper}>
        <View className={styles.backBtn} onClick={handleBack}>
          ‹
        </View>
        <Image
          className={styles.venueImage}
          src={venue.image}
          mode='aspectFill'
        />
      </View>

      <ScrollView scrollY>
        <View className={styles.content}>
          <View className={styles.infoCard}>
            <View className={styles.titleRow}>
              <Text className={styles.venueName}>{venue.name}</Text>
              <View className={styles.typeTag}>
                {venueTypeNames[venue.type]}
              </View>
            </View>
            <View className={styles.address}>
              <Text className={styles.icon}>📍</Text>
              <Text>{venue.address}</Text>
            </View>
            <View className={styles.hours}>
              <Text className={styles.icon}>🕐</Text>
              <Text>营业时间：{venue.openTime} - {venue.closeTime}</Text>
            </View>
            <View className={styles.priceInfo}>
              <Text className={styles.priceLabel}>当前价格：</Text>
              <View className={styles.priceValue}>
                <Text>¥{currentRate?.pricePerHour || 40}</Text>
                <Text className={styles.unit}>/小时</Text>
              </View>
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>场馆介绍</Text>
            <Text className={styles.description}>{venue.description}</Text>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>设施服务</Text>
            <View className={styles.facilityList}>
              {venue.facilities.map((f, i) => (
                <View key={i} className={styles.facilityItem}>
                  <Text className={styles.facilityIcon}>✓</Text>
                  <Text>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>时段费率</Text>
            <View className={styles.rateTable}>
              {rateTable.map(rate => (
                <View key={rate.id} className={styles.rateRow}>
                  <View className={styles.rateName}>
                    <View className={classnames(styles.rateTypeTag, styles[rate.rateType])}>
                      {getRateName(rate.rateType)}
                    </View>
                    <Text className={styles.rateTime}>
                      {rate.startTime} - {rate.endTime}
                    </Text>
                  </View>
                  <View className={classnames(styles.ratePrice, {
                    [styles.free]: rate.pricePerHour === 0
                  })}>
                    {rate.pricePerHour === 0 ? '免费' : `¥${rate.pricePerHour}/小时`}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <Button className={styles.bookBtn} onClick={handleBook}>
          立即预订
        </Button>
      </View>
    </View>
  );
};

export default VenueDetailPage;
