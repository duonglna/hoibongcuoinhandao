import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Fetch from internal APIs instead of calling functions directly
    const baseUrl = request.headers.get('host') 
      ? `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`
      : 'http://localhost:3000';
    
    const [schedulesRes, courtsRes] = await Promise.all([
      fetch(`${baseUrl}/api/schedules`),
      fetch(`${baseUrl}/api/courts`),
    ]);
    
    if (!schedulesRes.ok || !courtsRes.ok) {
      throw new Error('Failed to fetch from internal APIs');
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
