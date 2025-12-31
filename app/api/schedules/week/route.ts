import { NextResponse } from 'next/server';
import { getSchedules, getCourts, getPayments } from '@/lib/googleSheets';
import { startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns';

export async function GET() {
  try {
    const [schedules, courts, payments] = await Promise.all([
      getSchedules(),
      getCourts(),
      getPayments(),
    ]);
    
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

    const thisWeekSchedules = schedules.filter(schedule => {
      try {
        const scheduleDate = parseISO(schedule.date);
        return isWithinInterval(scheduleDate, { start: weekStart, end: weekEnd });
      } catch {
        return false;
      }
    });

    const schedulesWithCourtInfo = thisWeekSchedules.map(schedule => {
      const court = courts.find(c => c.id === schedule.courtID);
      
      return {
        ...schedule,
        court: court || null,
      };
    });

    return NextResponse.json(schedulesWithCourtInfo);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get schedules' }, { status: 500 });
  }
}

