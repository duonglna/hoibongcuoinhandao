import { NextResponse } from 'next/server';
import { getSchedules, getCourts } from '@/lib/googleSheets';

export async function GET() {
  try {
    console.log('=== /api/schedulesmember ===');
    const [schedules, courts] = await Promise.all([
      getSchedules(),
      getCourts(),
    ]);
    
    console.log('Total schedules:', schedules.length);
    console.log('Total courts:', courts.length);
    
    if (schedules.length > 0) {
      console.log('Sample schedule:', {
        id: schedules[0].id,
        status: schedules[0].status,
        statusType: typeof schedules[0].status,
      });
      console.log('All statuses:', schedules.map((s: any) => s.status));
    }
    
    // Filter schedules with status "pending"
    const pendingSchedules = schedules.filter((schedule: any) => {
      const status = (schedule.status || '').toString().trim().toLowerCase();
      const isPending = status === 'pending';
      console.log(`Schedule ${schedule.id}: status="${schedule.status}" -> normalized="${status}" -> isPending=${isPending}`);
      return isPending;
    });

    console.log('Pending schedules count:', pendingSchedules.length);
    
    // If no pending, return all for debugging
    const schedulesToReturn = pendingSchedules.length > 0 ? pendingSchedules : schedules;
    console.log('Returning schedules count:', schedulesToReturn.length);

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

    console.log('Final response count:', schedulesWithCourtInfo.length);
    return NextResponse.json(schedulesWithCourtInfo);
  } catch (error: any) {
    console.error('API Error getting schedules:', error?.message || error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json({ 
      error: 'Failed to get schedules',
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

