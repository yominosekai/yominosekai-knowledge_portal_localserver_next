'use client';

import React, { useState, useEffect } from 'react';

interface LearningActivity {
  id: string;
  title: string;
  date: string;
  status: 'completed' | 'in_progress' | 'not_started';
  type: string;
}

interface LearningCalendarProps {
  activities: LearningActivity[];
  className?: string;
}

export function LearningCalendar({ activities, className = '' }: LearningCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // カレンダーの日付を生成
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // 指定された日付の活動を取得
  const getActivitiesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return activities.filter(activity => 
      activity.date.startsWith(dateStr)
    );
  };

  // 日付の活動状況を取得
  const getDateStatus = (date: Date) => {
    const dayActivities = getActivitiesForDate(date);
    if (dayActivities.length === 0) return 'none';
    
    const hasCompleted = dayActivities.some(a => a.status === 'completed');
    const hasInProgress = dayActivities.some(a => a.status === 'in_progress');
    
    if (hasCompleted) return 'completed';
    if (hasInProgress) return 'in_progress';
    return 'not_started';
  };

  // 月を変更
  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // 今日の日付かどうか
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 現在の月かどうか
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {currentDate.getFullYear()}年{monthNames[currentDate.getMonth()]}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => changeMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            ←
          </button>
          <button
            onClick={() => changeMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['日', '月', '火', '水', '木', '金', '土'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const status = getDateStatus(date);
          const dayActivities = getActivitiesForDate(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

          return (
            <button
              key={index}
              onClick={() => setSelectedDate(date)}
              className={`
                relative p-2 h-12 text-sm rounded-md transition-colors
                ${!isCurrentMonthDay ? 'text-gray-300' : 'text-gray-700'}
                ${isTodayDate ? 'bg-blue-100 font-bold' : ''}
                ${isSelected ? 'bg-blue-200' : 'hover:bg-gray-100'}
                ${status === 'completed' ? 'bg-green-100' : ''}
                ${status === 'in_progress' ? 'bg-yellow-100' : ''}
                ${status === 'not_started' ? 'bg-red-100' : ''}
              `}
            >
              <div className="flex flex-col items-center">
                <span>{date.getDate()}</span>
                {dayActivities.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {dayActivities.slice(0, 3).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                          status === 'completed' ? 'bg-green-500' :
                          status === 'in_progress' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                      />
                    ))}
                    {dayActivities.length > 3 && (
                      <div className="text-xs text-gray-500">+</div>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 選択された日付の詳細 */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">
            {selectedDate.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </h4>
          {getActivitiesForDate(selectedDate).length > 0 ? (
            <div className="space-y-2">
              {getActivitiesForDate(selectedDate).map(activity => (
                <div
                  key={activity.id}
                  className={`p-3 rounded-md ${
                    activity.status === 'completed' ? 'bg-green-50 border-l-4 border-green-500' :
                    activity.status === 'in_progress' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                    'bg-red-50 border-l-4 border-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-800">{activity.title}</h5>
                      <p className="text-sm text-gray-600">{activity.type}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                      activity.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {activity.status === 'completed' ? '完了' :
                       activity.status === 'in_progress' ? '進行中' : '未開始'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">この日の学習活動はありません</p>
          )}
        </div>
      )}

      {/* 凡例 */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 rounded"></div>
          <span className="text-gray-600">完了</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-100 rounded"></div>
          <span className="text-gray-600">進行中</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 rounded"></div>
          <span className="text-gray-600">未開始</span>
        </div>
      </div>
    </div>
  );
}


