import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// 验证手机号格式
function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// 验证日期格式
function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && Boolean(dateString.match(/^\d{4}-\d{2}-\d{2}$/));
}

// 获取单个预约
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    const result = await sql`
      SELECT * FROM appointments WHERE id = ${id}
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: '预约记录不存在' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('获取预约详情时出错:', error);
    return NextResponse.json({ error: '获取预约详情失败' }, { status: 500 });
  }
}

// 更新预约
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // 验证必填字段
    if (!body.user_name || !body.phone || !body.appointment_date || !body.appointment_time) {
      return NextResponse.json({ error: '姓名、手机号、预约日期和时间段不能为空' }, { status: 400 });
    }
    
    // 验证手机号格式
    if (!validatePhone(body.phone)) {
      return NextResponse.json({ error: '手机号格式不正确' }, { status: 400 });
    }
    
    // 验证日期格式
    if (!validateDate(body.appointment_date)) {
      return NextResponse.json({ error: '日期格式不正确' }, { status: 400 });
    }
    
    // 检查预约是否存在
    const existingResult = await sql`
      SELECT id FROM appointments WHERE id = ${id}
    `;
    
    if (existingResult.length === 0) {
      return NextResponse.json({ error: '预约记录不存在' }, { status: 404 });
    }
    
    // 更新预约记录
    const result = await sql`
      UPDATE appointments 
      SET user_name = ${body.user_name},
          phone = ${body.phone},
          appointment_date = ${body.appointment_date},
          appointment_time = ${body.appointment_time},
          contact_info = ${body.contact_info || null},
          notes = ${body.notes || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('更新预约时出错:', error);
    return NextResponse.json({ error: '更新预约失败' }, { status: 500 });
  }
}

// 删除预约
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    // 检查预约是否存在
    const existingResult = await sql`
      SELECT id FROM appointments WHERE id = ${id}
    `;
    
    if (existingResult.length === 0) {
      return NextResponse.json({ error: '预约记录不存在' }, { status: 404 });
    }
    
    // 删除预约记录
    await sql`
      DELETE FROM appointments WHERE id = ${id}
    `;
    
    return NextResponse.json({ success: true, message: '预约删除成功' });
  } catch (error) {
    console.error('删除预约时出错:', error);
    return NextResponse.json({ error: '删除预约失败' }, { status: 500 });
  }
}