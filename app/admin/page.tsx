'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MembersTab from '@/components/admin/MembersTab';
import CourtsTab from '@/components/admin/CourtsTab';
import SchedulesTab from '@/components/admin/SchedulesTab';
import FundsTab from '@/components/admin/FundsTab';

type Tab = 'members' | 'courts' | 'schedules' | 'funds';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const admin = sessionStorage.getItem('admin');
    if (!admin) {
      router.push('/');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { id: 'members' as Tab, label: 'Thành viên' },
    { id: 'courts' as Tab, label: 'Sân' },
    { id: 'schedules' as Tab, label: 'Lịch chơi' },
    { id: 'funds' as Tab, label: 'Quỹ' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Pickleball</h1>
            <button
              onClick={() => {
                sessionStorage.removeItem('admin');
                router.push('/');
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              Đăng xuất
            </button>
          </div>
          <div className="flex space-x-1 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'members' && <MembersTab />}
        {activeTab === 'courts' && <CourtsTab />}
        {activeTab === 'schedules' && <SchedulesTab />}
        {activeTab === 'funds' && <FundsTab />}
      </div>
    </div>
  );
}

