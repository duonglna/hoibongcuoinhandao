'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MembersTab from '@/components/admin/MembersTab';
import CourtsTab from '@/components/admin/CourtsTab';
import SchedulesTab from '@/components/admin/SchedulesTab';
import FundsTab from '@/components/admin/FundsTab';

type Tab = 'members' | 'courts' | 'schedules' | 'funds';
const ADMIN_AUTH_KEY = 'adminAuthUntil';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fundsRefreshKey, setFundsRefreshKey] = useState(0);

  useEffect(() => {
    const expiresAtRaw = localStorage.getItem(ADMIN_AUTH_KEY);
    const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0;

    if (!expiresAt || Number.isNaN(expiresAt) || expiresAt < Date.now()) {
      localStorage.removeItem(ADMIN_AUTH_KEY);
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
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center py-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 pr-2">
              Quản lý Pickleball
            </h1>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(ADMIN_AUTH_KEY);
                router.push('/');
              }}
              className="text-gray-600 hover:text-gray-900 self-start sm:self-auto text-sm sm:text-base py-1 touch-manipulation"
            >
              Đăng xuất
            </button>
          </div>
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto overscroll-x-contain border-b border-gray-200">
            <nav className="flex gap-1 min-w-max sm:min-w-0 pb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Refresh funds tab when switching to it
                    if (tab.id === 'funds') {
                      setFundsRefreshKey(prev => prev + 1);
                    }
                  }}
                  className={`shrink-0 px-3 sm:px-4 py-2.5 font-medium text-sm rounded-t-md touch-manipulation whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {activeTab === 'members' && <MembersTab />}
        {activeTab === 'courts' && <CourtsTab />}
        {activeTab === 'schedules' && <SchedulesTab />}
        {activeTab === 'funds' && <FundsTab key={fundsRefreshKey} />}
      </div>
    </div>
  );
}

