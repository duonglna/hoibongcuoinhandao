import { NextResponse } from 'next/server';
import { getSchedules, getCourts } from '@/lib/googleSheets';

export async function GET() {
  try {
    // Call functions directly - same as /api/schedules and /api/courts
    const schedules = await getSchedules();
    const courts = await getCourts();
    
    // Filter schedules with status "pending"
    const pendingSchedules = schedules.filter((schedule: any) => {
      const status = (schedule.status || '').toString().trim().toLowerCase();
      return status === 'pending';
    });

    // Join with courts
    const schedulesWithCourtInfo = pendingSchedules.map((schedule: any) => {
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
