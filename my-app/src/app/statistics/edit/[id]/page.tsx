'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// 时间段选项
const TIME_SLOTS = [
  '09:00-09:30', '09:30-10:00', '10:00-10:30', '10:30-11:00',
  '11:00-11:30', '11:30-12:00', '12:00-12:30', '12:30-13:00',
  '13:00-13:30', '13:30-14:00', '14:00-14:30', '14:30-15:00',
  '15:00-15:30', '15:30-16:00', '16:00-16:30', '16:30-17:00',
  '17:00-17:30', '17:30-18:00'
];

interface AppointmentData {
  id: string;
  user_name: string;
  phone: string;
  contact_info: string | null;
  appointment_date: string;
  appointment_time: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  // 表单状态
  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  
  // 页面状态
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // 获取预约详情
  const fetchAppointmentDetails = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`);
      
      if (!response.ok) {
        throw new Error('获取预约详情失败');
      }
      
      const appointment: AppointmentData = await response.json();
      
      // 填充表单数据
      setUserName(appointment.user_name);
      setPhone(appointment.phone);
      setAppointmentDate(parseISO(appointment.appointment_date));
      setAppointmentTime(appointment.appointment_time);
      setContactInfo(appointment.contact_info || '');
      setNotes(appointment.notes || '');
      
    } catch (err) {
      setError('获取预约详情失败：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // 获取可用时间段
  const fetchAvailableTimeSlots = async (date: Date) => {
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/timeslots?date=${dateString}`);
      const data = await response.json();
      
      if (response.ok) {
        // 获取已预约的时间段，但排除当前编辑的预约
        const bookedSlots = data.timeSlots
          .filter((slot: any) => slot.isBooked && slot.appointmentId !== appointmentId)
          .map((slot: any) => slot.time);
        
        // 返回所有时间段，包括当前预约的时间段
        const available = TIME_SLOTS.filter(slot => 
          !bookedSlots.includes(slot) || slot === appointmentTime
        );
        setAvailableTimeSlots(available);
      } else {
        setAvailableTimeSlots(TIME_SLOTS);
      }
    } catch (err) {
      console.error('获取时间段失败:', err);
      setAvailableTimeSlots(TIME_SLOTS);
    }
  };

  // 处理日期变更
  const handleDateChange = (date: Date | null) => {
    setAppointmentDate(date);
    setAppointmentTime(''); // 重置时间段选择
    if (date) {
      fetchAvailableTimeSlots(date);
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName || !phone || !appointmentDate || !appointmentTime) {
      setError('请填写所有必填字段');
      return;
    }
    
    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('手机号格式不正确');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: userName,
          phone: phone,
          contact_info: contactInfo || null,
          appointment_date: format(appointmentDate, 'yyyy-MM-dd'),
          appointment_time: appointmentTime,
          notes: notes || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新预约失败');
      }
      
      // 成功后返回统计页面
      router.push('/statistics');
      
    } catch (err) {
      setError('更新预约失败：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 页面加载时获取预约详情
  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails();
    }
  }, [appointmentId]);

  // 当日期变更时获取可用时间段
  useEffect(() => {
    if (appointmentDate) {
      fetchAvailableTimeSlots(appointmentDate);
    }
  }, [appointmentDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-color flex items-center justify-center">
        <div className="loading-spinner w-12 h-12 border-4"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-color py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-heading-color">编辑预约</h1>
            <button
              onClick={() => router.push('/statistics')}
              className="text-text-secondary hover:text-heading-color transition-colors"
            >
              返回列表
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 用户姓名 */}
            <div>
              <label className="block text-sm font-medium text-text-color mb-2">
                用户姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="form-input"
                placeholder="请输入用户姓名"
                required
              />
            </div>

            {/* 手机号码 */}
            <div>
              <label className="block text-sm font-medium text-text-color mb-2">
                手机号码 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                placeholder="请输入11位手机号码"
                required
              />
            </div>

            {/* 预约日期 */}
            <div>
              <label className="block text-sm font-medium text-text-color mb-2">
                预约日期 <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={appointmentDate}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                minDate={new Date()}
                className="form-input"
                placeholderText="请选择预约日期"
                required
              />
            </div>

            {/* 预约时间段 */}
            <div>
              <label className="block text-sm font-medium text-text-color mb-2">
                预约时间段 <span className="text-red-500">*</span>
              </label>
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="form-input"
                required
                disabled={!appointmentDate}
              >
                <option value="">请选择时间段</option>
                {availableTimeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              {appointmentDate && availableTimeSlots.length === 0 && (
                <p className="text-sm text-red-500 mt-1">该日期暂无可用时间段</p>
              )}
            </div>

            {/* 其他联系方式 */}
            <div>
              <label className="block text-sm font-medium text-text-color mb-2">
                其他联系方式
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="form-input"
                placeholder="微信号、QQ号等（可选）"
              />
            </div>

            {/* 备注 */}
            <div>
              <label className="block text-sm font-medium text-text-color mb-2">
                备注
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input"
                rows={3}
                placeholder="其他需要说明的信息（可选）"
              />
            </div>

            {/* 提交按钮 */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1"
              >
                {isSubmitting ? '更新中...' : '更新预约'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/statistics')}
                className="btn-secondary flex-1"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}