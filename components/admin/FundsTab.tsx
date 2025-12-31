'use client';

import { useEffect, useState } from 'react';

interface Member {
  id: string;
  name: string;
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

interface MemberFinancialInfo {
  memberID: string;
  totalFunds: number;
  totalPayments: number;
  balance: number;
}

export default function FundsTab() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ memberID: '', amount: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fundsRes, paymentsRes, membersRes] = await Promise.all([
        fetch('/api/funds'),
        fetch('/api/payments'),
        fetch('/api/members'),
      ]);
      
      const fundsData = fundsRes.ok ? await fundsRes.json() : [];
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : [];
      const membersData = membersRes.ok ? await membersRes.json() : [];
      
      setFunds(Array.isArray(fundsData) ? fundsData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setFunds([]);
      setPayments([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setFormData({ memberID: '', amount: 0 });
        setShowForm(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error adding fund:', error);
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

  const getSummaryStats = () => {
    const totalFunds = funds.reduce((sum, f) => sum + f.amount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.courtShare + p.racketShare + p.waterShare, 0);
    const totalDebt = members.reduce((sum, member) => {
      const info = getMemberFinancialInfo(member.id);
      return sum + (info.balance < 0 ? Math.abs(info.balance) : 0);
    }, 0);
    const totalRemaining = members.reduce((sum, member) => {
      const info = getMemberFinancialInfo(member.id);
      return sum + (info.balance > 0 ? info.balance : 0);
    }, 0);

    return {
      totalFunds,
      totalPayments,
      totalDebt,
      totalRemaining,
    };
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  const stats = getSummaryStats();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Quỹ thành viên</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Hủy' : 'Thêm quỹ'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng quỹ đã đóng</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalFunds.toLocaleString('vi-VN')} VNĐ
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng quỹ còn lại</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalRemaining.toLocaleString('vi-VN')} VNĐ
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng đã chi tiêu</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.totalPayments.toLocaleString('vi-VN')} VNĐ
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng nợ</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.totalDebt.toLocaleString('vi-VN')} VNĐ
              </p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thành viên
              </label>
              <select
                value={formData.memberID}
                onChange={(e) => setFormData({ ...formData, memberID: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Chọn thành viên</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số tiền (VNĐ)
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                min="0"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Thêm
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
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
    </div>
  );
}

