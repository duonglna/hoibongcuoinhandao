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
    
    // Check environment variables
    debug.envCheck = {
      hasSpreadsheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      hasClientEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      spreadsheetIdLength: process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.length || 0,
      clientEmailLength: process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.length || 0,
      privateKeyLength: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.length || 0,
    };
    
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

