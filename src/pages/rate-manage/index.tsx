import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useBookingStore } from '@/store/useBookingStore';
import { getRateName, isValidTimeFormat } from '@/utils/timeSlot';
import type { TimeSlotRate, RateType } from '@/types';

const RATE_TYPES: Array<{ type: RateType; name: string }> = [
  { type: 'peak', name: '高峰' },
  { type: 'normal', name: '平峰' },
  { type: 'off-peak', name: '低峰' },
  { type: 'public-welfare', name: '公益' }
];

const emptyForm: TimeSlotRate = {
  id: '',
  startTime: '09:00',
  endTime: '10:00',
  rateType: 'normal',
  pricePerHour: 40,
  enabled: true
};

function splitTime(time: string): { hour: string; minute: string } {
  if (!time || !isValidTimeFormat(time)) {
    return { hour: '', minute: '' };
  }
  const [h, m] = time.split(':');
  return { hour: h, minute: m };
}

function joinTime(hour: string, minute: string): string {
  const h = hour.padStart(2, '0');
  const m = minute.padStart(2, '0');
  return `${h}:${m}`;
}

const RateManagePage: React.FC = () => {
  const rateTable = useBookingStore(state => state.rateTable);
  const addRate = useBookingStore(state => state.addRate);
  const updateRate = useBookingStore(state => state.updateRate);
  const toggleRate = useBookingStore(state => state.toggleRate);
  const deleteRate = useBookingStore(state => state.deleteRate);
  const resetRateTable = useBookingStore(state => state.resetRateTable);
  const validateRate = useBookingStore(state => state.validateRate);

  const [showModal, setShowModal] = useState(false);
  const [editingRate, setEditingRate] = useState<TimeSlotRate | null>(null);
  const [form, setForm] = useState<TimeSlotRate>(emptyForm);
  const [errorMsg, setErrorMsg] = useState('');

  const startParts = useMemo(() => splitTime(form.startTime), [form.startTime]);
  const endParts = useMemo(() => splitTime(form.endTime), [form.endTime]);

  const sortedRates = useMemo(() => {
    return [...rateTable].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [rateTable]);

  useEffect(() => {
    if (!showModal) return;
    const validation = validateRate(form, editingRate?.id);
    setErrorMsg(validation.valid ? '' : validation.message);
  }, [form, showModal, editingRate, validateRate]);

  const openAddModal = () => {
    setEditingRate(null);
    setForm({ ...emptyForm, id: `r${Date.now()}` });
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (rate: TimeSlotRate) => {
    setEditingRate(rate);
    setForm({ ...rate });
    setErrorMsg('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRate(null);
  };

  const handleToggle = (rateId: string) => {
    toggleRate(rateId);
    Taro.showToast({ title: '已更新', icon: 'success', duration: 800 });
  };

  const handleDelete = async (rateId: string) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '删除后该时段将不再参与计费，确定删除吗？',
      confirmColor: '#F53F3F'
    });
    if (res.confirm) {
      deleteRate(rateId);
      Taro.showToast({ title: '已删除', icon: 'success', duration: 800 });
    }
  };

  const handleReset = async () => {
    const res = await Taro.showModal({
      title: '恢复默认',
      content: '确定要将费率表恢复为默认配置吗？',
      confirmColor: '#00B4A8'
    });
    if (res.confirm) {
      resetRateTable();
      Taro.showToast({ title: '已恢复默认', icon: 'success' });
    }
  };

  const handleTypeSelect = (type: RateType) => {
    const priceMap: Record<RateType, number> = {
      peak: 60,
      normal: 40,
      'off-peak': 20,
      'public-welfare': 0
    };
    setForm(prev => ({
      ...prev,
      rateType: type,
      pricePerHour: type === prev.rateType ? prev.pricePerHour : priceMap[type]
    }));
  };

  const handleTimeChange = (which: 'start' | 'end', part: 'hour' | 'minute', rawValue: string) => {
    const value = rawValue.replace(/\D/g, '').slice(0, 2);
    const num = parseInt(value, 10);

    if (part === 'hour' && num > 23) return;
    if (part === 'minute' && num > 59) return;

    const current = which === 'start' ? startParts : endParts;
    const newParts = { ...current, [part]: value };
    const newTime = joinTime(newParts.hour || '0', newParts.minute || '0');

    setForm(prev => ({ ...prev, [which === 'start' ? 'startTime' : 'endTime']: newTime }));
  };

  const handlePriceChange = (rawValue: string) => {
    const val = rawValue === '' ? 0 : Number(rawValue);
    setForm(prev => ({ ...prev, pricePerHour: isNaN(val) ? 0 : val }));
  };

  const handleSubmit = () => {
    const validation = validateRate(form, editingRate?.id);
    if (!validation.valid) {
      setErrorMsg(validation.message);
      return;
    }

    let result;
    if (editingRate) {
      result = updateRate(form);
    } else {
      result = addRate(form);
    }

    if (result.success) {
      Taro.showToast({ title: result.message, icon: 'success' });
      setShowModal(false);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.tipBar}>
        <Text>💡</Text>
        <Text className={styles.tipText}>
          停用或修改费率后，新预订会按新费率计算；已生成的订单金额保持不变。
        </Text>
      </View>

      <View className={styles.section}>
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24rpx' }}>
          <Text className={styles.sectionTitle} style={{ marginBottom: 0 }}>时段费率配置</Text>
          <Text
            style={{ color: '#00B4A8', fontSize: '24rpx' }}
            onClick={handleReset}
          >
            恢复默认
          </Text>
        </View>

        {sortedRates.length === 0 ? (
          <View className={styles.emptyTip}>暂无费率配置，点击下方按钮添加</View>
        ) : (
          sortedRates.map(rate => (
            <View
              key={rate.id}
              className={classnames(styles.rateItem, {
                [styles.disabled]: rate.enabled === false
              })}
            >
              <View className={styles.rateInfo}>
                <View className={styles.rateHeader}>
                  <View className={classnames(styles.rateTypeTag, styles[rate.rateType])}>
                    {getRateName(rate.rateType)}
                  </View>
                  <Text className={styles.rateTime}>
                    {rate.startTime} - {rate.endTime}
                  </Text>
                </View>
                <Text className={styles.ratePrice}>
                  {rate.rateType === 'public-welfare' ? '免费（公益时段）' : `¥${rate.pricePerHour}/小时`}
                </Text>
              </View>
              <View className={styles.rateActions}>
                <View className={styles.iconBtn} onClick={() => openEditModal(rate)}>✏️</View>
                <View className={styles.iconBtn} onClick={() => handleDelete(rate.id)}>🗑️</View>
                <View
                  className={classnames(styles.switch, { [styles.on]: rate.enabled !== false })}
                  onClick={() => handleToggle(rate.id)}
                >
                  <View className={styles.switchKnob}></View>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <Button className={styles.addButton} onClick={openAddModal}>
        + 新增费率时段
      </Button>

      {showModal && (
        <View className={styles.modalMask} onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}>
          <View className={styles.modal} catchMove>
            <Text className={styles.modalTitle}>
              {editingRate ? '编辑费率' : '新增费率'}
            </Text>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>时段类型</Text>
              <View className={styles.typeOptions}>
                {RATE_TYPES.map(rt => (
                  <View
                    key={rt.type}
                    className={classnames(styles.typeOption, {
                      [styles.active]: form.rateType === rt.type,
                      [styles[rt.type]]: form.rateType === rt.type
                    })}
                    onClick={() => handleTypeSelect(rt.type)}
                  >
                    {rt.name}
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>开始时间</Text>
              <View className={styles.timeRow}>
                <Input
                  className={classnames(styles.formInput, styles.timeInput)}
                  type='number'
                  placeholder='09'
                  value={startParts.hour}
                  onInput={(e) => handleTimeChange('start', 'hour', e.detail.value)}
                  maxlength={2}
                />
                <Text style={{ color: '#86909C', fontSize: '32rpx', fontWeight: 'bold' }}>:</Text>
                <Input
                  className={classnames(styles.formInput, styles.timeInput)}
                  type='number'
                  placeholder='00'
                  value={startParts.minute}
                  onInput={(e) => handleTimeChange('start', 'minute', e.detail.value)}
                  maxlength={2}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>结束时间</Text>
              <View className={styles.timeRow}>
                <Input
                  className={classnames(styles.formInput, styles.timeInput)}
                  type='number'
                  placeholder='18'
                  value={endParts.hour}
                  onInput={(e) => handleTimeChange('end', 'hour', e.detail.value)}
                  maxlength={2}
                />
                <Text style={{ color: '#86909C', fontSize: '32rpx', fontWeight: 'bold' }}>:</Text>
                <Input
                  className={classnames(styles.formInput, styles.timeInput)}
                  type='number'
                  placeholder='00'
                  value={endParts.minute}
                  onInput={(e) => handleTimeChange('end', 'minute', e.detail.value)}
                  maxlength={2}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>单价（元/小时）</Text>
              <Input
                className={styles.formInput}
                type='digit'
                placeholder='请输入单价'
                value={String(form.pricePerHour)}
                onInput={(e) => handlePriceChange(e.detail.value)}
                disabled={form.rateType === 'public-welfare'}
              />
              {form.rateType === 'public-welfare' && (
                <Text className={styles.hintTip}>公益时段自动设为免费</Text>
              )}
            </View>

            {errorMsg && (
              <View className={styles.errorTip}>⚠️ {errorMsg}</View>
            )}

            <View className={styles.modalActions}>
              <Button className={classnames(styles.modalBtn, styles.cancel)} onClick={closeModal}>
                取消
              </Button>
              <Button
                className={classnames(styles.modalBtn, styles.confirm, {
                  [styles.disabled]: !!errorMsg
                })}
                onClick={handleSubmit}
                disabled={!!errorMsg}
              >
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default RateManagePage;
