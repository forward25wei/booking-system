import { NextRequest, NextResponse } from 'next/server';
import { createAppointment, getAppointments, getAppointmentsByDate } from '@/lib/db';

// 处理POST请求 - 创建新预约
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 数据验证
    if (!data.user_name || !data.phone || !data.appointment_date || !data.appointment_time) {
      return NextResponse.json(
        { error: '缺少必要字段：姓名、手机号、预约日期和时间段都是必填项' },
        { status: 400 }
      );
    }
    
    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(data.phone)) {
      return NextResponse.json(
        { error: '手机号格式不正确' },
        { status: 400 }
      );
    }
    
    // 转换日期格式
    const appointmentDate = new Date(data.appointment_date);
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: '预约日期格式不正确' },
        { status: 400 }
      );
    }
    
    // 创建预约记录
    const appointment = await createAppointment({
      user_name: data.user_name,
      phone: data.phone,
      contact_info: data.contactInfo,
      appointment_date: appointmentDate,
      appointment_time: data.appointment_time,
      notes: data.notes
    });
    
    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error) {
    console.error('创建预约失败:', error);
    return NextResponse.json(
      { error: '服务器错误，预约创建失败' },
      { status: 500 }
    );
  }
}

// 处理GET请求 - 获取预约列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '5');
    
    let appointments;
    let totalAppointments = 0;
    
    if (date) {
      // 如果提供了日期参数，获取特定日期的预约
      const appointmentDate = new Date(date);
      if (isNaN(appointmentDate.getTime())) {
        return NextResponse.json(
          { error: '日期格式不正确' },
          { status: 400 }
        );
      }
      appointments = await getAppointmentsByDate(appointmentDate);
      totalAppointments = appointments.length;
      
      // 简单的内存分页
      appointments = appointments.slice((page - 1) * pageSize, page * pageSize);
    } else {
      // 获取所有预约并进行分页
      const allAppointments = await getAppointments();
      totalAppointments = allAppointments.length;
      
      // 简单的内存分页
      appointments = allAppointments.slice((page - 1) * pageSize, page * pageSize);
    }
    
    const totalPages = Math.ceil(totalAppointments / pageSize);
    
    return NextResponse.json({ 
      success: true, 
      appointments: appointments,
      pagination: {
        total: totalAppointments,
        page: page,
        pageSize: pageSize,
        totalPages: totalPages
      }
    });
  } catch (error) {
    console.error('获取预约列表失败:', error);
    return NextResponse.json(
      { error: '服务器错误，获取预约列表失败' },
      { status: 500 }
    );
  }
}