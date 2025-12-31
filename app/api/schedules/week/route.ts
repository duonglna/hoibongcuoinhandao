import { NextResponse } from 'next/server';
import { getSchedules, getCourts, getPayments } from '@/lib/googleSheets';
import { startOfWeek, endOfWeek, parseISO, isWithinInterval, format, addDays } from 'date-fns';

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
    
    // Also include next week if no schedules this week
    const nextWeekEnd = addDays(weekEnd, 7);

    const thisWeekSchedules = schedules.filter((schedule: any) => {
      try {
        // Handle different date formats
        let scheduleDate: Date;
        
        if (!schedule.date) {
          return false;
        }
        
        // Try parseISO first (handles ISO format)
        try {
          scheduleDate = parseISO(schedule.date);
        } catch {
          // If parseISO fails, try new Date
          scheduleDate = new Date(schedule.date);
        }
        
        // Check if date is valid
        if (isNaN(scheduleDate.getTime())) {
          console.error(`Invalid date for schedule ${schedule.id}: ${schedule.date}`);
          return false;
        }
        
        // Set time to start of day for comparison
        scheduleDate.setHours(0, 0, 0, 0);
        const start = new Date(weekStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(weekEnd);
        end.setHours(23, 59, 59, 999);
        
        const isInWeek = isWithinInterval(scheduleDate, { start, end });
        return isInWeek;
      } catch (error: any) {
        console.error(`Error parsing schedule date ${schedule.date}:`, error?.message);
        return false;
      }
    });

    // If no schedules this week, include next week's schedules
    let schedulesToShow = thisWeekSchedules;
    if (schedulesToShow.length === 0) {
      const nextWeekSchedules = schedules.filter((schedule: any) => {
        try {
          let scheduleDate: Date;
          try {
            scheduleDate = parseISO(schedule.date);
          } catch {
            scheduleDate = new Date(schedule.date);
          }
          
          if (isNaN(scheduleDate.getTime())) {
            return false;
          }
          
          scheduleDate.setHours(0, 0, 0, 0);
          const start = new Date(weekEnd);
          start.setHours(0, 0, 0, 0);
          const end = new Date(nextWeekEnd);
          end.setHours(23, 59, 59, 999);
          
          return isWithinInterval(scheduleDate, { start, end });
        } catch {
          return false;
        }
      });
      
      schedulesToShow = nextWeekSchedules;
    }

    const schedulesWithCourtInfo = schedulesToShow.map((schedule: any) => {
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

