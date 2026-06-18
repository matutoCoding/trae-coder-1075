import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBookingStore } from '@/store/useBookingStore';
import {
  generateDateOptions,
  formatDuration,
  timeToMinutes,
  getRateName,
  buildAvailableTimeSlots
} from '@/utils/timeSlot';
import { calculateBilling } from '@/utils/billing';
import { checkTimeConflict } from '@/utils/conflict';
import { formatCurrency } from '@/utils/billing';
import type { TimeSlot, DateOption } from '@/types';

const BookingPage: React.FC = () => {
  const router = useRouter();
  const { venueId: venueIdParam } = router.params;

  const venues = useBookingStore(state => state.venues);
  const orders = useBookingStore(state => state.orders);
  const rateTable = useBookingStore(state => state.rateTable);
  const selectedVenueId = useBookingStore(state => state.selectedVenueId);
  const selectedDate = useBookingStore(state => state.selectedDate);
  const selectedStartTime = useBookingStore(state => state.selectedStartTime);
  const selectedEndTime = useBookingStore(state => state.selectedEndTime);
  const setSelectedVenue = useBookingStore(state => state.setSelectedVenue);
  const setSelectedDate = useBookingStore(state => state.setSelectedDate);
  const setSelectedStartTime = useBookingStore(state => state.setSelectedStartTime);
  const setSelectedEndTime = useBookingStore(state => state.setSelectedEndTime);

  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);

  useEffect(() => {
    setDateOptions(generateDateOptions(7));
    if (venueIdParam) {
      setSelectedVenue(venueIdParam);
    }
  }, [venueIdParam, setSelectedVenue]);

  useDidShow(() => {
    // tabBar 切换回来时，如果有传参也处理一下
    if (venueIdParam && venueIdParam !== selectedVenueId) {
      setSelectedVenue(venueIdParam);
    }
  });

  const activeRates = useMemo(
    () => rateTable.filter(r => r.enabled !== false),
    [rateTable]
  );

  const currentVenue = useMemo(
    () => venues.find(v => v.id === selectedVenueId),
    [venues, selectedVenueId]
  );

  const timeSlots = useMemo(() => {
    if (!currentVenue) return [];

    const bookedSlots = orders
      .filter(
        o =>
          o.venueId === selectedVenueId &&
          o.date === selectedDate &&
          o.status !== 'cancelled' &&
          o.status !== 'refunded'
      )
      .map(o => ({ startTime: o.startTime, endTime: o.endTime }));

    return buildAvailableTimeSlots(
      currentVenue.openTime,
      currentVenue.closeTime,
      bookedSlots,
      activeRates
    );
  }, [currentVenue, selectedVenueId, selectedDate, orders, activeRates]);

  const billing = useMemo(() => {
    if (!selectedStartTime || !selectedEndTime) return null;
    return calculateBilling(selectedStartTime, selectedEndTime, activeRates);
  }, [selectedStartTime, selectedEndTime, activeRates]);

  const conflict = useMemo(() => {
    if (!selectedStartTime || !selectedEndTime) return null;
    const venueOrders = orders.filter(
      o => o.venueId === selectedVenueId && o.date === selectedDate
    );
    return checkTimeConflict(selectedStartTime, selectedEndTime, venueOrders);
  }, [selectedStartTime, selectedEndTime, selectedVenueId, selectedDate, orders]);

  const handleVenueSelect = (id: string) => {
    setSelectedVenue(id);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleTimeSlotClick = (slot: TimeSlot) => {
    if (!slot.isAvailable) return;

    const slotStartMin = timeToMinutes(slot.startTime);

    if (!selectedStartTime) {
      setSelectedStartTime(slot.startTime);
      return;
    }

    if (selectedStartTime && !selectedEndTime) {
      const selectedStartMin = timeToMinutes(selectedStartTime);

      if (slotStartMin === selectedStartMin) {
        setSelectedStartTime('');
        return;
      }

      if (slotStartMin < selectedStartMin) {
        setSelectedStartTime(slot.startTime);
        setSelectedEndTime(selectedStartTime);
      } else {
        const endTime = slot.endTime;
        setSelectedEndTime(endTime);
      }
      return;
    }

    if (selectedStartTime && selectedEndTime) {
      setSelectedStartTime(slot.startTime);
      setSelectedEndTime('');
    }
  };

  const isSlotInRange = (slot: TimeSlot): boolean => {
    if (!selectedStartTime || !selectedEndTime) return false;
    const slotStart = timeToMinutes(slot.startTime);
    const startMin = timeToMinutes(selectedStartTime);
    const endMin = timeToMinutes(selectedEndTime);
    return slotStart >= startMin && slotStart < endMin;
  };

  const isSlotSelected = (slot: TimeSlot): boolean => {
    return slot.startTime === selectedStartTime || slot.endTime === selectedEndTime;
  };

  const canBook = useMemo(() => {
    return selectedStartTime && selectedEndTime && !conflict?.hasConflict;
  }, [selectedStartTime, selectedEndTime, conflict]);

  const handleBook = () => {
    if (!canBook) return;

    Taro.navigateTo({
      url: `/pages/booking-confirm/index?venueId=${selectedVenueId}&date=${selectedDate}&startTime=${selectedStartTime}&endTime=${selectedEndTime}`
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>选择场馆</Text>
        <View className={styles.venueSelector}>
          {venues.slice(0, 6).map(venue => (
            <View
              key={venue.id}
              className={classnames(styles.venueItem, {
                [styles.active]: venue.id === selectedVenueId
              })}
              onClick={() => handleVenueSelect(venue.id)}
            >
              <Text className={styles.venueName}>{venue.name}</Text>
              <Text className={styles.venueInfo}>{venue.openTime}-{venue.closeTime}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>选择日期</Text>
        <ScrollView scrollX className={styles.dateScroll}>
          <View className={styles.dateList}>
            {dateOptions.map(date => (
              <View
                key={date.date}
                className={classnames(styles.dateItem, {
                  [styles.active]: date.date === selectedDate
                })}
                onClick={() => handleDateSelect(date.date)}
              >
                <Text className={styles.dateDay}>{date.dayText}</Text>
                <Text className={styles.dateWeek}>{date.dayOfWeek}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {conflict?.hasConflict && (
        <View className={styles.conflictTip}>
          <Text className={styles.icon}>⚠️</Text>
          <Text>{conflict.message}</Text>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>选择时段</Text>
        <View className={styles.timeGrid}>
          {timeSlots.map(slot => {
            const isBooked = !slot.isAvailable;
            const isSelected = isSlotSelected(slot);
            const isInRange = isSlotInRange(slot);

            return (
              <View
                key={slot.id}
                className={classnames(styles.timeSlot, {
                  [styles.booked]: isBooked,
                  [styles.selected]: isSelected,
                  [styles.inRange]: isInRange && !isSelected,
                  [styles.available]: !isBooked
                })}
                onClick={() => handleTimeSlotClick(slot)}
              >
                <Text className={styles.timeText}>{slot.startTime}</Text>
                <Text className={styles.timePrice}>
                  {slot.pricePerHour === 0 ? '免费' : `¥${slot.pricePerHour}/h`}
                </Text>
                <View className={classnames(styles.rateTag, styles[slot.rateType])}>
                  {getRateName(slot.rateType)}
                </View>
              </View>
            );
          })}
        </View>

        <View className={styles.legend}>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.available)}></View>
            <Text>可预订</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.booked)}></View>
            <Text>已预订</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.selected)}></View>
            <Text>已选择</Text>
          </View>
        </View>

        {billing && billing.segments.length > 0 && (
          <View className={styles.feePreview}>
            <Text className={styles.feePreviewTitle}>费用明细</Text>
            {billing.segments.map((seg, index) => (
              <View key={index} className={styles.feeItem}>
                <View className={styles.feeLabel}>
                  <View className={classnames(styles.feeTypeTag, styles[seg.rateType])}>
                    {seg.rateName}
                  </View>
                  <Text>{seg.startTime}-{seg.endTime}</Text>
                </View>
                <Text>{formatCurrency(seg.subtotal)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className={styles.summaryBar}>
        <View className={styles.summaryInfo}>
          <Text className={styles.summaryTime}>
            {selectedStartTime && selectedEndTime
              ? `${selectedStartTime} - ${selectedEndTime} · ${formatDuration(billing?.totalDuration || 0)}`
              : '请选择预订时段'}
          </Text>
          <View className={styles.summaryPrice}>
            <Text className={styles.label}>合计</Text>
            <Text>{billing ? formatCurrency(billing.finalAmount) : '¥0.00'}</Text>
          </View>
        </View>
        <Button
          className={classnames(styles.bookButton, {
            [styles.disabled]: !canBook
          })}
          onClick={handleBook}
          disabled={!canBook}
        >
          立即预订
        </Button>
      </View>
    </View>
  );
};

export default BookingPage;
