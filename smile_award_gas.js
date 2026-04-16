/**
 * SBH Hospital - Smile Award System (Production v2.0)
 * Target Spreadsheet ID: 1ihkS8fjoKBxAQ5MxHutXrOoyrQAURlhhkoSkkbNcUXs
 */

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Staff Master (Expanded for Employee List)
  let staffSheet = ss.getSheetByName('Staff_Master');
  if (!staffSheet) {
    staffSheet = ss.insertSheet('Staff_Master');
    staffSheet.appendRow(['Staff_ID', 'Name', 'Department', 'Role', 'Email', 'Mobile', 'DOB', 'DOJ']);
    staffSheet.getRange("A1:H1").setBackground("#2E7D32").setFontColor("white").setFontWeight("bold");
    // Initial Example
    staffSheet.appendRow(['ST001', 'Rahul Sharma', 'OPD', 'Doctor', 'rahul@gmail.com', '9876543210', '1990-05-15', '2023-01-10']);
  } else {
    // Check if we need to upgrade old sheet headers
    const currentHeaders = staffSheet.getRange("A1:E1").getValues()[0];
    if (currentHeaders.length === 5 && currentHeaders[0] === 'Staff_ID') {
        staffSheet.getRange("A1:H1").setValues([['Staff_ID', 'Name', 'Department', 'Role', 'Email', 'Mobile', 'DOB', 'DOJ']]);
    }
  }

  // 2. Smile Entries
  let entriesSheet = ss.getSheetByName('Smile_Entries');
  if (!entriesSheet) {
    entriesSheet = ss.insertSheet('Smile_Entries');
    entriesSheet.appendRow(['Timestamp', 'Month', 'Voter_ID', 'Voter_Name', 'Employee_ID', 'Employee_Name', 'Department', 'Remarks']);
    entriesSheet.getRange("A1:H1").setBackground("#1a365d").setFontColor("white").setFontWeight("bold");
  }

  // 3. Master Summary (QUERY based leaderboard)
  let summarySheet = ss.getSheetByName('Master_Summary');
  if (!summarySheet) {
    summarySheet = ss.insertSheet('Master_Summary');
  }
  summarySheet.getRange("A1").setFormula('=QUERY(Smile_Entries!A:H, "SELECT B, F, G, COUNT(F) WHERE F IS NOT NULL GROUP BY B, F, G ORDER BY COUNT(F) DESC LABEL COUNT(F) \'Votes\'", 1)');
  
  // FORCE PLAIN TEXT for Month Columns to prevent ISO Timestamp conversion
  entriesSheet.getRange("B:B").setNumberFormat("@");
  summarySheet.getRange("A:A").setNumberFormat("@");
}

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    if (action === 'get_staff') return getStaffList();
    if (action === 'get_leaderboard') return getLeaderboardData();
    if (action === 'get_winners') return getFinalWinners();
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
  return createJsonResponse({ success: false, message: "Invalid action" });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  try {
    if (action === 'save_vote') return saveVote(data);
    if (action === 'approve_winner') return approveWinner(data);
    if (action === 'add_staff') return addStaff(data);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
  return createJsonResponse({ success: false, message: "Unknown POST action" });
}

// --- LOGIC FUNCTIONS ---

function getStaffList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Staff_Master');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse([]);
  
  const headers = data[0];
  const staff = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return createJsonResponse(staff);
}

function saveVote(res) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const entriesSheet = ss.getSheetByName('Smile_Entries');
  const staffSheet = ss.getSheetByName('Staff_Master');
  
  const now = new Date();
  const timestamp = Utilities.formatDate(now, "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
  const month = Utilities.formatDate(now, "GMT+5:30", "MMMM yyyy");
  
  // Self-Learning: Add Nominee to Master if new
  if (res.isNewNominee && res.employeeName) {
    const nextId = "ST" + (staffSheet.getLastRow() + 100);
    staffSheet.appendRow([nextId, res.employeeName, res.department || 'General', 'Staff', '', '', '', '']);
  }

  // Self-Learning: Add Voter to Master if new
  if (res.isNewVoter && res.voterName) {
    const nextId = "ST" + (staffSheet.getLastRow() + 101);
    staffSheet.appendRow([nextId, res.voterName, 'General', 'Staff', '', '', '', '']);
  }

  entriesSheet.appendRow([
    timestamp,
    month,
    res.voterId || 'N/A',
    res.voterName || 'Anonymous',
    res.employeeId || 'N/A',
    res.employeeName,
    res.department,
    res.remarks
  ]);
  
  return createJsonResponse({ success: true, timestamp: timestamp });
}

function getLeaderboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Master_Summary');
  // getDisplayValues is crucial – it takes the text as seen in the sheet (e.g. "April 2026")
  // and ignores any background Date/ISO conversion by Google
  const data = sheet.getDataRange().getDisplayValues();
  
  // Skip headers from QUERY which is at A1
  if (data.length <= 1) return createJsonResponse([]);
  
  const entries = data.slice(1).map(row => ({
    month: row[0],
    name: row[1],
    dept: row[2],
    votes: row[3]
  }));
  return createJsonResponse(entries);
}

function approveWinner(res) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Final_Winner');
  const staffSheet = ss.getSheetByName('Staff_Master');
  const now = new Date();
  const approvedAt = Utilities.formatDate(now, "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
  
  // Try to find mobile number from Staff_Master
  let mobileToMessage = res.mobile || 'N/A';
  if (mobileToMessage === 'N/A' || !mobileToMessage) {
      const staffData = staffSheet.getDataRange().getValues();
      for(let i=1; i<staffData.length; i++) {
          if(staffData[i][1].toLowerCase() === res.name.toLowerCase() && staffData[i][5]) {
              mobileToMessage = staffData[i][5]; // Mobile is index 5
              break;
          }
      }
  }

  sheet.appendRow([
    res.month,
    res.department || res.dept,
    res.name,
    res.votes,
    res.email || 'N/A',
    mobileToMessage,
    'Approved',
    approvedAt
  ]);
  
  // Trigger automation
  sendRecognition({ ...res, mobile: mobileToMessage });
  
  return createJsonResponse({ success: true });
}

function addStaff(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const staffSheet = ss.getSheetByName('Staff_Master');
  const nextId = "ST" + (staffSheet.getLastRow() + 100);
  
  staffSheet.appendRow([
    nextId,
    data.name,
    data.department,
    data.role || 'Staff',
    data.email || '',
    data.mobile || '',
    data.dob || '',
    data.doj || ''
  ]);
  return createJsonResponse({ success: true });
}

function getFinalWinners() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Final_Winner');
    if (!sheet) return createJsonResponse([]);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createJsonResponse([]);
    
    const headers = data[0];
    const winners = data.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h.toLowerCase()] = row[i]);
        return obj;
    });
    return createJsonResponse(winners);
}

function sendRecognition(data) {
  if (!data.mobile || data.mobile === 'N/A' || data.mobile.trim() === '') {
    console.log("No mobile number provided for " + data.name + ". Skipping WhatsApp.");
    return;
  }

  const username = "SBH HOSPITAL";
  const password = "123456789";
  const mobile = data.mobile;
  const name = data.name;
  const month = data.month;
  const dept = data.department || data.dept;
  
  const message = `🎉 Congratulations *${name}*! You have been awarded the *Smile Award* for ${month} from the ${dept} department at SBH Hospital! 🏆\n\nYour hard work and dedication inspire us all. Keep shining! 😊`;

  sendWhatsApp(mobile, message);
}

function sendWhatsApp(mobile, message) {
  const username = "SBH HOSPITAL";
  const password = "123456789";
  const baseUrl = "https://app.messageautosender.com/message/new";
  const finalUrl = baseUrl + 
    "?username=" + encodeURIComponent(username) +
    "&password=" + encodeURIComponent(password) +
    "&receiverMobileNo=" + encodeURIComponent(mobile) +
    "&message=" + encodeURIComponent(message);

  try {
    UrlFetchApp.fetch(finalUrl);
  } catch (e) {
    console.error("Failed to send WhatsApp message: " + e.toString());
  }
}

// ==========================================
// AUTOMATION: RUN THIS DAILY VIA TRIGGERS
// ==========================================
function dailyCheckEvents() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Staff_Master');
  if(!sheet) return;
  const data = sheet.getDataRange().getDisplayValues();
  if(data.length <= 1) return;

  const today = new Date();
  // Get MM-DD format to match without dealing with timezone shifts easily
  const todayStr = Utilities.formatDate(today, "GMT+5:30", "MM-dd");
  const todayYear = parseInt(Utilities.formatDate(today, "GMT+5:30", "yyyy"));

  // Start from row 1 (exclude header)
  for(let i=1; i<data.length; i++) {
    const name = data[i][1];
    const mobile = data[i][5];
    const dob = data[i][6]; // e.g. 1990-05-15
    const doj = data[i][7]; // e.g. 2023-01-10
    
    if(!mobile || mobile.trim() === '') continue;

    // Check Birthday
    if(dob && dob.length >= 5) {
      // dob format should ideally be YYYY-MM-DD or standard display
      // If we extract the last 5 chars of YYYY-MM-DD it gets MM-DD
      const dobStr = dob.substring(dob.length - 5); 
      if(dobStr === todayStr) {
         const msg = `🎂 Happy Birthday *${name}*! 🎉\n\nWishing you a fantastic day filled with joy and success from all of us at SBH Hospital. Have a great year ahead!`;
         sendWhatsApp(mobile, msg);
      }
    }

    // Check Anniversary
    if(doj && doj.length >= 5) {
      const dojStr = doj.substring(doj.length - 5);
      if(dojStr === todayStr) {
         let years = 0;
         try {
             const joinYear = parseInt(doj.substring(0, 4));
             years = todayYear - joinYear;
         } catch(e) {}
         
         if(years > 0) {
             const msg = `🌟 Happy Work Anniversary *${name}*! 🎉\n\nCongratulations on completing ${years} wonderful year(s) with us at SBH Hospital! We truly appreciate your hard work and dedication.`;
             sendWhatsApp(mobile, msg);
         }
      }
    }
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
