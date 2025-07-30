'use client';

import { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

// 注册ChartJS组件
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// 定义统计数据接口
interface StatData {
  byDate: {
    date: string;
    count: number;
  }[];
  byTimeSlot: {
    timeSlot: string;
    count: number;
  }[];
  byUser: {
    userName: string;
    count: number;
  }[];
  totalAppointments: number;
  totalUsers: number;
}

// 定义预约记录接口
interface AppointmentRecord {
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

// 定义分页数据接口
interface PaginationData {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 定义明细数据接口
interface DetailData {
  records: AppointmentRecord[];
  pagination: PaginationData;
}

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<'charts' | 'records'>('charts');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statData, setStatData] = useState<StatData | null>(null);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 删除确认对话框状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  
  // 编辑操作相关状态和函数
  const router = useRouter();

  // 初始化日期范围为当前月份
  useEffect(() => {
    const now = new Date();
    const firstDay = startOfMonth(now);
    const lastDay = endOfMonth(now);
    
    setStartDate(format(firstDay, 'yyyy-MM-dd'));
    setEndDate(format(lastDay, 'yyyy-MM-dd'));
  }, []);

  // 获取统计数据
  const fetchStatistics = async () => {
    if (!startDate || !endDate) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/statistics?start=${startDate}&end=${endDate}`);
      
      if (!response.ok) {
        throw new Error('获取统计数据失败');
      }
      
      const data = await response.json();
      setStatData(data);
    } catch (err) {
      setError('获取数据时出错：' + (err instanceof Error ? err.message : String(err)));
      console.error('统计数据获取失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取明细数据
  const fetchRecords = async (page = 1) => {
    if (!startDate || !endDate) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/statistics?start=${startDate}&end=${endDate}&mode=detail&page=${page}&pageSize=${pageSize}`);
      
      if (!response.ok) {
        throw new Error('获取预约记录失败');
      }
      
      const data = await response.json();
      setDetailData(data);
      setCurrentPage(page);
    } catch (err) {
      setError('获取预约记录时出错：' + (err instanceof Error ? err.message : String(err)));
      console.error('预约记录获取失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 页面加载时根据当前标签页获取数据
  useEffect(() => {
    if (startDate && endDate) {
      if (activeTab === 'charts') {
        fetchStatistics();
      } else {
        fetchRecords(currentPage);
      }
    }
  }, [startDate, endDate, activeTab]);

  // 切换标签页
  const handleTabChange = (tab: 'charts' | 'records') => {
    setActiveTab(tab);
  };

  // 日期范围变更处理
  const handleDateRangeChange = () => {
    if (activeTab === 'charts') {
      fetchStatistics();
    } else {
      fetchRecords(1); // 搜索条件变更，重置为第一页
    }
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    fetchRecords(page);
  };

  // 处理删除预约
  const handleDeleteAppointment = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('删除预约失败');
      }
      
      // 重新获取数据
      fetchRecords(currentPage);
      setError(null);
    } catch (err) {
      setError('删除预约时出错：' + (err instanceof Error ? err.message : String(err)));
      console.error('删除预约失败:', err);
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setAppointmentToDelete(null);
    }
  };

  // 日期按日分布数据
  const dateChartData = {
    labels: statData?.byDate.map(item => format(parseISO(item.date), 'MM-dd')) || [],
    datasets: [
      {
        label: '预约数量',
        data: statData?.byDate.map(item => item.count) || [],
        backgroundColor: 'rgba(0, 112, 243, 0.2)',
        borderColor: 'rgba(0, 112, 243, 1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(0, 112, 243, 1)',
        pointHoverRadius: 6,
        fill: true,
      },
    ],
  };

  // 时间段分布数据
  const timeSlotChartData = {
    labels: statData?.byTimeSlot.map(item => item.timeSlot) || [],
    datasets: [
      {
        label: '预约数量',
        data: statData?.byTimeSlot.map(item => item.count) || [],
        backgroundColor: [
          'rgba(0, 112, 243, 0.6)',
          'rgba(82, 196, 26, 0.6)',
          'rgba(250, 173, 20, 0.6)',
          'rgba(245, 34, 45, 0.6)',
          'rgba(114, 46, 209, 0.6)',
          'rgba(16, 185, 129, 0.6)',
        ],
        borderColor: [
          'rgba(0, 112, 243, 1)',
          'rgba(82, 196, 26, 1)',
          'rgba(250, 173, 20, 1)',
          'rgba(245, 34, 45, 1)',
          'rgba(114, 46, 209, 1)',
          'rgba(16, 185, 129, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // 用户分布数据
  const userChartData = {
    labels: statData?.byUser.map(item => item.userName) || [],
    datasets: [
      {
        label: '预约次数',
        data: statData?.byUser.map(item => item.count) || [],
        backgroundColor: 'rgba(82, 196, 26, 0.6)',
        borderColor: 'rgba(82, 196, 26, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-3xl font-bold mb-6 text-heading-color">预约系统统计分析</h1>
      
      {/* 顶部卡片区域 */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* 日期筛选 */}
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-3 text-heading-color">查询条件</h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="input-label">开始日期</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-control"
                />
              </div>
              <div className="flex-1">
                <label className="input-label">结束日期</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-control"
                />
              </div>
              <div>
                <button
                  onClick={handleDateRangeChange}
                  className="btn-primary flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="loading-spinner mr-2"></div>
                      查询中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                      查询
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* 总览卡片 */}
          {statData && (
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-3 text-heading-color">数据总览</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="stat-card primary">
                  <div className="stat-title">总预约数</div>
                  <div className="stat-value">{statData.totalAppointments}</div>
                </div>
                <div className="stat-card success">
                  <div className="stat-title">总用户数</div>
                  <div className="stat-value">{statData.totalUsers}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      
        {/* 数据视图切换标签 */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button 
              onClick={() => handleTabChange('charts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'charts' 
                  ? 'border-primary-color text-primary-color' 
                  : 'border-transparent text-text-secondary hover:border-gray-300'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                图表分析
              </span>
            </button>
            <button 
              onClick={() => handleTabChange('records')}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'records' 
                  ? 'border-primary-color text-primary-color' 
                  : 'border-transparent text-text-secondary hover:border-gray-300'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                预约记录
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* 图表内容 */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="loading-spinner w-12 h-12 border-4"></div>
            </div>
          ) : !statData ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h3 className="empty-state-title">暂无统计数据</h3>
              <p className="empty-state-desc">请调整查询日期范围后重试</p>
            </div>
          ) : (
            <>
              {/* 图表区域 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h2 className="text-xl font-semibold mb-4 text-heading-color">日期分布</h2>
                  {statData.byDate.length > 0 ? (
                    <div className="h-80">
                      <Line 
                        data={dateChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                precision: 0
                              }
                            }
                          },
                          plugins: {
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              titleFont: {
                                weight: 'bold',
                              },
                              padding: 10,
                              displayColors: false,
                            },
                            legend: {
                              position: 'top',
                              labels: {
                                color: '#595959',
                                usePointStyle: true,
                                padding: 15,
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="empty-state py-8">
                      <div className="empty-state-icon">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <p className="empty-state-desc">暂无日期分布数据</p>
                    </div>
                  )}
                </div>
                
                <div className="card p-6">
                  <h2 className="text-xl font-semibold mb-4 text-heading-color">用户预约排行</h2>
                  {statData.byUser.length > 0 ? (
                    <div className="h-80">
                      <Bar 
                        data={userChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                precision: 0
                              }
                            }
                          },
                          plugins: {
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              titleFont: {
                                weight: 'bold',
                              },
                              padding: 10,
                            },
                            legend: {
                              position: 'top',
                              labels: {
                                color: '#595959',
                                usePointStyle: true,
                                padding: 15,
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="empty-state py-8">
                      <div className="empty-state-icon">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                      <p className="empty-state-desc">暂无用户排行数据</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4 text-heading-color">时间段分布</h2>
                {statData.byTimeSlot.length > 0 ? (
                  <div className="max-w-md mx-auto h-80">
                    <Pie 
                      data={timeSlotChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            titleFont: {
                              weight: 'bold',
                            },
                            padding: 10,
                          },
                          legend: {
                            position: 'right',
                            labels: {
                              color: '#595959',
                              usePointStyle: true,
                              padding: 15,
                            }
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="empty-state py-8">
                    <div className="empty-state-icon">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <p className="empty-state-desc">暂无时间段分布数据</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 预约记录表格 */}
      {activeTab === 'records' && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4 text-heading-color">预约详细记录</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="loading-spinner w-12 h-12 border-4"></div>
            </div>
          ) : detailData?.records.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="whitespace-nowrap">预约日期</th>
                      <th className="whitespace-nowrap">时间段</th>
                      <th className="whitespace-nowrap">用户姓名</th>
                      <th className="whitespace-nowrap">手机号码</th>
                      <th className="whitespace-nowrap">其他联系方式</th>
                      <th className="whitespace-nowrap">备注</th>
                      <th className="whitespace-nowrap">创建时间</th>
                      <th className="whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailData.records.map((record) => (
                      <tr key={record.id}>
                        <td className="whitespace-nowrap">
                          {format(parseISO(record.appointment_date), 'yyyy-MM-dd')}
                        </td>
                        <td className="whitespace-nowrap">
                          <span className="status-tag status-tag-success">{record.appointment_time}</span>
                        </td>
                        <td className="whitespace-nowrap">{record.user_name}</td>
                        <td className="whitespace-nowrap">{record.phone}</td>
                        <td>{record.contact_info || '无'}</td>
                        <td>{record.notes || '无'}</td>
                        <td className="whitespace-nowrap">
                          {format(parseISO(record.created_at), 'yyyy-MM-dd HH:mm')}
                        </td>
                        <td className="whitespace-nowrap">
                          <button
                            onClick={() => {
                              setShowConfirmDialog(true);
                              setAppointmentToDelete(record.id);
                            }}
                            className="text-red-500 hover:text-red-700 mr-2"
                          >
                            删除
                          </button>
                          <button
                            onClick={() => {
                              router.push(`/statistics/edit/${record.id}`);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            编辑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 分页控件 */}
              {detailData.pagination.totalPages > 1 && (
                <div className="mt-6">
                  <ul className="pagination">
                    <li>
                      <button 
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className={`${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        首页
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        上一页
                      </button>
                    </li>
                    
                    {Array.from({ length: Math.min(5, detailData.pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (detailData.pagination.totalPages <= 5) {
                        // 如果总页数小于等于5，直接显示1到totalPages
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        // 如果当前页小于等于3，显示1到5
                        pageNum = i + 1;
                      } else if (currentPage >= detailData.pagination.totalPages - 2) {
                        // 如果当前页接近末尾，显示最后5页
                        pageNum = detailData.pagination.totalPages - 4 + i;
                      } else {
                        // 否则显示当前页及其前后各2页
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <li key={pageNum}>
                          <button
                            onClick={() => handlePageChange(pageNum)}
                            className={currentPage === pageNum ? 'active' : ''}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    })}
                    
                    <li>
                      <button 
                        onClick={() => handlePageChange(Math.min(detailData.pagination.totalPages, currentPage + 1))}
                        disabled={currentPage === detailData.pagination.totalPages}
                        className={`${currentPage === detailData.pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        下一页
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => handlePageChange(detailData.pagination.totalPages)}
                        disabled={currentPage === detailData.pagination.totalPages}
                        className={`${currentPage === detailData.pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        末页
                      </button>
                    </li>
                  </ul>
                  <div className="text-center text-text-secondary text-sm mt-2">
                    共 {detailData.pagination.total} 条记录，当前 {currentPage}/{detailData.pagination.totalPages} 页
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <svg className="w-16 h-16 empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 className="empty-state-title">暂无预约记录</h3>
              <p className="empty-state-desc">请尝试调整筛选条件或创建新预约</p>
            </div>
          )}
        </div>
      )}

      {/* 删除确认对话框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 text-heading-color">确认删除</h2>
            <p className="text-text-secondary mb-6">您确定要删除该预约记录吗？此操作无法撤销。</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setAppointmentToDelete(null);
                }}
                className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (appointmentToDelete) {
                    handleDeleteAppointment(appointmentToDelete);
                  }
                }}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
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