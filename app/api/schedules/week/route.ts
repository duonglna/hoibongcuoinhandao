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
    console.log('Total courts from getCourts:', courts.length);
    if (schedules.length > 0) {
      console.log('First schedule sample:', JSON.stringify(schedules[0], null, 2));
    } else {
      console.log('WARNING: getSchedules() returned empty array!');
    }
    if (courts.length > 0) {
      console.log('Courts sample:', courts.map((c: any) => ({ id: c.id, name: c.name })));
    } else {
      console.log('WARNING: getCourts() returned empty array!');
    }
    
    // Log all schedules with their status
    if (schedules.length > 0) {
      console.log('All schedules with status:', schedules.map((s: any) => ({
        id: s.id,
        date: s.date,
        status: s.status,
        statusType: typeof s.status,
        statusValue: s.status,
      })));
    }
    
    // Filter schedules with status "pending" only
    // First, let's see what statuses we actually have
    if (schedules.length > 0) {
      console.log('All schedules with status:', schedules.map((s: any) => ({
        id: s.id,
        date: s.date,
        status: s.status,
        statusType: typeof s.status,
        statusValue: JSON.stringify(s.status),
      })));
    }
    
    const pendingSchedules = schedules.filter((schedule: any) => {
      // Check status - handle both string and case variations, and also check for undefined/null
      const status = (schedule.status || '').toString().trim().toLowerCase();
      const isPending = status === 'pending';
      
      if (!isPending) {
        console.log(`[FILTER OUT] Schedule ${schedule.id}: status="${schedule.status}" (normalized: "${status}")`);
      }
      
      return isPending;
    });
    
    console.log('Pending schedules count:', pendingSchedules.length);
    if (pendingSchedules.length > 0) {
      console.log('Pending schedules:', pendingSchedules.map((s: any) => ({
        id: s.id,
        date: s.date,
        startTime: s.startTime,
        status: s.status,
      })));
    } else {
      console.log('WARNING: No pending schedules found!');
      if (schedules.length > 0) {
        const uniqueStatuses = Array.from(new Set(schedules.map((s: any) => s.status)));
        console.log('All unique statuses found:', uniqueStatuses);
      }
    }

    // Sort by start date/time (earliest first)
    pendingSchedules.sort((a: any, b: any) => {
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

    console.log('Courts data:', courts.length, courts.map((c: any) => ({ id: c.id, name: c.name })));
    
    const schedulesWithCourtInfo = pendingSchedules.map((schedule: any) => {
      const court = courts.find((c: any) => c.id === schedule.courtID);
      
      if (!court) {
        console.warn(`[WARNING] Court not found for schedule ${schedule.id}, courtID: ${schedule.courtID}`);
        console.log('Available courts:', courts.map((c: any) => c.id));
      }
      
      // Calculate total price: numberOfCourts * hours * pricePerHour
      const totalCourtPrice = (schedule.numberOfCourts || 1) * (schedule.hours || 1) * (court?.pricePerHour || 0);
      
      return {
        ...schedule,
        court: court || null,
        totalCourtPrice, // Override courtPrice with calculated value
      };
    });
    
    console.log('Schedules with court info:', schedulesWithCourtInfo.map((s: any) => ({
      id: s.id,
      courtID: s.courtID,
      courtName: s.court?.name || 'NOT FOUND',
    })));

    console.log('Final response: returning', schedulesWithCourtInfo.length, 'schedules');
    return NextResponse.json(schedulesWithCourtInfo);
  } catch (error: any) {
    console.error('API Error getting week schedules:', error?.message || error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json({ 
      error: 'Failed to get schedules',
      message: error?.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

