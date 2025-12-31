import { google } from 'googleapis';

// Skip Google Sheets initialization during build time
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    (process.env.NETLIFY === 'true' && !process.env.GOOGLE_SHEETS_CLIENT_EMAIL);

let auth: any = null;
let sheets: any = null;

function getAuth() {
  if (isBuildTime) {
    // Return a mock auth during build
    return null;
  }
  
  if (!auth) {
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !privateKey) {
      return null;
    }
    
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }
  return auth;
}

function getSheets() {
  if (isBuildTime || !getAuth()) {
    return null;
  }
  
  if (!sheets) {
    sheets = google.sheets({ version: 'v4', auth: getAuth() });
  }
  return sheets;
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';

// Sheet names
const SHEETS = {
  MEMBERS: 'Members',
  COURTS: 'Courts',
  SCHEDULES: 'Schedules',
  PAYMENTS: 'Payments',
  FUNDS: 'Funds',
};

// Initialize sheets if they don't exist
export async function initializeSheets() {
  if (isBuildTime) {
    return; // Skip during build
  }
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    return;
  }
  
  try {
    // Check if sheets exist and create if needed
    const spreadsheet = await sheetsClient.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const existingSheets = spreadsheet.data.sheets?.map((s: any) => s.properties?.title) || [];
    
    const sheetsToCreate = Object.values(SHEETS).filter((name: string) => !existingSheets.includes(name));
    
    // Create missing sheets
    if (sheetsToCreate.length > 0) {
      console.log('Creating sheets:', sheetsToCreate);
      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: sheetsToCreate.map((name: string) => ({
            addSheet: {
              properties: { title: name },
            },
          })),
        },
      });
      
      // Wait a bit for sheets to be created
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Always add/update headers for all sheets (in case headers are missing)
    console.log('Adding headers to all sheets...');
    const headerUpdates = await Promise.allSettled([
      sheetsClient.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.MEMBERS}!A1:D1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['ID', 'Name', 'Phone', 'Email']],
        },
      }),
      sheetsClient.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.COURTS}!A1:F1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['ID', 'Name', 'Address', 'GoogleMapLink', 'PricePerHour', 'Active']],
        },
      }),
      sheetsClient.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.SCHEDULES}!A1:J1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['ID', 'CourtID', 'Date', 'StartTime', 'Hours', 'CourtPrice', 'RacketPrice', 'WaterPrice', 'Participants', 'Status']],
        },
      }),
      sheetsClient.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.PAYMENTS}!A1:F1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['ID', 'ScheduleID', 'MemberID', 'CourtShare', 'RacketShare', 'WaterShare']],
        },
      }),
      sheetsClient.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.FUNDS}!A1:C1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['ID', 'MemberID', 'Amount']],
        },
      }),
    ]);
    
    // Log any failures
    headerUpdates.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to add headers for sheet ${Object.values(SHEETS)[index]}:`, result.reason);
      }
    });
    
    console.log('Sheets initialization completed');
  } catch (error: any) {
    console.error('Error initializing sheets:', error?.message || error);
    // Re-throw để API route biết có lỗi
    throw error;
  }
}

// Members
export async function getMembers() {
  if (isBuildTime) {
    return [];
  }
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    return [];
  }
  
  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.MEMBERS}!A2:D`,
    });
    
    // Handle empty sheet (only headers, no data rows)
    if (!response.data.values || response.data.values.length === 0) {
      return [];
    }
    
    return response.data.values.map((row: any, index: number) => ({
      id: row[0] || `member_${Date.now()}_${index}`,
      name: row[1] || '',
      phone: row[2] || undefined,
      email: row[3] || undefined,
    }));
  } catch (error: any) {
    // If sheet doesn't exist (400 error), try to initialize
    if (error?.response?.status === 400 || error?.code === 400 || error?.message?.includes('Unable to parse range')) {
      console.log('Sheet may not exist, initializing...');
      try {
        await initializeSheets();
        // Wait a bit for sheets to be created
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Try again after initialization
        const response = await sheetsClient.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEETS.MEMBERS}!A2:D`,
        });
        
        // Handle empty sheet
        if (!response.data.values || response.data.values.length === 0) {
          return [];
        }
        
        return response.data.values.map((row: any, index: number) => ({
          id: row[0] || `member_${Date.now()}_${index}`,
          name: row[1] || '',
          phone: row[2] || undefined,
          email: row[3] || undefined,
        }));
      } catch (initError: any) {
        console.error('Error initializing or getting members:', initError?.message || initError);
        // Return empty array instead of throwing
        return [];
      }
    }
    console.error('Error getting members:', error?.message || error);
    // Always return empty array, never throw
    return [];
  }
}

export async function addMember(member: { name: string; phone?: string; email?: string }) {
  if (isBuildTime) {
    throw new Error('Cannot add member during build time');
  }
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    // Try to initialize first
    await initializeSheets();
    const retryClient = getSheets();
    if (!retryClient) {
      throw new Error('Google Sheets not initialized. Please check your environment variables.');
    }
    // Use retryClient
    const id = `member_${Date.now()}`;
    try {
      await retryClient.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.MEMBERS}!A:D`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[id, member.name, member.phone || '', member.email || '']],
        },
      });
      return id;
    } catch (error: any) {
      // If sheet doesn't exist, initialize and retry
      if (error?.response?.status === 400 || error?.code === 400) {
        await initializeSheets();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await retryClient.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEETS.MEMBERS}!A:D`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[id, member.name, member.phone || '', member.email || '']],
          },
        });
        return id;
      }
      throw error;
    }
  }
  
  const id = `member_${Date.now()}`;
  try {
    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.MEMBERS}!A:D`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[id, member.name, member.phone || '', member.email || '']],
      },
    });
    return id;
  } catch (error: any) {
    // If sheet doesn't exist, initialize and retry
    if (error?.response?.status === 400 || error?.code === 400) {
      await initializeSheets();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await sheetsClient.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.MEMBERS}!A:D`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[id, member.name, member.phone || '', member.email || '']],
        },
      });
      return id;
    }
    throw error;
  }
}

export async function updateMember(id: string, member: { name: string; phone?: string; email?: string }) {
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  const members = await getMembers();
  const memberIndex = members.findIndex((m: any) => m.id === id);
  if (memberIndex === -1) throw new Error('Member not found');

  const rowIndex = memberIndex + 2; // +2 because of header and 0-based index
  
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.MEMBERS}!A${rowIndex}:D${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, member.name, member.phone || '', member.email || '']],
    },
  });
}

export async function deleteMember(id: string) {
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  const members = await getMembers();
  const memberIndex = members.findIndex((m: any) => m.id === id);
  if (memberIndex === -1) throw new Error('Member not found');

  const rowIndex = memberIndex + 2;
  
  await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: await getSheetId(SHEETS.MEMBERS),
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          },
        },
      }],
    },
  });
}

async function getSheetId(sheetName: string): Promise<number> {
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  const spreadsheet = await sheetsClient.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheet = spreadsheet.data.sheets?.find((s: any) => s.properties?.title === sheetName);
  if (!sheet?.properties?.sheetId) throw new Error(`Sheet ${sheetName} not found`);
  return sheet.properties.sheetId;
}

// Courts
export async function getCourts() {
  if (isBuildTime) {
    return [];
  }
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    return [];
  }
  
  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.COURTS}!A2:F`,
    });
    return (response.data.values || []).map((row: any, index: number) => ({
      id: row[0] || `court_${Date.now()}_${index}`,
      name: row[1] || '',
      address: row[2] || '',
      googleMapLink: row[3] || '',
      pricePerHour: parseFloat(row[4] || '0'),
      active: row[5] === 'TRUE' || row[5] === 'true',
    }));
  } catch (error: any) {
    if (error?.response?.status === 400 || error?.code === 400) {
      try {
        await initializeSheets();
        const response = await sheetsClient.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEETS.COURTS}!A2:F`,
        });
        return (response.data.values || []).map((row: any, index: number) => ({
          id: row[0] || `court_${Date.now()}_${index}`,
          name: row[1] || '',
          address: row[2] || '',
          googleMapLink: row[3] || '',
          pricePerHour: parseFloat(row[4] || '0'),
          active: row[5] === 'TRUE' || row[5] === 'true',
        }));
      } catch (initError) {
        console.error('Error initializing or getting courts:', initError);
        return [];
      }
    }
    console.error('Error getting courts:', error);
    return [];
  }
}

export async function addCourt(court: {
  name: string;
  address: string;
  googleMapLink: string;
  pricePerHour: number;
}) {
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  const id = `court_${Date.now()}`;
  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.COURTS}!A:F`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, court.name, court.address, court.googleMapLink, court.pricePerHour, 'TRUE']],
    },
  });
  return id;
}

export async function updateCourt(id: string, court: {
  name: string;
  address: string;
  googleMapLink: string;
  pricePerHour: number;
  active?: boolean;
}) {
  const courts = await getCourts();
  const courtIndex = courts.findIndex((c: any) => c.id === id);
  if (courtIndex === -1) throw new Error('Court not found');

  const rowIndex = courtIndex + 2;
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.COURTS}!A${rowIndex}:F${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, court.name, court.address, court.googleMapLink, court.pricePerHour, court.active !== false ? 'TRUE' : 'FALSE']],
    },
  });
}

export async function deleteCourt(id: string) {
  const courts = await getCourts();
  const courtIndex = courts.findIndex((c: any) => c.id === id);
  if (courtIndex === -1) throw new Error('Court not found');

  const rowIndex = courtIndex + 2;
  const sheetId = await getSheetId(SHEETS.COURTS);
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          },
        },
      }],
    },
  });
}

// Schedules
export async function getSchedules() {
  if (isBuildTime) {
    return [];
  }
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    return [];
  }
  
  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.SCHEDULES}!A2:J`,
    });
    return (response.data.values || []).map((row: any, index: number) => ({
      id: row[0] || `schedule_${Date.now()}_${index}`,
      courtID: row[1] || '',
      date: row[2] || '',
      startTime: row[3] || '',
      hours: parseFloat(row[4] || '1'),
      courtPrice: parseFloat(row[5] || '0'),
      racketPrice: parseFloat(row[6] || '0'),
      waterPrice: parseFloat(row[7] || '0'),
      participants: row[8] ? row[8].split(',').filter(Boolean) : [],
      status: row[9] || 'pending', // pending, done
    }));
  } catch (error: any) {
    if (error?.response?.status === 400 || error?.code === 400) {
      try {
        await initializeSheets();
        const response = await sheetsClient.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEETS.SCHEDULES}!A2:J`,
        });
        return (response.data.values || []).map((row: any, index: number) => ({
          id: row[0] || `schedule_${Date.now()}_${index}`,
          courtID: row[1] || '',
          date: row[2] || '',
          startTime: row[3] || '',
          hours: parseFloat(row[4] || '1'),
          courtPrice: parseFloat(row[5] || '0'),
          racketPrice: parseFloat(row[6] || '0'),
          waterPrice: parseFloat(row[7] || '0'),
          participants: row[8] ? row[8].split(',').filter(Boolean) : [],
          status: row[9] || 'pending',
        }));
      } catch (initError) {
        console.error('Error initializing or getting schedules:', initError);
        return [];
      }
    }
    console.error('Error getting schedules:', error);
    return [];
  }
}

export async function addSchedule(schedule: {
  courtID: string;
  date: string;
  startTime: string;
  hours: number;
  courtPrice: number;
  racketPrice: number;
  waterPrice: number;
  participants: string[];
}) {
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  const id = `schedule_${Date.now()}`;
  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.SCHEDULES}!A:J`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        id,
        schedule.courtID,
        schedule.date,
        schedule.startTime,
        schedule.hours,
        schedule.courtPrice,
        schedule.racketPrice,
        schedule.waterPrice,
        schedule.participants.join(','),
        'pending',
      ]],
    },
  });
  return id;
}

export async function updateSchedule(id: string, updates: Partial<{
  courtID?: string;
  date?: string;
  startTime?: string;
  hours?: number;
  courtPrice?: number;
  racketPrice?: number;
  waterPrice?: number;
  participants?: string[];
  status?: string;
}>) {
  const schedules = await getSchedules();
  const scheduleIndex = schedules.findIndex((s: any) => s.id === id);
  if (scheduleIndex === -1) throw new Error('Schedule not found');

  const schedule = schedules[scheduleIndex];
  const updated = { ...schedule, ...updates };
  
  const rowIndex = scheduleIndex + 2; // +2 because of header and 0-based index
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.SCHEDULES}!A${rowIndex}:J${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        updated.id,
        updated.courtID,
        updated.date,
        updated.startTime,
        updated.hours,
        updated.courtPrice,
        updated.racketPrice,
        updated.waterPrice,
        updated.participants.join(','),
        updated.status,
      ]],
    },
  });
}

export async function deleteSchedule(id: string) {
  const schedules = await getSchedules();
  const scheduleIndex = schedules.findIndex((s: any) => s.id === id);
  if (scheduleIndex === -1) throw new Error('Schedule not found');

  const rowIndex = scheduleIndex + 2;
  const sheetId = await getSheetId(SHEETS.SCHEDULES);
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          },
        },
      }],
    },
  });
}

// Payments
export async function getPayments() {
  if (isBuildTime) {
    return [];
  }
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    return [];
  }
  
  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.PAYMENTS}!A2:F`,
    });
    return (response.data.values || []).map((row: any) => ({
      id: row[0] || '',
      scheduleID: row[1] || '',
      memberID: row[2] || '',
      courtShare: parseFloat(row[3] || '0'),
      racketShare: parseFloat(row[4] || '0'),
      waterShare: parseFloat(row[5] || '0'),
    }));
  } catch (error: any) {
    if (error?.response?.status === 400 || error?.code === 400) {
      try {
        await initializeSheets();
        const response = await sheetsClient.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEETS.PAYMENTS}!A2:F`,
        });
        return (response.data.values || []).map((row: any) => ({
          id: row[0] || '',
          scheduleID: row[1] || '',
          memberID: row[2] || '',
          courtShare: parseFloat(row[3] || '0'),
          racketShare: parseFloat(row[4] || '0'),
          waterShare: parseFloat(row[5] || '0'),
        }));
      } catch (initError) {
        console.error('Error initializing or getting payments:', initError);
        return [];
      }
    }
    console.error('Error getting payments:', error);
    return [];
  }
}

export async function addPayments(payments: Array<{
  scheduleID: string;
  memberID: string;
  courtShare: number;
  racketShare: number;
  waterShare: number;
}>) {
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  const values = payments.map(p => [
    `payment_${Date.now()}_${Math.random()}`,
    p.scheduleID,
    p.memberID,
    p.courtShare,
    p.racketShare,
    p.waterShare,
  ]);

  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.PAYMENTS}!A:F`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

// Funds
export async function getFunds() {
  if (isBuildTime) {
    return [];
  }
  
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    return [];
  }
  
  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.FUNDS}!A2:C`,
    });
    
    if (!response.data.values || response.data.values.length === 0) {
      return [];
    }
    
    return response.data.values.map((row: any) => ({
      id: row[0] || '',
      memberID: row[1] || '',
      amount: parseFloat(row[2] || '0'),
    }));
  } catch (error: any) {
    if (error?.response?.status === 400 || error?.code === 400) {
      try {
        await initializeSheets();
        const response = await sheetsClient.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEETS.FUNDS}!A2:C`,
        });
        return (response.data.values || []).map((row: any) => ({
          id: row[0] || '',
          memberID: row[1] || '',
          amount: parseFloat(row[2] || '0'),
        }));
      } catch (initError) {
        console.error('Error initializing or getting funds:', initError);
        return [];
      }
    }
    console.error('Error getting funds:', error);
    return [];
  }
}

export async function addFund(fund: { memberID: string; amount: number }) {
  const sheetsClient = getSheets();
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  const id = `fund_${Date.now()}`;
  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.FUNDS}!A:C`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, fund.memberID, fund.amount]],
    },
  });
  return id;
}

export async function getMemberBalance(memberID: string) {
  const [funds, payments] = await Promise.all([getFunds(), getPayments()]);
  
  const totalFunds = funds
    .filter((f: any) => f.memberID === memberID)
    .reduce((sum: number, f: any) => sum + f.amount, 0);
  
  const totalPayments = payments
    .filter((p: any) => p.memberID === memberID)
    .reduce((sum: number, p: any) => sum + p.courtShare + p.racketShare + p.waterShare, 0);
  
  return totalFunds - totalPayments;
}

