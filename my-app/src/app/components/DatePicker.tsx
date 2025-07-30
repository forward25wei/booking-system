'use client';

import React, { useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import { format, addDays } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onChange }) => {
  const today = new Date();

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">选择咨询日期</h2>
      <div className="bg-zinc-800 rounded-lg p-4 flex justify-center">
        <div className="react-datepicker-wrapper w-full max-w-xs">
          <ReactDatePicker
            selected={selectedDate}
            onChange={onChange}
            minDate={today}
            inline
            calendarClassName="bg-zinc-800 text-white w-full"
            dayClassName={date => {
              return 'hover:bg-red-600 rounded-md w-10 h-10 flex items-center justify-center';
            }}
            monthClassName={() => 'text-white'}
            weekDayClassName={() => 'text-gray-400'}
            fixedHeight
          />
        </div>
      </div>
    </div>
  );
};

export default DatePicker;