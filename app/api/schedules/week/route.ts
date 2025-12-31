import { NextResponse } from 'next/server';
import { getSchedules, getCourts, getPayments } from '@/lib/googleSheets';
import { parseISO } from 'date-fns';

export async function GET() {
  try {
    const [schedules, courts, payments] = await Promise.all([
      getSchedules(),
      getCourts(),
      getPayments(),
    ]);
    
    const now = new Date();
    console.log('Current time:', now.toISOString());
    console.log('Total schedules from getSchedules:', schedules.length);
    if (schedules.length > 0) {
      console.log('Sample schedule:', {
        id: schedules[0].id,
        date: schedules[0].date,
        startTime: schedules[0].startTime,
        status: schedules[0].status,
      });
    }

    // Filter schedules that are "Sắp diễn ra" (upcoming)
    // Show all schedules with status "pending" or schedules in the future
    const upcomingSchedules = schedules.filter((schedule: any) => {
      try {
        if (!schedule.date) {
          console.log(`Schedule ${schedule.id} has no date`);
          return false;
        }
        
        // Parse date - handle YYYY-MM-DD format
        let scheduleDate: Date;
        try {
          // parseISO works with ISO format (YYYY-MM-DD)
          scheduleDate = parseISO(schedule.date);
        } catch {
          scheduleDate = new Date(schedule.date);
        }
        
        if (isNaN(scheduleDate.getTime())) {
          console.log(`Schedule ${schedule.id} has invalid date: ${schedule.date}`);
          return false;
        }
        
        // Parse start time
        const [hours, minutes] = (schedule.startTime || '00:00').split(':').map(Number);
        const scheduleDateTime = new Date(scheduleDate);
        scheduleDateTime.setHours(hours, minutes, 0, 0);
        
        // Simple comparison - check if schedule datetime is in the future
        const isUpcoming = scheduleDateTime.getTime() > now.getTime();
        
        console.log(`Schedule ${schedule.id}: date=${schedule.date}, time=${schedule.startTime}, datetime=${scheduleDateTime.toISOString()}, now=${now.toISOString()}, isUpcoming=${isUpcoming}, status=${schedule.status}`);
        
        // Return true if schedule is in the future
        return isUpcoming;
      } catch (error: any) {
        console.error(`Error parsing schedule ${schedule.id}:`, error?.message);
        return false;
      }
    });
    
    console.log('Upcoming schedules count:', upcomingSchedules.length);
    if (upcomingSchedules.length > 0) {
      console.log('Upcoming schedules:', upcomingSchedules.map((s: any) => ({
        id: s.id,
        date: s.date,
        startTime: s.startTime,
      })));
    }

    // Sort by date (earliest first)
    upcomingSchedules.sort((a: any, b: any) => {
      try {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });

    const schedulesWithCourtInfo = upcomingSchedules.map((schedule: any) => {
      const court = courts.find((c: any) => c.id === schedule.courtID);
      
      // Calculate total price: numberOfCourts * hours * pricePerHour
      const totalCourtPrice = (schedule.numberOfCourts || 1) * (schedule.hours || 1) * (court?.pricePerHour || 0);
      
      return {
        ...schedule,
        court: court || null,
        totalCourtPrice, // Override courtPrice with calculated value
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

