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

let lastVisible = null; // For Firestore pagination

// Global collection reference (same for all users)
var dataCollection = db.collection("dataCollection");

// Function to show tabs
function showTab(tab) {
    document.getElementById('inputTab').style.display = (tab === 'inputTab') ? 'block' : 'none';
    document.getElementById('viewTab').style.display = (tab === 'viewTab') ? 'block' : 'none';
    if (tab === 'viewTab') {
        fetchData();  // Fetch data from Firestore when switching to the "View Data" tab
    }
}


// Save data function
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
        amount: document.getElementById("amount").value,
        remarks: document.getElementById("remarks").value
    };

    // Check if required fields are filled
    if (!formData.date || !formData.name || !formData.contactNumber || !formData.address || !formData.brand || !formData.model || !formData.serialNumber || !formData.dateOfPurchase || !formData.amount) {
        alert("Please fill out all required fields.");
        return;
    }

    // Save data to the global collection
    dataCollection.add(formData).then(() => {
        alert("Data successfully submitted!");
        document.getElementById("dataForm").reset();
    }).catch((error) => {
        console.error("Error adding document: ", error);
        alert("Error saving data: " + error.message);
    });
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

    // If there are action headers, check if they are hidden and toggle their visibility
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
    var actionCell = row.insertCell(10);  // Assuming Actions column is at index 10
    actionCell.classList.add('action-cell');  // Ensure the action-cell class is applied
    actionCell.innerHTML = `
        <button onclick="editRow('${docId}')">Edit</button>
        <button onclick="deleteRow('${docId}')">Delete</button>`;
    actionCell.style.display = 'none';  // Initially hide actions
}

// Function to delete a row from Firestore and the table
function deleteRow(docId) {
    if (confirm('Are you sure you want to delete this record?')) {
        db.collection("dataCollection").doc(docId).delete().then(() => {
            alert("Document successfully deleted!");
            fetchData();  // Refresh the table after deletion
        }).catch((error) => {
            console.error("Error removing document: ", error);
        });
    }
}


function fetchData() {
    var dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    if (!dataTable) {
        console.error("Table body not found.");
        return;  // Stop execution if tbody is not found
    }
    dataTable.innerHTML = "";  // Clear previous data

    db.collection("dataCollection").orderBy("date", "desc").get().then((querySnapshot) => {
        if (querySnapshot.empty) {
            console.log("No data found.");
        } else {
            querySnapshot.forEach((doc) => {
                var rowData = doc.data();
                var row = dataTable.insertRow();

                ['date', 'name', 'contactNumber', 'address', 'brand', 'model', 'serialNumber', 'dateOfPurchase', 'amount', 'remarks'].forEach((field, index) => {
                    var cell = row.insertCell(index);
                    cell.textContent = rowData[field] || '';
                });

                // Add action buttons (Edit/Delete)
                var actionCell = row.insertCell(10);  // Assuming Actions column is at index 10
                actionCell.classList.add('action-cell');
                actionCell.innerHTML = `
                    <button onclick="editRow('${doc.id}')">Edit</button>
                    <button onclick="deleteRow('${doc.id}')">Delete</button>`;
                actionCell.style.display = 'none';  // Initially hide actions
            });
        }
    }).catch((error) => {
        console.error("Error fetching data: ", error);
    });
}


// Load more data on button click
document.getElementById('loadMoreBtn').addEventListener('click', function () {
    fetchData();  // Load more data
});

function exportPDF() {
    const { jsPDF } = window.jspdf;

    // Initialize jsPDF with portrait orientation
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

    // Function to add the header and footer
    function addHeaderFooter(data) {
        // Add Header
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text(headerText, data.settings.margin.left, 10);

        // Add Footer (on every page)
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.setFontSize(10);
        doc.text(footerText, data.settings.margin.left, pageHeight - 10);
    }

    // Get the table body rows
    const tableBody = document.querySelectorAll('#dataTable tbody tr');
    const visibleRows = Array.from(tableBody).filter(row => row.style.display !== 'none');

    // Check if there's data to export
    if (visibleRows.length === 0) {
        alert('No data available to export.');
        return;
    }

    // Get table headers (excluding the Actions column)
    const headers = Array.from(document.querySelectorAll('#dataTable thead th'))
        .map((th, index) => index !== 10 ? th.textContent : null)
        .filter(header => header !== null);

    // Get table data for visible rows (excluding the Actions column)
    const rows = visibleRows.map(row => {
        return Array.from(row.querySelectorAll('td')).map((td, index) => index !== 10 ? td.textContent : null).filter(cell => cell !== null);
    });

    // Create the table in PDF
    doc.autoTable({
        head: [headers],  // Table Headers
        body: rows,  // Table Rows
        startY: 20,  // Start after the header
        theme: 'grid',  // Grid theme with borders
        styles: {
            fontSize: 9,  // Smaller font size to fit content
            cellPadding: 2,  // Reduce cell padding to fit content
            valign: 'middle',
            halign: 'center',  // Align text to the center
            overflow: 'linebreak',  // Break long text lines
            lineColor: [44, 62, 80],  // Table border color
            lineWidth: 0.1  // Narrower border for table cells
        },
        headStyles: {
            fillColor: [44, 62, 80],  // Header background color
            textColor: [255, 255, 255],  // White text for header
            fontSize: 11,  // Font size for header
            fontStyle: 'bold'  // Bold text for header
        },
        margin: { top: 20 },  // Start below the header
        didDrawPage: addHeaderFooter,  // Call header/footer function on each page
        pageBreak: 'auto'  // Automatically handle page breaks
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



// Function to filter data between two dates
function filterByDateRange() {
    var startDate = document.getElementById('startDate').value;
    var endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        alert('Please select both start and end dates.');
        return;
    }

    var tbody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = "";  // Clear previous rows, but leave the header intact

    // Fetch data from Firestore based on date range
    db.collection("dataCollection")
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
                var row = tbody.insertRow();
                
                // Insert cells for each field
                ['date', 'name', 'contactNumber', 'address', 'brand', 'model', 'serialNumber', 'dateOfPurchase', 'amount', 'remarks'].forEach((field, index) => {
                    var cell = row.insertCell(index);
                    cell.textContent = rowData[field] || '';
                });

                // Add action buttons (Edit/Delete)
                var actionCell = row.insertCell(10);  // Assuming Actions column is at index 10
                actionCell.classList.add('action-cell');
                actionCell.innerHTML = `
                    <button onclick="editRow('${doc.id}')">Edit</button>
                    <button onclick="deleteRow('${doc.id}')">Delete</button>`;
                actionCell.style.display = 'none';  // Initially hide actions
            });
        }
    }).catch((error) => {
        console.error("Error filtering data: ", error);
    });
}


// Fetch data by date range
function fetchDataByDateRange(startDate, endDate) {
    var dataTable = document.getElementById('dataTable');
    dataTable.innerHTML = "";

    let query = dataCollection.where("date", ">=", startDate).where("date", "<=", endDate).orderBy("date", "desc");

    query.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            var rowData = doc.data();
            var row = document.createElement('tr');
            ['date', 'name', 'contactNumber', 'address', 'brand', 'model', 'serialNumber', 'dateOfPurchase', 'amount', 'remarks'].forEach((field) => {
                var cell = document.createElement('td');
                cell.textContent = rowData[field] || '';
                row.appendChild(cell);
            });

            dataTable.appendChild(row);
        });
    }).catch((error) => {
        console.error("Error fetching data: ", error);
    });
}
