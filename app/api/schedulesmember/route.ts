import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Fetch from internal APIs - these are working
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    const [schedulesRes, courtsRes] = await Promise.all([
      fetch(`${baseUrl}/api/schedules`, {
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      fetch(`${baseUrl}/api/courts`, {
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    ]);
    
    if (!schedulesRes.ok) {
      throw new Error(`Failed to fetch schedules: ${schedulesRes.status}`);
    }
    if (!courtsRes.ok) {
      throw new Error(`Failed to fetch courts: ${courtsRes.status}`);
    }
    
    const schedules = await schedulesRes.json();
    const courts = await courtsRes.json();
    
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
