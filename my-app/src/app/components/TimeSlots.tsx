'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeSlot {
  id: string;
  time: string;
  isBooked?: boolean;
}

interface TimeSlotsProps {
  selectedDate: Date | null;
  selectedTimeSlot: string | null;
  onSelectTimeSlot: (timeSlot: string) => void;
}

const TIME_SLOTS = [
  { id: '1', label: '上午', time: '9:00-11:30', available: true },
  { id: '2', label: '下午', time: '13:30-16:30', available: true },
  { id: '3', label: '晚上', time: '18:00-20:00', available: true },
];

const TimeSlots: React.FC<TimeSlotsProps> = ({
  selectedDate,
  selectedTimeSlot,
  onSelectTimeSlot,
}) => {
  // 状态管理
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 当选择日期变化时，获取可用时间段
  useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([]);
      return;
    }
    
    const fetchAvailableTimeSlots = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const dateString = selectedDate.toISOString().split('T')[0];
        const response = await fetch(`/api/timeslots?date=${dateString}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '获取时间段失败');
        }
        
        // 使用API返回的时间段及其预约状态
        const formattedTimeSlots = (data.timeSlots || []).map((slot: {time: string, isBooked: boolean}) => ({
          id: slot.time,
          time: slot.time,
          isBooked: slot.isBooked // 使用API返回的预约状态
        }));
        
        setTimeSlots(formattedTimeSlots);
      } catch (err) {
        console.error('获取可用时间段失败:', err);
        setError(err instanceof Error ? err.message : '获取时间段失败');
        setTimeSlots([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailableTimeSlots();
  }, [selectedDate]);

  // 检查是否选择了日期
  const isDateSelected = Boolean(selectedDate);
  
  // 根据日期计算可用时间段
  // 这里只是一个示例，实际应用中可能需要从服务器获取可用时间
  const availableTimeSlots = React.useMemo(() => {
    if (!selectedDate) return [];
    
    // 这里可以添加逻辑来确定哪些时间段可用
    // 例如：周末可能有不同的时间段，或者通过API获取已预约的时间段
    
    return TIME_SLOTS.map(slot => ({
      ...slot,
      available: Math.random() > 0.3 // 随机示例，30%的概率时间段不可用
    }));
  }, [selectedDate]);

  const handleSelectTimeSlot = (timeSlot: string) => {
    onSelectTimeSlot(timeSlot);
  };

  if (!isDateSelected) {
    return (
      <div className="bg-zinc-800 rounded-lg p-4 shadow-md">
        <h2 className="text-lg font-bold mb-4">选择预约时间段</h2>
        <div className="text-zinc-400 text-center py-6">
          请先选择预约日期
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-2">选择预约时间段</h2>
      <p className="text-sm text-zinc-400 mb-4">
        {selectedDate ? `已选择日期: ${format(selectedDate, 'yyyy年MM月dd日')}` : '请先选择日期'}
      </p>
      
      <div className="grid grid-cols-1 gap-3">
        {availableTimeSlots.map((slot) => (
          <button
            key={slot.id}
            onClick={() => slot.available && handleSelectTimeSlot(`${slot.label} (${slot.time})`)}
            disabled={!slot.available}
            className={cn(
              "p-3 rounded-md text-left transition-colors focus:outline-none",
              slot.available 
                ? selectedTimeSlot === `${slot.label} (${slot.time})` 
                  ? "bg-red-600 text-white" 
                  : "bg-zinc-700 hover:bg-zinc-600"
                : "bg-zinc-800 opacity-50 cursor-not-allowed border border-zinc-700"
            )}
          >
            <div className="font-medium">{slot.label}</div>
            <div className="text-sm mt-1 flex justify-between items-center">
              <span>{slot.time}</span>
              {!slot.available && (
                <span className="text-xs bg-zinc-600 px-2 py-1 rounded-full">
                  已约满
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeSlots;