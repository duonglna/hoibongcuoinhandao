'use client';

import { useEffect, useState } from 'react';

interface Member {
  id: string;
  name: string;
}

interface Court {
  id: string;
  name: string;
  pricePerHour: number;
}

interface Schedule {
  id: string;
  courtID: string;
  date: string;
  startTime: string;
  hours: number;
  numberOfCourts: number;
  courtPrice: number;
  racketPrice: number;
  waterPrice: number;
  participants: string[];
  status: string;
}

export default function SchedulesTab() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    courtID: '',
    date: '',
    startTime: '',
    hours: 1,
    numberOfCourts: 1,
    racketPrice: 0,
    waterPrice: 0,
    participants: [] as string[],
  });
  const [racketParticipants, setRacketParticipants] = useState<string[]>([]);
  const [waterParticipants, setWaterParticipants] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedulesRes, membersRes, courtsRes] = await Promise.all([
        fetch('/api/schedules'),
        fetch('/api/members'),
        fetch('/api/courts'),
      ]);
      
      const schedulesData = schedulesRes.ok ? await schedulesRes.json() : [];
      const membersData = membersRes.ok ? await membersRes.json() : [];
      const courtsData = courtsRes.ok ? await courtsRes.json() : [];
      
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setCourts(Array.isArray(courtsData) ? courtsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSchedules([]);
      setMembers([]);
      setCourts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCourt = courts.find(c => c.id === formData.courtID);
    if (!selectedCourt) return;

    // Calculate total court price: numberOfCourts * hours * pricePerHour
    const courtPrice = formData.numberOfCourts * formData.hours * selectedCourt.pricePerHour;

    try {
      if (editingSchedule) {
        const response = await fetch('/api/schedules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingSchedule.id,
            ...formData,
            numberOfCourts: formData.numberOfCourts || 1,
            courtPrice,
          }),
        });
        if (response.ok) {
          setFormData({
            courtID: '',
            date: '',
            startTime: '',
            hours: 1,
            numberOfCourts: 1,
            racketPrice: 0,
            waterPrice: 0,
            participants: [],
          });
          setShowForm(false);
          setEditingSchedule(null);
          fetchData();
        }
      } else {
        const response = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            numberOfCourts: formData.numberOfCourts || 1,
            courtPrice,
          }),
        });
        if (response.ok) {
          setFormData({
            courtID: '',
            date: '',
            startTime: '',
            hours: 1,
            numberOfCourts: 1,
            racketPrice: 0,
            waterPrice: 0,
            participants: [],
          });
          setShowForm(false);
          fetchData();
        }
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      courtID: schedule.courtID,
      date: schedule.date,
      startTime: schedule.startTime,
      hours: schedule.hours,
      numberOfCourts: schedule.numberOfCourts || 1,
      racketPrice: schedule.racketPrice,
      waterPrice: schedule.waterPrice,
      participants: schedule.participants,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/schedules?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDeleteConfirm(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleCalculate = async () => {
    if (!selectedSchedule) return;

    try {
      const response = await fetch('/api/schedules/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleID: selectedSchedule.id,
          racketParticipants,
          waterParticipants,
        }),
      });
      if (response.ok) {
        setShowCalculateModal(false);
        setSelectedSchedule(null);
        setRacketParticipants([]);
        setWaterParticipants([]);
        fetchData();
      }
    } catch (error) {
      console.error('Error calculating:', error);
    }
  };

  const toggleParticipant = (memberID: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(memberID)
        ? prev.participants.filter(id => id !== memberID)
        : [...prev.participants, memberID],
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Lịch chơi</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingSchedule(null);
            setFormData({
              courtID: '',
              date: '',
              startTime: '',
              hours: 1,
              numberOfCourts: 1,
              racketPrice: 0,
              waterPrice: 0,
              participants: [],
            });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Hủy' : 'Thêm lịch chơi'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingSchedule ? 'Sửa lịch chơi' : 'Thêm lịch chơi'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sân
              </label>
              <select
                value={formData.courtID}
                onChange={(e) => setFormData({ ...formData, courtID: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Chọn sân</option>
                {courts.map(court => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ bắt đầu
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số giờ chơi
              </label>
              <input
                type="number"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                min="0.5"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số sân
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.numberOfCourts}
                onChange={(e) => setFormData({ ...formData, numberOfCourts: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá vợt (VNĐ)
              </label>
              <input
                type="number"
                value={formData.racketPrice}
                onChange={(e) => setFormData({ ...formData, racketPrice: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá nước (VNĐ)
              </label>
              <input
                type="number"
                value={formData.waterPrice}
                onChange={(e) => setFormData({ ...formData, waterPrice: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="0"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thành viên tham gia
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {members.map(member => (
                <label key={member.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.participants.includes(member.id)}
                    onChange={() => toggleParticipant(member.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{member.name}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            {editingSchedule ? 'Cập nhật' : 'Thêm lịch'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giờ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sân</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thành viên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules.map((schedule) => {
              const court = courts.find(c => c.id === schedule.courtID);
              const participantNames = schedule.participants
                .map(id => members.find(m => m.id === id)?.name)
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
                <tr key={schedule.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(schedule.date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {schedule.startTime} ({schedule.hours}h)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span>{court?.name || 'N/A'}</span>
                      <span className="text-xs text-gray-400">({schedule.numberOfCourts || 1} sân)</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {schedule.participants.length > 0 ? `${schedule.participants.length} thành viên: ${participantNames}` : 'Chưa có'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      schedule.status === 'done' 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {schedule.status === 'done' ? 'Đã tính' : 'Chưa tính'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-3">
                      {status.text === 'Chưa tính' && (
                        <button
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setRacketParticipants([]);
                            setWaterParticipants([]);
                            setShowCalculateModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Tính tiền"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Sửa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(schedule.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Xóa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCalculateModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Tính tiền cho lịch chơi</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Số sân: {selectedSchedule.numberOfCourts || 1}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Giá sân: {selectedSchedule.courtPrice.toLocaleString('vi-VN')} VNĐ
                {selectedSchedule.numberOfCourts && selectedSchedule.numberOfCourts > 1 && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({selectedSchedule.numberOfCourts} sân × {selectedSchedule.hours} giờ × {courts.find(c => c.id === selectedSchedule.courtID)?.pricePerHour?.toLocaleString('vi-VN') || 0} VNĐ/giờ)
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Giá vợt: {selectedSchedule.racketPrice.toLocaleString('vi-VN')} VNĐ
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Giá nước: {selectedSchedule.waterPrice.toLocaleString('vi-VN')} VNĐ
              </p>
            </div>

            {selectedSchedule.racketPrice > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thành viên thuê vợt
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {selectedSchedule.participants.map(memberID => {
                    const member = members.find(m => m.id === memberID);
                    return member ? (
                      <label key={memberID} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={racketParticipants.includes(memberID)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRacketParticipants([...racketParticipants, memberID]);
                            } else {
                              setRacketParticipants(racketParticipants.filter(id => id !== memberID));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{member.name}</span>
                      </label>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {selectedSchedule.waterPrice > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thành viên mua nước
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {selectedSchedule.participants.map(memberID => {
                    const member = members.find(m => m.id === memberID);
                    return member ? (
                      <label key={memberID} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={waterParticipants.includes(memberID)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setWaterParticipants([...waterParticipants, memberID]);
                            } else {
                              setWaterParticipants(waterParticipants.filter(id => id !== memberID));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{member.name}</span>
                      </label>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCalculateModal(false);
                  setSelectedSchedule(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCalculate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Tính tiền
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa lịch chơi này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

