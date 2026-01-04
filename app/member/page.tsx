'use client';

import { useEffect, useState } from 'react';

interface Member {
  id: string;
  name: string;
}

interface Court {
  id: string;
  name: string;
  address: string;
  googleMapLink: string;
  pricePerHour: number;
}

interface Fund {
  id: string;
  memberID: string;
  amount: number;
}

interface Payment {
  id: string;
  scheduleID: string;
  memberID: string;
  courtShare: number;
  racketShare: number;
  waterShare: number;
}

interface Schedule {
  id: string;
  courtID: string;
  date: string;
  startTime: string;
  hours: number;
  numberOfCourts: number;
  courtPrice: number;
  totalCourtPrice?: number; // Calculated: numberOfCourts * hours * pricePerHour
  racketPrice: number;
  waterPrice: number;
  participants: string[];
  status: string;
  court: Court | null;
}

interface MemberFinancialInfo {
  memberID: string;
  totalFunds: number;
  totalPayments: number;
  balance: number;
}

export default function MemberPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedulesRes, membersRes, fundsRes, paymentsRes] = await Promise.all([
        fetch('/api/schedulesmember'),
        fetch('/api/members'),
        fetch('/api/funds'),
        fetch('/api/payments'),
      ]);
      
      if (!schedulesRes.ok) {
        console.error('Failed to fetch schedules:', schedulesRes.status, await schedulesRes.text());
      }
      if (!membersRes.ok) {
        console.error('Failed to fetch members:', membersRes.status);
      }
      if (!fundsRes.ok) {
        console.error('Failed to fetch funds:', fundsRes.status);
      }
      if (!paymentsRes.ok) {
        console.error('Failed to fetch payments:', paymentsRes.status);
      }
      
      let schedulesData = [];
      let membersData = [];
      let fundsData = [];
      let paymentsData = [];
      
      try {
        if (schedulesRes.ok) {
          schedulesData = await schedulesRes.json();
        } else {
          const errorText = await schedulesRes.text();
          console.error('Schedules API error:', schedulesRes.status, errorText);
        }
      } catch (error) {
        console.error('Error parsing schedules response:', error);
      }
      
      try {
        if (membersRes.ok) {
          membersData = await membersRes.json();
        }
      } catch (error) {
        console.error('Error parsing members response:', error);
      }
      
      try {
        if (fundsRes.ok) {
          fundsData = await fundsRes.json();
        }
      } catch (error) {
        console.error('Error parsing funds response:', error);
      }
      
      try {
        if (paymentsRes.ok) {
          paymentsData = await paymentsRes.json();
        }
      } catch (error) {
        console.error('Error parsing payments response:', error);
      }
      
      console.log('Fetched data:', {
        schedules: Array.isArray(schedulesData) ? schedulesData.length : 0,
        members: Array.isArray(membersData) ? membersData.length : 0,
        funds: Array.isArray(fundsData) ? fundsData.length : 0,
        payments: Array.isArray(paymentsData) ? paymentsData.length : 0,
      });
      
      console.log('Schedules data:', schedulesData);
      console.log('Schedules response status:', schedulesRes.status);
      console.log('Schedules response ok:', schedulesRes.ok);
      
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setFunds(Array.isArray(fundsData) ? fundsData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSchedules([]);
      setMembers([]);
      setFunds([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const getMemberFinancialInfo = (memberID: string): MemberFinancialInfo => {
    const totalFunds = funds
      .filter(f => f.memberID === memberID)
      .reduce((sum, f) => sum + f.amount, 0);
    
    const totalPayments = payments
      .filter(p => p.memberID === memberID)
      .reduce((sum, p) => sum + p.courtShare + p.racketShare + p.waterShare, 0);
    
    const balance = totalFunds - totalPayments;
    
    return {
      memberID,
      totalFunds,
      totalPayments,
      balance,
    };
  };

  const generateCalendarLink = (schedule: Schedule) => {
    try {
      const date = new Date(schedule.date);
      const [hours, minutes] = schedule.startTime.split(':').map(Number);
      const startDateTime = new Date(date);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(startDateTime.getHours() + schedule.hours);

      // Format dates for Google Calendar (YYYYMMDDTHHMMSS)
      const formatDate = (d: Date) => {
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const title = encodeURIComponent(`Chơi Pickleball - ${schedule.court?.name || 'Sân'}`);
      const totalPrice = (schedule.totalCourtPrice || schedule.courtPrice) + schedule.racketPrice + schedule.waterPrice;
      const description = encodeURIComponent(
        `Địa chỉ: ${schedule.court?.address || ''}\n` +
        `Số sân: ${schedule.numberOfCourts || 1}\n` +
        `Thành viên: ${schedule.participants.map((id: string) => members.find(m => m.id === id)?.name).filter(Boolean).join(', ')}\n` +
        `Giá: ${totalPrice.toLocaleString('vi-VN')} VNĐ`
      );
      const location = encodeURIComponent(schedule.court?.address || '');

      // Google Calendar URL
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(startDateTime)}/${formatDate(endDateTime)}&details=${description}&location=${location}`;

      return googleCalendarUrl;
    } catch (error) {
      console.error('Error generating calendar link:', error);
      return '';
    }
  };

  const downloadICS = (schedule: Schedule) => {
    try {
      const date = new Date(schedule.date);
      const [hours, minutes] = schedule.startTime.split(':').map(Number);
      const startDateTime = new Date(date);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(startDateTime.getHours() + schedule.hours);

      const formatDate = (d: Date) => {
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const totalPrice = (schedule.totalCourtPrice || schedule.courtPrice) + schedule.racketPrice + schedule.waterPrice;
      const title = `Chơi Pickleball - ${schedule.court?.name || 'Sân'}`;
      const description = `Địa chỉ: ${schedule.court?.address || ''}\\nSố sân: ${schedule.numberOfCourts || 1}\\nThành viên: ${schedule.participants.map((id: string) => members.find(m => m.id === id)?.name).filter(Boolean).join(', ')}\\nGiá: ${totalPrice.toLocaleString('vi-VN')} VNĐ`;
      const location = schedule.court?.address || '';

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Pickleball Manager//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `DTSTART:${formatDate(startDateTime)}`,
        `DTEND:${formatDate(endDateTime)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `pickleball-${schedule.date}-${schedule.startTime}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading ICS:', error);
    }
  };


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Thông tin chung</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow p-3 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Lịch chơi sắp tới</h2>
          {schedules.length === 0 ? (
            <div className="text-gray-500">
              <p>Không có lịch chơi nào</p>
              <p className="text-sm mt-2 text-gray-400">Vui lòng thêm lịch chơi trong trang admin</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => {
                const participantNames = schedule.participants
                  .map((id: string) => members.find(m => m.id === id)?.name)
                  .filter(Boolean)
                  .join(', ');

                // Determine schedule status
                const getScheduleStatus = () => {
                  try {
                    const scheduleDate = new Date(schedule.date);
                    const [hours, minutes] = schedule.startTime.split(':').map(Number);
                    const scheduleDateTime = new Date(scheduleDate);
                    scheduleDateTime.setHours(hours, minutes, 0, 0);
                    
                    const endDateTime = new Date(scheduleDateTime);
                    endDateTime.setHours(scheduleDateTime.getHours() + schedule.hours);
                    
                    const now = new Date();
                    
                    if (now < scheduleDateTime) {
                      return { text: 'Sắp diễn ra', color: 'bg-blue-100 text-blue-800' };
                    } else if (now >= scheduleDateTime && now < endDateTime) {
                      return { text: 'Đang diễn ra', color: 'bg-green-100 text-green-800' };
                    } else {
                      // Past event
                      if (schedule.status === 'done') {
                        return { text: 'Đã tính', color: 'bg-gray-100 text-gray-800' };
                      } else {
                        return { text: 'Chưa tính', color: 'bg-yellow-100 text-yellow-800' };
                      }
                    }
                  } catch {
                    return { text: 'Chưa tính', color: 'bg-yellow-100 text-yellow-800' };
                  }
                };

                const status = getScheduleStatus();

                return (
                  <div key={schedule.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="mb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {schedule.court?.name || 'Sân không xác định'}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full w-fit ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {new Date(schedule.date).toLocaleDateString('vi-VN')} - {schedule.startTime} ({schedule.hours} giờ)
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Số sân: {schedule.numberOfCourts || 1}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                        Thành viên ({schedule.participants.length}): {participantNames || 'Chưa có'}
                      </p>
                    </div>
                    
                    {schedule.court && (
                      <>
                        <p className="text-xs sm:text-sm text-gray-700 mb-2 break-words">
                          <span className="font-medium">Địa chỉ:</span> {schedule.court.address}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                          {schedule.court.googleMapLink && (
                            <a
                              href={schedule.court.googleMapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs sm:text-sm inline-flex items-center gap-1 w-fit"
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="whitespace-nowrap">Xem trên Google Maps</span>
                            </a>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={generateCalendarLink(schedule)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800 text-xs sm:text-sm inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="whitespace-nowrap">Thêm vào Google Calendar</span>
                            </a>
                            <button
                              onClick={() => downloadICS(schedule)}
                              className="text-purple-600 hover:text-purple-800 text-xs sm:text-sm inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="whitespace-nowrap">Tải file .ics</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-600 block mb-1">Giá sân:</span>
                          <p className="font-medium">{(schedule.totalCourtPrice || schedule.courtPrice).toLocaleString('vi-VN')} VNĐ</p>
                          <p className="text-xs text-gray-500 mt-1">
                            ({schedule.numberOfCourts || 1} sân × {schedule.hours} giờ × {schedule.court?.pricePerHour?.toLocaleString('vi-VN') || 0} VNĐ/giờ)
                          </p>
                        </div>
                        {schedule.racketPrice > 0 && (
                          <div>
                            <span className="text-gray-600 block mb-1">Giá vợt:</span>
                            <p className="font-medium">{schedule.racketPrice.toLocaleString('vi-VN')} VNĐ</p>
                          </div>
                        )}
                        {schedule.waterPrice > 0 && (
                          <div>
                            <span className="text-gray-600 block mb-1">Giá nước:</span>
                            <p className="font-medium">{schedule.waterPrice.toLocaleString('vi-VN')} VNĐ</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600 block mb-1">Tổng:</span>
                          <p className="font-medium text-base sm:text-lg">
                            {((schedule.totalCourtPrice || schedule.courtPrice) + schedule.racketPrice + schedule.waterPrice).toLocaleString('vi-VN')} VNĐ
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold">Tổng kết quỹ chi tiêu</h2>
          </div>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thành viên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiền quỹ đã đóng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền đã chi tiêu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiền quỹ còn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiền còn nợ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => {
                  const info = getMemberFinancialInfo(member.id);
                  return (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {member.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {info.totalFunds.toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                        {info.totalPayments.toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {info.balance > 0 ? (
                          <span className="text-green-600 font-medium">
                            {info.balance.toLocaleString('vi-VN')} VNĐ
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {info.balance < 0 ? (
                          <span className="text-red-600 font-medium">
                            {Math.abs(info.balance).toLocaleString('vi-VN')} VNĐ
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {members.map((member) => {
              const info = getMemberFinancialInfo(member.id);
              return (
                <div key={member.id} className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{member.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tiền quỹ đã đóng:</span>
                      <span className="text-gray-900 font-medium">{info.totalFunds.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền đã chi tiêu:</span>
                      <span className="text-orange-600 font-medium">{info.totalPayments.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tiền quỹ còn:</span>
                      {info.balance > 0 ? (
                        <span className="text-green-600 font-medium">
                          {info.balance.toLocaleString('vi-VN')} VNĐ
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tiền còn nợ:</span>
                      {info.balance < 0 ? (
                        <span className="text-red-600 font-medium">
                          {Math.abs(info.balance).toLocaleString('vi-VN')} VNĐ
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

