// Set up Google Sheets API
let CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
let API_KEY = 'YOUR_GOOGLE_API_KEY';
let DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
let SCOPES = "https://www.googleapis.com/auth/spreadsheets";

let gapiLoaded = false; // Flag to check if the API is loaded
let auth2 = null;
let spreadsheetId = 'YOUR_SPREADSHEET_ID';  // The ID of your Google Sheet

// Initialize the Google API Client
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(() => {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
}

// Load the Google API client
function loadClient() {
    gapi.load("client:auth2", initClient);
}

// Sign-in function
function handleAuthClick() {
    gapi.auth2.getAuthInstance().signIn();
}

// Update sign-in status
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        document.getElementById("login-btn").style.display = "none";  // Hide login button
        loadTasks();  // Load existing tasks from the sheet
    } else {
        document.getElementById("login-btn").style.display = "block";  // Show login button
    }
}

// Function to add a task to the Google Sheet
function addTask() {
    const title = document.getElementById("task-title").value;
    const date = document.getElementById("task-date").value;
    const details = document.getElementById("task-details").value;

    if (title && date && details) {
        const task = [title, date, details, "Not Completed"];  // Adding a default 'Not Completed' status
        appendTaskToSheet(task);
    } else {
        alert("Please fill out all fields!");
    }
}

// Append a new task to the sheet
function appendTaskToSheet(task) {
    const range = 'Sheet1!A:D';  // The range where tasks are stored
    const valueRangeBody = {
        values: [task]
    };

    gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        resource: valueRangeBody
    }).then(response => {
        console.log('Task added to Google Sheets');
        loadTasks();  // Reload tasks after adding
    }, err => console.error(err));
}

// Load tasks from the Google Sheet
function loadTasks() {
    const range = 'Sheet1!A:D';  // Adjust the range as needed
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range
    }).then(response => {
        const tasks = response.result.values;
        renderTasks(tasks);
    }, err => console.error('Error loading tasks: ', err));
}

// Render tasks to the page
function renderTasks(tasks) {
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';  // Clear existing tasks

    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.classList.add('todo-card');
        taskCard.innerHTML = `
            <h3>${task[0]}</h3>
            <p>${task[2]}</p>
            <p class="date-time">Due: ${task[1]}</p>
            <button onclick="deleteTask('${task[0]}')">Delete</button>
        `;
        todoList.appendChild(taskCard);
    });
}

// Delete a task from the Google Sheet
function deleteTask(taskTitle) {
    const range = 'Sheet1!A:A';  // Assuming task titles are in column A
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range
    }).then(response => {
        const rows = response.result.values;
        const rowIndex = rows.findIndex(row => row[0] === taskTitle);
        if (rowIndex !== -1) {
            deleteRowFromSheet(rowIndex);
        }
    });
}

// Delete a specific row from the Google Sheet
function deleteRowFromSheet(rowIndex) {
    const requests = [{
        deleteDimension: {
            range: {
                sheetId: 0,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1
            }
        }
    }];

    const batchUpdateRequest = { requests: requests };
    gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: batchUpdateRequest
    }).then(response => {
        console.log('Row deleted');
        loadTasks();  // Reload tasks after deletion
    });
}

// Load the Google API client when the page loads
window.onload = function () {
    loadClient();
};
