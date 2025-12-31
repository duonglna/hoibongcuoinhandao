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
    
    console.log('=== API /api/schedules/week ===');
    console.log('Total schedules from getSchedules:', schedules.length);
    if (schedules.length > 0) {
      console.log('First schedule sample:', JSON.stringify(schedules[0], null, 2));
    } else {
      console.log('WARNING: getSchedules() returned empty array!');
    }
    
    const now = new Date();
    console.log('Current time:', now.toISOString());

    // Filter schedules that haven't ended yet (end time = startTime + hours)
    const activeSchedules = schedules.filter((schedule: any) => {
      try {
        if (!schedule.date) {
          console.log(`Schedule ${schedule.id} has no date`);
          return false;
        }
        
        // Parse date - handle YYYY-MM-DD format
        let scheduleDate: Date;
        try {
          scheduleDate = parseISO(schedule.date);
        } catch {
          scheduleDate = new Date(schedule.date);
        }
        
        if (isNaN(scheduleDate.getTime())) {
          console.log(`Schedule ${schedule.id} has invalid date: ${schedule.date}`);
          return false;
        }
        
        // Parse start time
        const [startHours, startMinutes] = (schedule.startTime || '00:00').split(':').map(Number);
        const scheduleStartDateTime = new Date(scheduleDate);
        scheduleStartDateTime.setHours(startHours, startMinutes, 0, 0);
        
        // Calculate end time (start time + hours)
        const scheduleEndDateTime = new Date(scheduleStartDateTime);
        scheduleEndDateTime.setHours(scheduleStartDateTime.getHours() + (schedule.hours || 1));
        
        // Check if schedule hasn't ended yet (end time is in the future)
        const hasNotEnded = scheduleEndDateTime.getTime() > now.getTime();
        
        console.log(`Schedule ${schedule.id}: date=${schedule.date}, startTime=${schedule.startTime}, hours=${schedule.hours}, endTime=${scheduleEndDateTime.toISOString()}, now=${now.toISOString()}, hasNotEnded=${hasNotEnded}`);
        
        return hasNotEnded;
      } catch (error: any) {
        console.error(`Error parsing schedule ${schedule.id}:`, error?.message);
        return false;
      }
    });
    
    console.log('Active schedules count (not ended):', activeSchedules.length);
    console.log('Active schedules:', activeSchedules.map((s: any) => ({
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      hours: s.hours,
    })));

    // Sort by start date/time (earliest first)
    activeSchedules.sort((a: any, b: any) => {
      try {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        const timeA = a.startTime.split(':').map(Number);
        const timeB = b.startTime.split(':').map(Number);
        dateA.setHours(timeA[0], timeA[1], 0, 0);
        dateB.setHours(timeB[0], timeB[1], 0, 0);
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });

    const schedulesWithCourtInfo = activeSchedules.map((schedule: any) => {
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

