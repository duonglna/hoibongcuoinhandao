import { NextResponse } from 'next/server';
import { getSchedules, getCourts } from '@/lib/googleSheets';

export async function GET() {
  const debug: any = {
    step: 'start',
    timestamp: new Date().toISOString(),
  };
  
  try {
    debug.step = 'fetching';
    const [schedules, courts] = await Promise.all([
      getSchedules(),
      getCourts(),
    ]);
    
    debug.totalSchedules = schedules.length;
    debug.totalCourts = courts.length;
    
    if (schedules.length > 0) {
      debug.sampleSchedule = {
        id: schedules[0].id,
        status: schedules[0].status,
        statusType: typeof schedules[0].status,
      };
      debug.allStatuses = schedules.map((s: any) => s.status);
    }
    
    // Filter schedules with status "pending"
    const pendingSchedules = schedules.filter((schedule: any) => {
      const status = (schedule.status || '').toString().trim().toLowerCase();
      return status === 'pending';
    });

    debug.pendingCount = pendingSchedules.length;
    
    // If no pending, return all for debugging
    const schedulesToReturn = pendingSchedules.length > 0 ? pendingSchedules : schedules;
    debug.returningCount = schedulesToReturn.length;

    // Join with courts
    const schedulesWithCourtInfo = schedulesToReturn.map((schedule: any) => {
      const court = courts.find((c: any) => c.id === schedule.courtID);
      
      // Calculate total price: numberOfCourts * hours * pricePerHour
      const totalCourtPrice = (schedule.numberOfCourts || 1) * (schedule.hours || 1) * (court?.pricePerHour || 0);
      
      return {
        ...schedule,
        court: court || null,
        totalCourtPrice,
      };
    });

    debug.finalCount = schedulesWithCourtInfo.length;
    debug.step = 'success';
    
    // Return with debug info in development
    if (process.env.NODE_ENV === 'development' || process.env.NETLIFY === 'true') {
      return NextResponse.json({
        data: schedulesWithCourtInfo,
        debug,
      });
    }
    
    return NextResponse.json(schedulesWithCourtInfo);
  } catch (error: any) {
    debug.step = 'error';
    debug.error = error?.message || 'Unknown error';
    debug.stack = error?.stack;
    
    return NextResponse.json({ 
      error: 'Failed to get schedules',
      message: error?.message || 'Unknown error',
      debug,
    }, { status: 500 });
  }
}

