import { NextResponse } from 'next/server';
import { getSchedules, getCourts, getPayments } from '@/lib/googleSheets';
import { startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberID = searchParams.get('memberID');
    
    if (!memberID) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

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
        return isWithinInterval(scheduleDate, { start: weekStart, end: weekEnd }) &&
               schedule.participants.includes(memberID);
      } catch {
        return false;
      }
    });

    const schedulesWithCourtInfo = thisWeekSchedules.map(schedule => {
      const court = courts.find(c => c.id === schedule.courtID);
      const memberPayment = payments.find(
        p => p.scheduleID === schedule.id && p.memberID === memberID
      );
      
      return {
        ...schedule,
        court: court || null,
        payment: memberPayment || null,
      };
    });

    return NextResponse.json(schedulesWithCourtInfo);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get schedule' }, { status: 500 });
  }
}

