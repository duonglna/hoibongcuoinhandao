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
    
    console.log('Total schedules:', schedules.length);
    console.log('Sample schedule dates:', schedules.slice(0, 3).map((s: any) => s.date));
    
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
    
    console.log('Week range:', {
      start: weekStart.toISOString(),
      end: weekEnd.toISOString(),
      now: now.toISOString()
    });

    const thisWeekSchedules = schedules.filter((schedule: any) => {
      try {
        // Handle different date formats
        let scheduleDate: Date;
        if (schedule.date.includes('T')) {
          scheduleDate = parseISO(schedule.date);
        } else {
          // If date is in YYYY-MM-DD format, parse it
          scheduleDate = new Date(schedule.date);
        }
        
        // Set time to start of day for comparison
        scheduleDate.setHours(0, 0, 0, 0);
        const start = new Date(weekStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(weekEnd);
        end.setHours(23, 59, 59, 999);
        
        const isInWeek = isWithinInterval(scheduleDate, { start, end });
        console.log(`Schedule ${schedule.id} (${schedule.date}): ${isInWeek ? 'IN' : 'OUT'} week`);
        return isInWeek;
      } catch (error: any) {
        console.error(`Error parsing schedule date ${schedule.date}:`, error?.message);
        return false;
      }
    });

    console.log('This week schedules count:', thisWeekSchedules.length);

    const schedulesWithCourtInfo = thisWeekSchedules.map((schedule: any) => {
      const court = courts.find((c: any) => c.id === schedule.courtID);
      
      return {
        ...schedule,
        court: court || null,
      };
    });

    return NextResponse.json(schedulesWithCourtInfo);
  } catch (error: any) {
    console.error('API Error getting week schedules:', error?.message || error);
    return NextResponse.json({ 
      error: 'Failed to get schedules',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

