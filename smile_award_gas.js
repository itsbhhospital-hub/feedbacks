/**
 * SBH Hospital - Smile Award System (Production v2.0)
 * Target Spreadsheet ID: 1ihkS8fjoKBxAQ5MxHutXrOoyrQAURlhhkoSkkbNcUXs
 */

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Staff Master
  let staffSheet = ss.getSheetByName('Staff_Master');
  if (!staffSheet) {
    staffSheet = ss.insertSheet('Staff_Master');
    staffSheet.appendRow(['Staff_ID', 'Name', 'Department', 'Email', 'Mobile']);
    staffSheet.getRange("A1:E1").setBackground("#2E7D32").setFontColor("white").setFontWeight("bold");
    // Initial Example
    staffSheet.appendRow(['ST001', 'Rahul Sharma', 'OPD', 'rahul@gmail.com', '9876543210']);
  }

  // 2. Smile Entries
  let entriesSheet = ss.getSheetByName('Smile_Entries');
  if (!entriesSheet) {
    entriesSheet = ss.insertSheet('Smile_Entries');
    entriesSheet.appendRow(['Timestamp', 'Month', 'Voter_ID', 'Voter_Name', 'Employee_ID', 'Employee_Name', 'Department', 'Remarks']);
    entriesSheet.getRange("A1:H1").setBackground("#1a365d").setFontColor("white").setFontWeight("bold");
  }

  // 3. Master Summary (QUERY based leaderboard)
  // This sheet is effectively managed by the QUERY formula in cell A2
  let summarySheet = ss.getSheetByName('Master_Summary');
  if (!summarySheet) {
    summarySheet = ss.insertSheet('Master_Summary');
    summarySheet.getRange("A2").setFormula('=QUERY(Smile_Entries!A:H, "SELECT B, F, G, COUNT(F) WHERE F IS NOT NULL GROUP BY B, F, G ORDER BY COUNT(F) DESC LABEL COUNT(F) \'Votes\'", 1)');
  }

  // 4. Final Winner
  let winnerSheet = ss.getSheetByName('Final_Winner');
  if (!winnerSheet) {
    winnerSheet = ss.insertSheet('Final_Winner');
    winnerSheet.appendRow(['Month', 'Department', 'Employee_Name', 'Votes', 'Email', 'Mobile', 'Status', 'Approved_At']);
    winnerSheet.getRange("A1:H1").setBackground("#c2410c").setFontColor("white").setFontWeight("bold");
  }
}

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    if (action === 'get_staff') {
      return getStaffList();
    }
    if (action === 'get_leaderboard') {
      return getLeaderboardData();
    }
    if (action === 'get_winners') {
      return getFinalWinners();
    }
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
  
  return createJsonResponse({ success: false, message: "Invalid action" });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  try {
    if (action === 'save_vote') {
      return saveVote(data);
    }
    if (action === 'approve_winner') {
      return approveWinner(data);
    }
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
  const sheet = ss.getSheetByName('Smile_Entries');
  const now = new Date();
  const timestamp = Utilities.formatDate(now, "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
  const month = Utilities.formatDate(now, "GMT+5:30", "MMMM yyyy");
  
  sheet.appendRow([
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
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse([]);
  
  const headers = data[0]; // Month, Employee_Name, Department, Votes
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
  const now = new Date();
  const approvedAt = Utilities.formatDate(now, "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
  
  sheet.appendRow([
    res.month,
    res.department,
    res.name,
    res.votes,
    res.email || 'N/A',
    res.mobile || 'N/A',
    'Approved',
    approvedAt
  ]);
  
  // Trigger automation (WhatsApp/Email Placeholder)
  sendRecognition(res);
  
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
  if (!data.mobile || data.mobile === 'N/A') {
    console.log("No mobile number provided for " + data.name + ". Skipping WhatsApp.");
    return;
  }

  const username = "SBH HOSPITAL";
  const password = "123456789";
  const mobile = data.mobile;
  const name = data.name;
  const month = data.month;
  
  const message = "🎉 Congratulations " + name + "! You have been awarded the *Smile Award* for " + month + " at SBH Hospital! 🏆\n\nYour hard work and dedication to patient excellence inspire us all. Keep shining and keep smiling! 😊";

  const baseUrl = "https://app.messageautosender.com/message/new";
  const finalUrl = baseUrl + 
    "?username=" + encodeURIComponent(username) +
    "&password=" + encodeURIComponent(password) +
    "&receiverMobileNo=" + encodeURIComponent(mobile) +
    "&receiverName=" + encodeURIComponent(name) +
    "&message=" + encodeURIComponent(message);

  try {
    const response = UrlFetchApp.fetch(finalUrl);
    console.log("WhatsApp API Response: " + response.getContentText());
  } catch (e) {
    console.error("Failed to send WhatsApp message: " + e.toString());
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
