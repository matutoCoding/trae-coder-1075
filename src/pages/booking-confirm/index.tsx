import React, { useState, useMemo } from 'react';
import { View, Text, Image, Button, Input, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBookingStore } from '@/store/useBookingStore';
import { getVenueById } from '@/data/venues';
import { calculateBilling } from '@/utils/billing';
import { getDefaultRateTable, formatDuration, formatDate } from '@/utils/timeSlot';
import { checkTimeConflict, validateBookingTime } from '@/utils/conflict';
import type { BillingInfo, BookingForm } from '@/types';

const BookingConfirmPage: React.FC = () => {
  const router = useRouter();
  const { venueId, date, startTime, endTime } = router.params;

  const { createBooking, orders } = useBookingStore();

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const venue = useMemo(() => getVenueById(venueId || ''), [venueId]);
  const rateTable = useMemo(() => getDefaultRateTable(), []);

  const billing: BillingInfo | null = useMemo(() => {
    if (!startTime || !endTime) return null;
    return calculateBilling(startTime, endTime, rateTable);
  }, [startTime, endTime, rateTable]);

  const conflictCheck = useMemo(() => {
    if (!venueId || !date || !startTime || !endTime) {
      return { hasConflict: false, conflictOrders: [], message: '' };
    }
    const venueOrders = orders.filter(
      o => o.venueId === venueId && o.date === date
    );
    return checkTimeConflict(startTime, endTime, venueOrders);
  }, [venueId, date, startTime, endTime, orders]);

  const timeValidation = useMemo(() => {
    if (!venue || !startTime || !endTime) {
      return { valid: true, message: '' };
    }
    return validateBookingTime(startTime, endTime, venue.openTime, venue.closeTime);
  }, [venue, startTime, endTime]);

  const canSubmit = useMemo(() => {
    return (
      contactName.trim() !== '' &&
      contactPhone.trim() !== '' &&
      !conflictCheck.hasConflict &&
      timeValidation.valid &&
      !submitting
    );
  }, [contactName, contactPhone, conflictCheck, timeValidation, submitting]);

  const handleSubmit = async () => {
    if (!canSubmit || !venueId || !date || !startTime || !endTime) return;

    setSubmitting(true);

    try {
      const form: BookingForm = {
        venueId,
        date,
        startTime,
        endTime,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        remark: remark.trim() || undefined
      };

      const result = await createBooking(form);

      if (result) {
        Taro.showToast({
          title: '预订成功',
          icon: 'success',
          duration: 2000
        });

        setTimeout(() => {
          Taro.redirectTo({
            url: `/pages/order-detail/index?id=${result.id}`
          });
        }, 1500);
      } else {
        Taro.showToast({
          title: '预订失败，请重试',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('[BookingConfirm] 预订出错', error);
      Taro.showToast({
        title: '预订出错，请重试',
        icon: 'none'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isFree = billing?.finalAmount === 0;

  if (!venue || !billing) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '100rpx', textAlign: 'center' }}>
          <Text>参数错误</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>预订场馆</Text>
          <View className={styles.venueRow}>
            <Image
              className={styles.venueImage}
              src={venue.image}
              mode='aspectFill'
            />
            <View className={styles.venueInfo}>
              <Text className={styles.venueName}>{venue.name}</Text>
              <Text className={styles.venueAddress}>📍 {venue.address}</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>预订信息</Text>
          <View className={styles.infoGrid}>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>预订日期</Text>
              <Text className={styles.infoValue}>{formatDate(date || '')}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>预订时段</Text>
              <View className={styles.timeRange}>
                <Text className={styles.timeTag}>{startTime}</Text>
                <Text style={{ color: '#86909C' }}>至</Text>
                <Text className={styles.timeTag}>{endTime}</Text>
              </View>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>总时长</Text>
              <Text className={styles.infoValue}>
                {formatDuration(billing.totalDuration)}
              </Text>
            </View>
          </View>
        </View>

        {conflictCheck.hasConflict && (
          <View className={styles.notice}>
            <Text className={styles.title}>⚠️ 时段冲突</Text>
            <Text>{conflictCheck.message}</Text>
          </View>
        )}

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>联系信息</Text>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              联系人
            </Text>
            <Input
              className={styles.formInput}
              placeholder='请输入联系人姓名'
              value={contactName}
              onInput={(e) => setContactName(e.detail.value)}
              maxlength={20}
            />
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              联系电话
            </Text>
            <Input
              className={styles.formInput}
              type='number'
              placeholder='请输入联系电话'
              value={contactPhone}
              onInput={(e) => setContactPhone(e.detail.value)}
              maxlength={11}
            />
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>备注信息</Text>
            <Textarea
              className={styles.formTextarea}
              placeholder='选填，如有特殊需求请备注'
              value={remark}
              onInput={(e) => setRemark(e.detail.value)}
              maxlength={200}
            />
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>费用明细</Text>
          <View className={styles.billingSection}>
            {billing.segments.map((seg, index) => (
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
                {isFree ? '免费' : `¥${billing.finalAmount.toFixed(2)}`}
              </View>
            </View>
          </View>
        </View>

        {isFree && (
          <View className={styles.notice}>
            <Text className={styles.title}>💝 公益时段</Text>
            <Text>本次预订处于公益时段，全部免费。感谢您参与全民健身！</Text>
          </View>
        )}
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.priceInfo}>
          <Text className={styles.priceLabel}>应付金额</Text>
          <View className={classnames(styles.priceValue, {
            [styles.free]: isFree
          })}>
            {isFree ? '免费' : `¥${billing.finalAmount.toFixed(2)}`}
          </View>
        </View>
        <Button
          className={classnames(styles.submitBtn, {
            [styles.disabled]: !canSubmit
          })}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? '提交中...' : '确认预订'}
        </Button>
      </View>
    </View>
  );
};

export default BookingConfirmPage;
