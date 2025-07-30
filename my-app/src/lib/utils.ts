import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并类名工具函数
 * 结合 clsx 和 tailwind-merge 实现智能类名合并
 * 支持条件类名、数组类名等
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 