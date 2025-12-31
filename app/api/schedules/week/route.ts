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

    // Filter schedules that are "Sắp diễn ra" (upcoming)
    const upcomingSchedules = schedules.filter((schedule: any) => {
      try {
        if (!schedule.date) {
          return false;
        }
        
        // Parse date
        let scheduleDate: Date;
        try {
          scheduleDate = parseISO(schedule.date);
        } catch {
          scheduleDate = new Date(schedule.date);
        }
        
        if (isNaN(scheduleDate.getTime())) {
          return false;
        }
        
        // Parse start time
        const [hours, minutes] = (schedule.startTime || '00:00').split(':').map(Number);
        const scheduleDateTime = new Date(scheduleDate);
        scheduleDateTime.setHours(hours, minutes, 0, 0);
        
        // Check if schedule is in the future
        return scheduleDateTime > now;
      } catch (error: any) {
        console.error(`Error parsing schedule ${schedule.id}:`, error?.message);
        return false;
      }
    });

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

