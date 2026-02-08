import { NextResponse } from 'next/server';
import { getSchedules, updateSchedule, addPayments } from '@/lib/googleSheets';

export async function POST(request: Request) {
  try {
    const { scheduleID, racketParticipants, waterParticipants } = await request.json();
    
    const schedules = await getSchedules();
    const schedule = (schedules as any[]).find((s: any) => s.id === scheduleID);
    
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const allParticipants = schedule.participants;
    const racketParticipantsList = racketParticipants || [];
    const waterParticipantsList = waterParticipants || [];

    // Calculate shares (rounded up to whole numbers - làm tròn lên)
    const courtSharePerPerson = Math.ceil(Number(schedule.courtPrice) / allParticipants.length);
    const racketSharePerPerson = racketParticipantsList.length > 0 
      ? Math.ceil(Number(schedule.racketPrice) / racketParticipantsList.length)
      : 0;
    const waterSharePerPerson = waterParticipantsList.length > 0 
      ? Math.ceil(Number(schedule.waterPrice) / waterParticipantsList.length)
      : 0;

    // Create payments with rounded up integer values
    const payments = allParticipants.map((memberID: string) => ({
      scheduleID,
      memberID,
      courtShare: Math.ceil(courtSharePerPerson), // Ensure integer
      racketShare: racketParticipantsList.includes(memberID) ? Math.ceil(racketSharePerPerson) : 0,
      waterShare: waterParticipantsList.includes(memberID) ? Math.ceil(waterSharePerPerson) : 0,
    }));

    await addPayments(payments);
    await updateSchedule(scheduleID, { status: 'done' });

    return NextResponse.json({ success: true, payments });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to calculate payments' }, { status: 500 });
  }
}

