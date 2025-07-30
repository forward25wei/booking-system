import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { format, isValid, parseISO } from 'date-fns';

/**
 * 统计API，用于获取预约数据分析
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const mode = searchParams.get('mode') || 'summary'; // summary 或 detail
    
    // 验证日期参数
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: '缺少日期参数' },
        { status: 400 }
      );
    }
    
    // 解析日期
    const parsedStartDate = parseISO(startDate);
    const parsedEndDate = parseISO(endDate);
    
    if (!isValid(parsedStartDate) || !isValid(parsedEndDate)) {
      return NextResponse.json(
        { error: '日期格式不正确' },
        { status: 400 }
      );
    }
    
    // 格式化日期为PostgreSQL格式
    const formattedStartDate = format(parsedStartDate, 'yyyy-MM-dd');
    const formattedEndDate = format(parsedEndDate, 'yyyy-MM-dd');
    
    // 如果请求明细数据，返回分页的预约记录
    if (mode === 'detail') {
      const offset = (page - 1) * pageSize;
      
      // 获取总记录数
      const totalCount = await sql`
        SELECT COUNT(*) as count 
        FROM appointments 
        WHERE appointment_date::date >= ${formattedStartDate}::date 
        AND appointment_date::date <= ${formattedEndDate}::date
      `;
      
      // 获取分页数据
      const records = await sql`
        SELECT 
          id, 
          user_name, 
          phone, 
          contact_info, 
          appointment_date, 
          appointment_time, 
          notes, 
          created_at, 
          updated_at
        FROM appointments 
        WHERE appointment_date::date >= ${formattedStartDate}::date 
        AND appointment_date::date <= ${formattedEndDate}::date 
        ORDER BY appointment_date DESC, appointment_time ASC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      
      return NextResponse.json({
        records: records,
        pagination: {
          total: parseInt(totalCount[0].count),
          page,
          pageSize,
          totalPages: Math.ceil(parseInt(totalCount[0].count) / pageSize)
        }
      });
    }
    
    // 否则返回统计摘要数据
    
    // 获取总预约数
    const totalAppointments = await sql`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE appointment_date::date >= ${formattedStartDate}::date 
      AND appointment_date::date <= ${formattedEndDate}::date
    `;
    
    // 获取总用户数（不重复计算）
    const totalUsers = await sql`
      SELECT COUNT(DISTINCT user_name) as count 
      FROM appointments 
      WHERE appointment_date::date >= ${formattedStartDate}::date 
      AND appointment_date::date <= ${formattedEndDate}::date
    `;
    
    // 按日期统计预约数
    const byDate = await sql`
      SELECT appointment_date::date as date, COUNT(*) as count 
      FROM appointments 
      WHERE appointment_date::date >= ${formattedStartDate}::date 
      AND appointment_date::date <= ${formattedEndDate}::date 
      GROUP BY appointment_date::date 
      ORDER BY appointment_date::date
    `;
    
    // 按时间段统计预约数
    const byTimeSlot = await sql`
      SELECT appointment_time as "timeSlot", COUNT(*) as count 
      FROM appointments 
      WHERE appointment_date::date >= ${formattedStartDate}::date 
      AND appointment_date::date <= ${formattedEndDate}::date 
      GROUP BY appointment_time 
      ORDER BY count DESC
    `;
    
    // 按用户名统计预约数
    const byUser = await sql`
      SELECT user_name as "userName", COUNT(*) as count 
      FROM appointments 
      WHERE appointment_date::date >= ${formattedStartDate}::date 
      AND appointment_date::date <= ${formattedEndDate}::date 
      GROUP BY user_name 
      ORDER BY count DESC 
      LIMIT 10
    `;
    
    // 返回统计结果
    return NextResponse.json({
      totalAppointments: parseInt(totalAppointments[0].count),
      totalUsers: parseInt(totalUsers[0].count),
      byDate: byDate.map(item => ({
        date: item.date,
        count: parseInt(item.count)
      })),
      byTimeSlot: byTimeSlot.map(item => ({
        timeSlot: item.timeSlot,
        count: parseInt(item.count)
      })),
      byUser: byUser.map(item => ({
        userName: item.userName,
        count: parseInt(item.count)
      }))
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { error: '服务器错误，获取统计数据失败' },
      { status: 500 }
    );
  }
} 