'use client';

import React from 'react';

export interface UserFormData {
  user_name: string;
  phone: string;
  contact_info: string;
  notes: string;
}

interface UserFormProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  isEditing?: boolean;
  initialData?: UserFormData;
}

export default function UserForm({ 
  onSubmit, 
  isSubmitting, 
  isEditing = false,
  initialData
}: UserFormProps) {
  return (
    <div className="bg-zinc-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">
        {isEditing ? '编辑预约信息' : '填写您的信息'}
      </h2>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="user_name" className="block text-sm font-medium mb-1">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="user_name"
            name="user_name"
            className="w-full p-2 rounded-md bg-zinc-700 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="请输入您的姓名"
            required
          />
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            手机号码 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="w-full p-2 rounded-md bg-zinc-700 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="请输入您的手机号码"
            required
          />
        </div>
        
        <div>
          <label htmlFor="contactInfo" className="block text-sm font-medium mb-1">
            其他联系方式
          </label>
          <input
            type="text"
            id="contactInfo"
            name="contactInfo"
            className="w-full p-2 rounded-md bg-zinc-700 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="微信/邮箱等（选填）"
          />
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            备注信息
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="w-full p-2 rounded-md bg-zinc-700 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="您可以在这里填写其他需要说明的信息（选填）"
          ></textarea>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-6 py-2 px-4 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-red-600"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              处理中...
            </span>
          ) : (
            <span>{isEditing ? '更新预约' : '提交预约'}</span>
          )}
        </button>
      </form>
    </div>
  );
}