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
  courtPrice: number;
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
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedulesRes, membersRes, fundsRes, paymentsRes] = await Promise.all([
        fetch('/api/schedules/week'),
        fetch('/api/members'),
        fetch('/api/funds'),
        fetch('/api/payments'),
      ]);
      
      const schedulesData = schedulesRes.ok ? await schedulesRes.json() : [];
      const membersData = membersRes.ok ? await membersRes.json() : [];
      const fundsData = fundsRes.ok ? await fundsRes.json() : [];
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : [];
      
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
      const description = encodeURIComponent(
        `Địa chỉ: ${schedule.court?.address || ''}\n` +
        `Thành viên: ${schedule.participants.map((id: string) => members.find(m => m.id === id)?.name).filter(Boolean).join(', ')}\n` +
        `Giá: ${(schedule.courtPrice + schedule.racketPrice + schedule.waterPrice).toLocaleString('vi-VN')} VNĐ`
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

      const title = `Chơi Pickleball - ${schedule.court?.name || 'Sân'}`;
      const description = `Địa chỉ: ${schedule.court?.address || ''}\\nThành viên: ${schedule.participants.map((id: string) => members.find(m => m.id === id)?.name).filter(Boolean).join(', ')}\\nGiá: ${(schedule.courtPrice + schedule.racketPrice + schedule.waterPrice).toLocaleString('vi-VN')} VNĐ`;
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

  const handleEditParticipants = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setSelectedParticipants([...schedule.participants]);
  };

  const toggleParticipant = (memberID: string) => {
    setSelectedParticipants(prev =>
      prev.includes(memberID)
        ? prev.filter(id => id !== memberID)
        : [...prev, memberID]
    );
  };

  const handleSaveParticipants = async () => {
    if (!editingSchedule) return;

    try {
      const response = await fetch('/api/schedules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSchedule.id,
          participants: selectedParticipants,
        }),
      });

      if (response.ok) {
        setEditingSchedule(null);
        setSelectedParticipants([]);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating participants:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Thông tin chung</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Lịch chơi tuần này</h2>
          {schedules.length === 0 ? (
            <p className="text-gray-500">Không có lịch chơi nào trong tuần này</p>
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
                  <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {schedule.court?.name || 'Sân không xác định'}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(schedule.date).toLocaleDateString('vi-VN')} - {schedule.startTime} ({schedule.hours} giờ)
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Thành viên: {participantNames || 'Chưa có'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditParticipants(schedule)}
                        className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        title="Chỉnh sửa thành viên tham gia"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Chỉnh sửa
                      </button>
                    </div>
                    
                    {schedule.court && (
                      <>
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-medium">Địa chỉ:</span> {schedule.court.address}
                        </p>
                        <div className="flex items-center gap-3 mb-3">
                          {schedule.court.googleMapLink && (
                            <a
                              href={schedule.court.googleMapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Xem trên Google Maps
                            </a>
                          )}
                          <div className="flex items-center gap-2">
                            <a
                              href={generateCalendarLink(schedule)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800 text-sm inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Thêm vào Google Calendar
                            </a>
                            <button
                              onClick={() => downloadICS(schedule)}
                              className="text-purple-600 hover:text-purple-800 text-sm inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Tải file .ics
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Giá sân:</span>
                          <p className="font-medium">{schedule.courtPrice.toLocaleString('vi-VN')} VNĐ</p>
                        </div>
                        {schedule.racketPrice > 0 && (
                          <div>
                            <span className="text-gray-600">Giá vợt:</span>
                            <p className="font-medium">{schedule.racketPrice.toLocaleString('vi-VN')} VNĐ</p>
                          </div>
                        )}
                        {schedule.waterPrice > 0 && (
                          <div>
                            <span className="text-gray-600">Giá nước:</span>
                            <p className="font-medium">{schedule.waterPrice.toLocaleString('vi-VN')} VNĐ</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Tổng:</span>
                          <p className="font-medium text-lg">
                            {(schedule.courtPrice + schedule.racketPrice + schedule.waterPrice).toLocaleString('vi-VN')} VNĐ
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
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Tổng kết quỹ chi tiêu</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thành viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiền quỹ đã đóng</th>
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

        {editingSchedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">Chỉnh sửa thành viên tham gia</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Sân:</span> {editingSchedule.court?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Ngày:</span> {new Date(editingSchedule.date).toLocaleDateString('vi-VN')} - {editingSchedule.startTime}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn thành viên tham gia
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {members.map(member => (
                    <label
                      key={member.id}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(member.id)}
                        onChange={() => toggleParticipant(member.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setEditingSchedule(null);
                    setSelectedParticipants([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveParticipants}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

