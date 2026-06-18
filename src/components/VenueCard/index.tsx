import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { Venue } from '@/types';
import { venueTypeNames } from '@/data/venues';

interface VenueCardProps {
  venue: Venue;
  pricePerHour?: number;
  onBook?: () => void;
}

const VenueCard: React.FC<VenueCardProps> = ({ venue, pricePerHour = 40, onBook }) => {
  const handleCardClick = () => {
    Taro.navigateTo({
      url: `/pages/venue-detail/index?id=${venue.id}`
    });
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBook) {
      onBook();
    } else {
      Taro.navigateTo({
        url: `/pages/booking/index?venueId=${venue.id}`
      });
    }
  };

  const displayFacilities = venue.facilities.slice(0, 3);

  return (
    <View className={styles.card} onClick={handleCardClick}>
      <View className={styles.imageWrapper}>
        <Image
          className={styles.image}
          src={venue.image}
          mode='aspectFill'
          lazyLoad
        />
        <View className={styles.typeTag}>
          {venueTypeNames[venue.type]}
        </View>
      </View>
      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.name}>{venue.name}</Text>
          <View className={styles.price}>
            <Text>¥{pricePerHour}</Text>
            <Text className={styles.unit}>/小时</Text>
          </View>
        </View>
        <Text className={styles.description}>{venue.description}</Text>
        <View className={styles.footer}>
          <View className={styles.facilities}>
            {displayFacilities.map((f, i) => (
              <Text key={i} className={styles.facilityTag}>{f}</Text>
            ))}
          </View>
          <Button
            className={styles.button}
            onClick={handleBookClick}
          >
            立即预订
          </Button>
        </View>
      </View>
    </View>
  );
};

export default VenueCard;
