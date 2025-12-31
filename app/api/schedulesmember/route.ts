import { NextResponse } from 'next/server';
import { getSchedules, getCourts } from '@/lib/googleSheets';

export async function GET() {
  const debug: any = {
    step: 'start',
    timestamp: new Date().toISOString(),
  };
  
  try {
    // Try calling sequentially instead of Promise.all
    debug.step = 'fetching-schedules';
    let schedules: any[] = [];
    try {
      schedules = await getSchedules();
      debug.totalSchedules = schedules.length;
      debug.schedulesError = null;
      
      
    } catch (schedulesError: any) {
      debug.schedulesError = schedulesError?.message || 'Unknown error';
      debug.schedulesErrorStack = schedulesError?.stack;
    }
    
    debug.step = 'fetching-courts';
    let courts: any[] = [];
    try {
      courts = await getCourts();
      debug.totalCourts = courts.length;
      debug.courtsError = null;
    } catch (courtsError: any) {
      debug.courtsError = courtsError?.message || 'Unknown error';
      debug.courtsErrorStack = courtsError?.stack;
    }
    
    // If both are empty, try to initialize sheets
    if (schedules.length === 0 && courts.length === 0) {
      debug.step = 'trying-initialize';
      try {
        const { initializeSheets } = await import('@/lib/googleSheets');
        await initializeSheets();
        debug.initializeSuccess = true;
        
        // Try again after initialization
        schedules = await getSchedules();
        courts = await getCourts();
        debug.totalSchedulesAfterInit = schedules.length;
        debug.totalCourtsAfterInit = courts.length;
      } catch (initError: any) {
        debug.initializeError = initError?.message || 'Unknown error';
        debug.initializeErrorStack = initError?.stack;
      }
    }
    
    if (schedules.length > 0) {
      debug.sampleSchedule = {
        id: schedules[0].id,
        status: schedules[0].status,
        statusType: typeof schedules[0].status,
        courtID: schedules[0].courtID,
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
    
    // Always return debug info for now
    return NextResponse.json({
      data: schedulesWithCourtInfo,
      debug,
    });
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

