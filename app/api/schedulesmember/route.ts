import { NextResponse } from 'next/server';
import { getSchedules, getCourts } from '@/lib/googleSheets';

export async function GET() {
  try {
    // Get schedules and courts - same way as /api/schedules
    const schedules = await getSchedules();
    const courts = await getCourts();
    
    // Filter schedules with status "pending"
    const pendingSchedules = schedules.filter((schedule: any) => {
      const status = (schedule.status || '').toString().trim().toLowerCase();
      const isPending = status === 'pending';
      // Debug: log if not pending
      if (!isPending && schedules.length > 0) {
        console.log(`Filtering out schedule ${schedule.id}: status="${schedule.status}" -> normalized="${status}"`);
      }
      return isPending;
    });
    
    // If no pending schedules, return all for debugging
    const schedulesToProcess = pendingSchedules.length > 0 ? pendingSchedules : schedules;

    // Join with courts
    const schedulesWithCourtInfo = schedulesToProcess.map((schedule: any) => {
      const court = courts.find((c: any) => c.id === schedule.courtID);
      
      // Calculate total price: numberOfCourts * hours * pricePerHour
      const totalCourtPrice = (schedule.numberOfCourts || 1) * (schedule.hours || 1) * (court?.pricePerHour || 0);
      
      return {
        ...schedule,
        court: court || null,
        totalCourtPrice,
      };
    });

    return NextResponse.json(schedulesWithCourtInfo);
  } catch (error: any) {
    console.error('API Error getting schedules:', error?.message || error);
    return NextResponse.json({ 
      error: 'Failed to get schedules',
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
