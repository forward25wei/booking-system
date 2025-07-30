'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { zhCN } from 'date-fns/locale';

// 定义预约接口
interface Appointment {
  id: string;
  user_name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  contact_info: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 定义分页数据接口
interface PaginatedData {
  appointments: Appointment[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
}

// 定义时间段接口
interface TimeSlot {
  time: string;
  isBooked: boolean;
}

// 预约时间选项
const TIME_SLOTS = [
  '09:00-09:30',
  '09:30-10:00',
  '10:00-10:30',
  '10:30-11:00',
  '11:00-11:30',
  '11:30-12:00',
  '14:00-14:30',
  '14:30-15:00',
  '15:00-15:30',
  '15:30-16:00',
  '16:00-16:30',
  '16:30-17:00',
  '17:00-17:30',
  '17:30-18:00',
];

export default function Home() {
  // 表单状态
  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  
  // 预约记录状态
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 确认对话框状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  
  // 时间段状态
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  
  // 引用表单，用于滚动
  const formRef = useRef<HTMLFormElement>(null);

  // 获取预约记录
  const fetchAppointments = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/appointments?page=${page}&pageSize=${pageSize}`);
      
      if (!response.ok) {
        throw new Error(`获取预约记录失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      setAppointments(data.appointments || []);
      setTotalAppointments(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      setCurrentPage(data.pagination?.page || 1);
      
    } catch (err) {
      setError(`获取预约记录时出错: ${err instanceof Error ? err.message : String(err)}`);
      console.error('获取预约记录失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取特定日期的可用时间段
  const fetchAvailableTimeSlots = async (date: Date) => {
    setIsLoadingTimeSlots(true);
    
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/appointments?date=${dateString}`);
      
      if (!response.ok) {
        throw new Error(`获取时间段失败: ${response.status}`);
      }
      
      const data = await response.json();
      const bookedAppointments = data.appointments || [];
      
      // 获取已预约的时间段
      const bookedTimes = bookedAppointments.map((appointment: Appointment) => 
        appointment.appointment_time
      );
      
      // 设置每个时间段的可用状态
      const slots = TIME_SLOTS.map(time => ({
        time,
        isBooked: bookedTimes.includes(time)
      }));
      
      setAvailableTimeSlots(slots);
    } catch (err) {
      console.error('获取可用时间段失败:', err);
      setAvailableTimeSlots(TIME_SLOTS.map(time => ({ time, isBooked: false })));
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  // 页面加载时获取预约记录
  useEffect(() => {
    fetchAppointments(currentPage);
  }, [currentPage, pageSize]);

  // 当选择日期变化时，获取可用时间段
  useEffect(() => {
    if (appointmentDate) {
      fetchAvailableTimeSlots(appointmentDate);
    } else {
      setAvailableTimeSlots([]);
    }
  }, [appointmentDate]);

  // 分页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!userName) {
      setError('请填写姓名');
      return;
    }
    
    if (!phone) {
      setError('请填写手机号码');
      return;
    }
    
    // 手机号码格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('手机号码格式不正确，请输入11位有效手机号');
      return;
    }
    
    if (!appointmentDate) {
      setError('请选择预约日期');
      return;
    }
    
    if (!appointmentTime) {
      setError('请选择预约时间段');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    const formattedDate = appointmentDate ? format(appointmentDate, 'yyyy-MM-dd') : '';
    
    const appointmentData = {
      user_name: userName,
      phone,
      appointment_date: formattedDate,
      appointment_time: appointmentTime,
      contact_info: contactInfo || null,
      notes: notes || null,
    };
    
    try {
      const url = isEditing ? `/api/appointments/${editingId}` : '/api/appointments';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });
      
      if (!response.ok) {
        throw new Error(`预约${isEditing ? '更新' : '提交'}失败: ${response.status}`);
      }
      
      // 清空表单
      resetForm();
      
      // 设置成功状态
      setSubmitSuccess(true);
      
      // 重新获取预约列表
      fetchAppointments(currentPage);
      
      // 3秒后清除成功信息
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
      
    } catch (err) {
      setError(`预约${isEditing ? '更新' : '提交'}时出错: ${err instanceof Error ? err.message : String(err)}`);
      console.error('预约提交失败:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setUserName('');
    setPhone('');
    setAppointmentDate(null);
    setAppointmentTime('');
    setContactInfo('');
    setNotes('');
    setIsEditing(false);
    setEditingId(null);
  };

  // 开始编辑预约
  const handleEdit = (appointment: Appointment) => {
    setUserName(appointment.user_name);
    setPhone(appointment.phone);
    setAppointmentDate(appointment.appointment_date ? new Date(appointment.appointment_date) : null);
    setAppointmentTime(appointment.appointment_time);
    setContactInfo(appointment.contact_info || '');
    setNotes(appointment.notes || '');
    setIsEditing(true);
    setEditingId(appointment.id);
    
    // 滚动到表单位置
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 显示删除确认对话框
  const confirmDelete = (id: string) => {
    setAppointmentToDelete(id);
    setShowConfirmDialog(true);
  };

  // 取消删除
  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setAppointmentToDelete(null);
  };

  // 执行删除操作
  const handleDelete = async () => {
    if (!appointmentToDelete) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/appointments/${appointmentToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`删除预约失败: ${response.status}`);
      }
      
      // 重新获取预约列表
      const newTotal = totalAppointments - 1;
      const newTotalPages = Math.ceil(newTotal / pageSize);
      const newPage = currentPage > newTotalPages ? newTotalPages || 1 : currentPage;
      
      await fetchAppointments(newPage);
      
    } catch (err) {
      setError(`删除预约时出错: ${err instanceof Error ? err.message : String(err)}`);
      console.error('删除预约失败:', err);
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setAppointmentToDelete(null);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-black">
      <main className="container mx-auto py-8 px-4">
        {submitSuccess ? (
          <div className="max-w-md mx-auto bg-white rounded-xl p-8 text-center shadow-lg border border-gray-200">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">预约成功！</h2>
            <p className="mb-6 text-gray-600 text-lg">
              您的咨询预约已成功提交，我们将尽快与您联系确认。
            </p>
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            >
              返回预约页面
            </button>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="w-full">
                <div className="flex items-center mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">选择咨询日期</h2>
                  <div className="ml-3 h-1.5 w-8 bg-indigo-500 rounded-full"></div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
                  <div className="w-full max-w-xs mx-auto">
                    <ReactDatePicker
                      selected={appointmentDate}
                      onChange={(date: Date | null) => {
                        setAppointmentDate(date);
                        setAppointmentTime('');
                      }}
                      minDate={new Date()}
                      inline
                      calendarClassName="bg-white text-gray-900 w-full"
                      dayClassName={date => {
                        return 'hover:bg-indigo-500 hover:text-white rounded-md w-10 h-10 flex items-center justify-center text-lg transition-colors';
                      }}
                      monthClassName={() => 'text-gray-900 text-lg font-medium'}
                      weekDayClassName={() => 'text-gray-500 text-lg'}
                      fixedHeight
                      locale={zhCN}
                      formatWeekDay={nameOfDay => 
                        nameOfDay === "星期一" ? "一" : 
                        nameOfDay === "星期二" ? "二" : 
                        nameOfDay === "星期三" ? "三" : 
                        nameOfDay === "星期四" ? "四" : 
                        nameOfDay === "星期五" ? "五" : 
                        nameOfDay === "星期六" ? "六" : "日"
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="w-full">
                <div className="flex items-center mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">选择咨询时间</h2>
                  <div className="ml-3 h-1.5 w-8 bg-indigo-500 rounded-full"></div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  {!appointmentDate ? (
                    <div className="text-center text-gray-500 text-lg py-8 flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      请先选择日期
                    </div>
                  ) : isLoadingTimeSlots ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin h-8 w-8 border-3 border-indigo-500 border-t-transparent rounded-full"></div>
                      <p className="mt-3 text-gray-500 text-lg">加载可用时间段...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {availableTimeSlots.map((slot) => (
                        <label
                          key={slot.time}
                          className={`block w-full p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                            slot.isBooked 
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                              : appointmentTime === slot.time
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-transparent text-white shadow-md transform scale-[1.03]'
                                : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 text-gray-700 hover:shadow-sm'
                          }`}
                        >
                          <input
                            type="radio"
                            name="appointmentTime"
                            value={slot.time}
                            checked={appointmentTime === slot.time}
                            onChange={() => !slot.isBooked && setAppointmentTime(slot.time)}
                            className="sr-only"
                            disabled={slot.isBooked}
                            required
                          />
                          <div className="text-center">
                            <span className="text-md font-medium">{slot.time}</span>
                            {slot.isBooked && (
                              <div className="text-sm mt-1 text-gray-400 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                已预约
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-3">
                <h2 className="text-2xl font-bold text-gray-900">{isEditing ? '编辑预约' : '填写个人信息'}</h2>
                <div className="ml-3 h-1.5 w-8 bg-indigo-500 rounded-full"></div>
              </div>
              <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                {error && (
                  <div className="mb-5 bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-base">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}
                
                <div className="space-y-5">
                  <div>
                    <label htmlFor="user_name" className="block text-base font-medium mb-2 text-gray-700">
                      姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="user_name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 text-lg transition-all"
                      placeholder="请输入姓名"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-base font-medium mb-2 text-gray-700">
                      手机号码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 text-lg transition-all"
                      placeholder="例如：13812345678"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="contactInfo" className="block text-base font-medium mb-2 text-gray-700">
                      其他联系方式（选填）
                    </label>
                    <input
                      type="text"
                      id="contactInfo"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 text-lg transition-all"
                      placeholder="微信、邮箱等"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="notes" className="block text-base font-medium mb-2 text-gray-700">
                      备注信息（选填）
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 text-lg transition-all resize-none"
                    />
                  </div>
                  
                  <div className="pt-3">
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="w-full mb-3 py-3 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 text-lg shadow-sm"
                      >
                        取消编辑
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          提交中...
                        </span>
                      ) : isEditing ? '更新预约' : '提交预约'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white py-6 mt-12 border-t border-gray-200 text-center">
        <div className="container mx-auto px-4">
          <p className="text-gray-500">© {new Date().getFullYear()} 预约系统 | 版权所有</p>
        </div>
      </footer>

      {/* 删除确认对话框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-medium mb-4">确认删除</h3>
            <p className="text-gray-300 mb-6">您确定要删除这条预约记录吗？此操作无法撤销。</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-zinc-700 text-white rounded-md hover:bg-zinc-600"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
