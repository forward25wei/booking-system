import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';

// 加载环境变量
config();

// 获取数据库连接URL
const databaseUrl = process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('数据库连接URL未设置，请检查环境变量');
}

// 创建SQL客户端
const sql = neon(databaseUrl);

// 创建Drizzle ORM实例
const db = drizzle(sql);

export { sql, db };

// 预约数据接口
export interface Appointment {
  id?: number;
  user_name: string;
  phone: string;
  contact_info?: string;
  appointment_date: Date;
  appointment_time: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

// 数据库操作函数
export async function createAppointment(data: Appointment): Promise<any> {
  try {
    const result = await sql`
      INSERT INTO appointments (
        user_name, phone, contact_info, appointment_date, appointment_time, notes
      ) VALUES (
        ${data.user_name}, ${data.phone}, ${data.contact_info || null}, 
        ${data.appointment_date}, ${data.appointment_time}, ${data.notes || null}
      ) RETURNING *;
    `;
    return result[0];
  } catch (error) {
    console.error('创建预约失败:', error);
    throw error;
  }
}

export async function getAppointments(): Promise<Appointment[]> {
  try {
    const result = await sql`
      SELECT * FROM appointments ORDER BY appointment_date DESC, appointment_time ASC;
    `;
    return result as Appointment[];
  } catch (error) {
    console.error('获取预约列表失败:', error);
    throw error;
  }
}

export async function getAppointmentsByDate(date: Date): Promise<Appointment[]> {
  try {
    const result = await sql`
      SELECT * FROM appointments 
      WHERE appointment_date = ${date} 
      ORDER BY appointment_time ASC;
    `;
    return result as Appointment[];
  } catch (error) {
    console.error('获取指定日期预约失败:', error);
    throw error;
  }
}