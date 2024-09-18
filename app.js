// Firebase configuration (replace with your config)
var firebaseConfig = {
    apiKey: "AIzaSyBr3UMkygb2GpEDfRX_lE3mv3c_v7FiU_4",
    authDomain: "budgetwise-4b34f.firebaseapp.com",
    databaseURL: "https://budgetwise-4b34f-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "budgetwise-4b34f",
    storageBucket: "budgetwise-4b34f.appspot.com",
    messagingSenderId: "134490215311",
    appId: "1:134490215311:web:d78f538dd5c9e8cc8ef1fa",
    measurementId: "G-0RSW9PSH90"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

// Enable Firestore persistence (optional)
firebase.firestore().enablePersistence().catch(function (err) {
    if (err.code == 'failed-precondition') {
        console.log("Persistence failed, multiple tabs are open.");
    } else if (err.code == 'unimplemented') {
        console.log("Persistence is not supported by this browser.");
    }
});

var dataCollection = db.collection("dataCollection");
let lastVisible = null; // For Firestore pagination
let firstVisible = null; // For scrolling up
let isLoading = false;  // To prevent multiple simultaneous requests

// Global collection reference (same for all users)
var dataCollection = db.collection("dataCollection");

// Login Handling
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    // Example credentials; replace with your own
    var validUsername = 'miirefcon';
    var validPassword = 'JANET2279';

    if (username === validUsername && password === validPassword) {
        // Show the app container and hide the login container
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        fetchData(); // Fetch initial data
    } else {
        // Show error message
        document.getElementById('errorMessage').style.display = 'block';
    }
});

// Check if user is already logged in
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    if (isLoggedIn) {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
    } else {
        document.getElementById('loginContainer').style.display = 'block';
        document.getElementById('appContainer').style.display = 'none';
    }
}

// Save login state
function setLoginState(isLoggedIn) {
    localStorage.setItem('loggedIn', isLoggedIn ? 'true' : 'false');
}

// Handle login form submission
function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Replace with your own credentials
    const validUsername = 'miirefcon';
    const validPassword = 'JANET2279';

    if (username === validUsername && password === validPassword) {
        setLoginState(true);
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
    } else {
        document.getElementById('errorMessage').style.display = 'block';
    }
}

// Handle logout
function handleLogout() {
    setLoginState(false);
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('appContainer').style.display = 'none';
}

// Function to initialize event listeners
function initializeEventListeners() {
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // Initialize tabs and other functionalities if needed
    showTab('inputTab');
}

// Run when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    initializeEventListeners();
});



function showTab(tab) {
    document.getElementById('inputTab').style.display = (tab === 'inputTab') ? 'block' : 'none';
    document.getElementById('viewTab').style.display = (tab === 'viewTab') ? 'block' : 'none';
    if (tab === 'viewTab') {
        fetchData();  // Fetch data from Firestore when switching to the "View Data" tab
    }
    
}

function formatCurrency(value, includeSymbol = true) {
    if (isNaN(value) || value === null || value === '') {
        return includeSymbol ? '₱0.00' : '0.00'; // Default value for invalid input
    }
    
    // Parse the value to float and format it
    var number = parseFloat(value);
    var formatted = number.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    return includeSymbol ? '₱' + formatted : formatted;
}

function setupRealTimeListener() {
    dataCollection.orderBy("date", "desc").onSnapshot((snapshot) => {
        var dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
        dataTable.innerHTML = "";

        if (snapshot.empty) {
            console.log('No documents found.');
            return;
        }

        snapshot.docs.forEach(doc => {
            var rowData = doc.data();
            var row = dataTable.insertRow();

            ['date', 'name', 'contactNumber', 'address', 'brand', 'model', 'serialNumber', 'dateOfPurchase', 'amount', 'remarks', 'technicianInCharge'].forEach((field, index) => {
                var cell = row.insertCell(index);
                if (field === 'serialNumber') {
                    // Display serial numbers as paragraph
                    cell.innerHTML = `<pre>${rowData[field] || ''}</pre>`;
                } else if (field === 'amount') {
                    cell.textContent = formatCurrency(rowData[field]); // Apply currency formatting
                } else {
                    cell.textContent = rowData[field] || '';
                }
            });

            generateActionCells(row, doc.id);
        });
    }, (error) => {
        console.error("Error fetching real-time updates: ", error);
    });
}



// Call this function once on page load
setupRealTimeListener();


function saveData() {
    var formData = {
        date: document.getElementById("date").value,
        name: document.getElementById("name").value,
        contactNumber: document.getElementById("contactNumber").value,
        address: document.getElementById("address").value,
        brand: document.getElementById("brand").value,
        model: document.getElementById("model").value,
        serialNumber: document.getElementById("serialNumber").value,
        dateOfPurchase: document.getElementById("dateOfPurchase").value,
        amount: parseFloat(document.getElementById("amount").value.replace(/[^0-9.-]+/g,"")), // Parse amount as float
        remarks: document.getElementById("remarks").value,
        technicianInCharge: document.getElementById("technicianInCharge").value // New field
    };

    // Ensure all required fields are filled out
    if (!formData.date || !formData.name || !formData.contactNumber || !formData.address || !formData.brand || !formData.model || !formData.serialNumber || !formData.dateOfPurchase || isNaN(formData.amount)) {
        alert("Please fill out all required fields.");
        return;
    }

    var docId = document.getElementById('docId').value;

    if (docId) {
        // Update existing document
        dataCollection.doc(docId).update(formData).then(() => {
            alert("Data successfully updated!");
            document.getElementById("dataForm").reset();  // Reset the form after saving
            document.getElementById('docId').value = '';  // Clear docId
            showTab('viewTab');  // Switch back to view tab
            toggleActions(false); // Hide actions
            toggleActions(true);  // Show actions
            fetchData();  // Refresh the table
        }).catch((error) => {
            console.error("Error updating document: ", error);
        });
    } else {
        // Add new document
        dataCollection.add(formData).then(() => {
            alert("Data successfully saved!");
            document.getElementById("dataForm").reset();  // Reset the form after saving
            showTab('viewTab');  // Switch back to view tab
            fetchData();  // Refresh the table
        }).catch((error) => {
            console.error("Error saving document: ", error);
        });
    }
}


// Function to format amount when displaying in the table
function formatTableAmount(amount) {
    return formatCurrency(amount);
}


// Function to sort the table by Date (column index 0)
function sortTableByDate() {
    sortTable(0);  // Assuming "Date" is the first column (index 0)
}

// Function to sort the table by Date of Purchase (column index 7)
function sortTableByDateOfPurchase() {
    sortTable(7);  // Assuming "Date of Purchase" is the 8th column (index 7)
}

// Generic function to sort the table based on a column index
function sortTable(columnIndex) {
    var table = document.getElementById("dataTable");
    var tbody = table.getElementsByTagName('tbody')[0]; // Only manipulate tbody
    var rows = Array.from(tbody.rows); // Get all rows from tbody

    // Sort rows based on the content of the column
    rows.sort(function (a, b) {
        var aValue = a.cells[columnIndex].innerText;
        var bValue = b.cells[columnIndex].innerText;

        // Convert to date if sorting by date fields
        if (columnIndex === 0 || columnIndex === 7) {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
        }

        return aValue > bValue ? 1 : -1;
    });

    // Reattach sorted rows to the tbody
    rows.forEach(row => tbody.appendChild(row));
}

// Function to toggle the display of the Actions column
function toggleActions() {
    var actionHeaders = document.querySelectorAll('.action-header');
    var actionCells = document.querySelectorAll('.action-cell');

    if (actionHeaders.length === 0) {
        console.error("No actions column found in the table header.");
        return;
    }

    // Check if the actions are hidden and toggle visibility
    var isHidden = actionHeaders[0].style.display === 'none';

    // Toggle visibility for both action headers and cells
    actionHeaders.forEach(header => {
        header.style.display = isHidden ? 'table-cell' : 'none';
    });

    actionCells.forEach(cell => {
        cell.style.display = isHidden ? 'table-cell' : 'none';
    });
}

// Call this function to add action cells when generating the table
function generateActionCells(row, docId) {
    row.setAttribute('data-doc-id', docId); // Set an attribute for easier row identification later
    var currentCellCount = row.cells.length;

    // Ensure the row has enough cells (at least 12 cells)
    if (currentCellCount <= 11) {
        for (let i = currentCellCount; i < 12; i++) {
            row.insertCell(i);
        }
    }

    // Insert the action cell at index 10 (the 11th cell, zero-based index)
    var actionCell = row.cells[11];  // Access the 11th cell (index 10)
    actionCell.classList.add('action-cell');  // Ensure the action-cell class is applied
    actionCell.innerHTML = `
        <button onclick="editRow('${docId}')">Edit</button>
        <button onclick="deleteRow('${docId}')">Delete</button>`;
    actionCell.style.display = 'none';  // Initially hide actions
}

// Function to edit a row
function editRow(docId) {
    dataCollection.doc(docId).get().then((doc) => {
        if (doc.exists) {
            var data = doc.data();
            
            // Set form fields with document data
            ['date', 'name', 'contactNumber', 'address', 'brand', 'model', 'serialNumber', 'dateOfPurchase', 'amount', 'remarks'].forEach(field => {
                const element = document.getElementById(field);
                if (element) {
                    element.value = data[field] || '';
                } else {
                    console.error(`Element with ID ${field} not found.`);
                }
            });

            // Set docId in hidden input
            document.getElementById('docId').value = doc.id;
            showTab('inputTab');
        } else {
            console.log("No such document!");
        }

        
    }).catch((error) => {
        console.error("Error getting document: ", error);
    });
}

// Function to delete a row from Firestore and handle UI updates (hide and show action buttons)
function deleteRow(docId) {
    if (confirm('Are you sure you want to delete this record?')) {
        dataCollection.doc(docId).delete().then(() => {
            alert("Document successfully deleted!");

            // Remove the row directly from the DOM after deletion
            var row = document.querySelector(`tr[data-doc-id="${docId}"]`);
            if (row) {
                row.remove();  // Remove the row from the table
            }

            // Ensure actions are properly toggled
            toggleActions(false); // Hide actions
            toggleActions(true);  // Show actions

        }).catch((error) => {
            console.error("Error removing document: ", error);
        });
    }
}

function formatSerialNumbers(serialNumbers) {
    // No need to join lines, just return the trimmed input
    const formattedNumbers = serialNumbers.trim();
    
    if (formattedNumbers === '') {
        alert('No serial numbers found. Please enter some serial numbers.');
    }

    return formattedNumbers; // Return as multi-line text
}


function fetchData(direction = 'down') {
    if (isLoading) return;
    isLoading = true;

    var dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    if (!dataTable) {
        console.error("Table body not found.");
        isLoading = false;
        return;
    }

    if (direction === 'down' && dataTable.rows.length === 0) {
        dataTable.innerHTML = "";
    }

    let query = dataCollection.orderBy("date", "desc").limit(10);

    if (direction === 'down') {
        if (lastVisible) {
            query = query.startAfter(lastVisible);
        }
    } else if (direction === 'up') {
        if (firstVisible) {
            query = query.endBefore(firstVisible);
        }
    }

    query.get().then((snapshot) => {
        if (snapshot.empty) {
            if (direction === 'down') {
                document.removeEventListener('scroll', handleScroll);
            }
            isLoading = false;
            return;
        }

        snapshot.docs.forEach(doc => {
            var row = dataTable.insertRow();
            var data = doc.data();
            ['date', 'name', 'contactNumber', 'address', 'brand', 'model', 'serialNumber', 'dateOfPurchase', 'amount', 'remarks'].forEach((field, index) => {
                var cell = row.insertCell(index);
                if (field === 'amount') {
                    cell.textContent = formatCurrency(data[field]); // Format the amount field
                } else {
                    cell.textContent = data[field] || '';
                }
            });
            generateActionCells(row, doc.id);
        });

        firstVisible = snapshot.docs[0];
        lastVisible = snapshot.docs[snapshot.docs.length - 1];

        isLoading = false;
    }).catch((error) => {
        console.error("Error fetching documents: ", error);
        isLoading = false;
    });
}

function searchByKeyword() {
    var keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    var dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    
    // Clear previous rows
    dataTable.innerHTML = "";

    if (!keyword) {
        // Reset pagination variables
        firstVisible = null;
        lastVisible = null;
        // Fetch initial data
        fetchData();
        return;
    }

    // If there is a keyword, search for matching documents
    dataCollection.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            var rowData = doc.data();
            var matchFound = ['name', 'brand', 'remarks'].some(field => {
                return (rowData[field] && rowData[field].toLowerCase().includes(keyword));
            });

            if (matchFound) {
                var row = dataTable.insertRow();
                
                ['date', 'name', 'contactNumber', 'address', 'brand', 'model', 'serialNumber', 'dateOfPurchase', 'amount', 'remarks'].forEach((field, index) => {
                    var cell = row.insertCell(index);
                    if (field === 'amount') {
                        cell.textContent = formatCurrency(rowData[field]); // Apply currency formatting
                    } else {
                        cell.textContent = rowData[field] || '';
                    }
                });

                // Add Edit/Delete buttons
                var actionCell = row.insertCell(10);
                actionCell.classList.add('action-cell');
                actionCell.innerHTML = `
                    <button onclick="editRow('${doc.id}')">Edit</button>
                    <button onclick="deleteRow('${doc.id}')">Delete</button>`;
            }
        });
    }).catch((error) => {
        console.error("Error searching data: ", error);
    });
}

function filterByDateRange() {
    var startDate = document.getElementById('startDate').value;
    var endDate = document.getElementById('endDate').value;
    var dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    
    // Clear previous rows
    dataTable.innerHTML = "";

    if (!startDate || !endDate) {
        // Reset pagination variables
        firstVisible = null;
        lastVisible = null;
        // Fetch initial data
        fetchData();
        return;
    }

    // Fetch data from Firestore based on date range
    dataCollection
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .orderBy("date")
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.empty) {
            alert('No data found for the selected date range.');
        } else {
            querySnapshot.forEach((doc) => {
                var rowData = doc.data();
                var row = dataTable.insertRow();
                
                ['date', 'name', 'contactNumber', 'address', 'brand', 'model', 'serialNumber', 'dateOfPurchase', 'amount', 'remarks'].forEach((field, index) => {
                    var cell = row.insertCell(index);
                    if (field === 'amount') {
                        cell.textContent = formatCurrency(rowData[field]); // Apply currency formatting
                    } else {
                        cell.textContent = rowData[field] || '';
                    }
                });

                // Add Edit/Delete buttons
                var actionCell = row.insertCell(10);
                actionCell.classList.add('action-cell');
                actionCell.innerHTML = `
                    <button onclick="editRow('${doc.id}')">Edit</button>
                    <button onclick="deleteRow('${doc.id}')">Delete</button>`;
            });
        }
    }).catch((error) => {
        console.error("Error filtering data: ", error);
    });
}

function exportPDF() {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Ensure autoTable is available
    if (typeof doc.autoTable === 'undefined') {
        console.error('autoTable plugin is not loaded.');
        return;
    }

    // Custom header and footer for every page
    const headerText = "BUDGETWISE FREE INSTALLATION";
    const footerText = "MI&I REFRIGERATION AND AIRCONDITIONING SERVICES";

    function addHeaderFooter(data) {
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text(headerText, data.settings.margin.left, 10);

        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.setFontSize(10);
        doc.text(footerText, data.settings.margin.left, pageHeight - 10);
    }

    const tableBody = document.querySelectorAll('#dataTable tbody tr');
    const visibleRows = Array.from(tableBody).filter(row => row.style.display !== 'none');

    if (visibleRows.length === 0) {
        alert('No data available to export.');
        return;
    }

    // Exclude columns with index 10 and 11 (Technicians in Charge and Actions)
    const excludeIndexes = [10, 11];

    const headers = Array.from(document.querySelectorAll('#dataTable thead th'))
        .map((th, index) => excludeIndexes.includes(index) ? null : th.textContent)
        .filter(header => header !== null);

    const rows = visibleRows.map(row => {
        return Array.from(row.querySelectorAll('td')).map((td, index) => {
            if (excludeIndexes.includes(index)) {
                return null; // Exclude specific columns
            } else {
                let text = td.textContent.trim();
                if (text.includes('₱')) {
                    text = text.replace('₱', 'PHP '); // Replace '₱' with 'PHP '
                }
                return text;
            }
        }).filter(cell => cell !== null); // Remove null values
    });

    // Get page width and set margins
    const pageWidth = doc.internal.pageSize.width;
    const margins = { top: 20, left: 10, right: 10 };

    // Calculate available width for table
    const availableWidth = pageWidth - margins.left - margins.right;

    // Adjust column widths dynamically
    const columnWidth = Math.floor(availableWidth / headers.length);

    doc.autoTable({
        head: [headers],
        body: rows,
        startY: 20,
        theme: 'grid',
        styles: {
            fontSize: 8, // Reduced font size for compactness
            cellPadding: 2, // Reduced padding for more compact cells
            valign: 'middle',
            halign: 'left',
            overflow: 'linebreak', // Ensures text wraps within the cell
            cellWidth: 'auto' // Allow auto column width adjustment
        },
        headStyles: {
            fillColor: [44, 62, 80],
            textColor: [255, 255, 255],
            fontSize: 10, // Slightly reduced font size for header
            fontStyle: 'bold',
            overflow: 'linebreak'
        },
        columnStyles: headers.reduce((acc, _, index) => {
            acc[index] = { cellWidth: columnWidth };
            return acc;
        }, {}),
        margin: margins,
        didDrawPage: addHeaderFooter,
        pageBreak: 'auto',
        showHead: 'firstPage'
    });

    // Get the current date to include in the file name
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(currentDate.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    const fileName = `budgetwise-free-installation(${formattedDate}).pdf`;

    // Save the PDF with the generated file name
    doc.save(fileName);
}


// Handle scroll event to fetch more data
function handleScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        fetchData('down'); // Load more data when scrolled to bottom
    }
}

// Set up the scroll event listener
window.addEventListener('scroll', handleScroll);
// Search bar event listener
document.getElementById('searchBtn').addEventListener('click', searchByKeyword);

// Fetch initial data
fetchData();

document.addEventListener('DOMContentLoaded', function () {
    // Show default tab
    showTab('inputTab'); // Set 'inputTab' or whichever tab you want to show by default
});



