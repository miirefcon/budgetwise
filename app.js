// Firebase configuration (replace with your config)
var firebaseConfig = {
    apiKey: "AIzaSyBr3UMkygb2GpEDfRX_lE3mv3c_v7FiU_4",
    authDomain: "budgetwise-4b34f.firebaseapp.com",
    projectId: "budgetwise-4b34f",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

// Enable Firestore persistence (optional)
firebase.firestore().enablePersistence().catch(function(err) {
    if (err.code == 'failed-precondition') {
        console.log("Persistence failed, multiple tabs are open.");
    } else if (err.code == 'unimplemented') {
        console.log("Persistence is not supported by this browser.");
    }
});

let lastVisible = null; // For Firestore pagination

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

    // Save data to Firestore
    db.collection("dataCollection").add(formData).then(() => {
        alert("Data successfully submitted!");
        document.getElementById("dataForm").reset();
    }).catch((error) => {
        console.error("Error adding document: ", error);
        alert("Error saving data: " + error.message);
    });
}

// Fetch data with pagination
function fetchData(limit = 10) {
    var dataTable = document.getElementById('dataTable');
    dataTable.innerHTML = "";  // Clear previous data

    let query = db.collection("dataCollection").orderBy("date", "desc").limit(limit);
    if (lastVisible) {
        query = query.startAfter(lastVisible);  // Fetch next batch
    }

    query.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            var rowData = doc.data();
            var row = document.createElement('tr');
            ['date', 'name', 'contactNumber', 'address', 'brand', 'model', 'serialNumber', 'dateOfPurchase', 'amount', 'remarks'].forEach((field) => {
                var cell = document.createElement('td');
                cell.textContent = rowData[field] || '';  // Handle null or undefined fields
                row.appendChild(cell);
            });

            dataTable.appendChild(row);
        });

        lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];  // Update last visible document for pagination

        if (!querySnapshot.empty) {
            document.getElementById('loadMoreBtn').style.display = 'block';  // Show "Load More" button
        } else {
            document.getElementById('loadMoreBtn').style.display = 'none';  // Hide if no more data
        }
    }).catch((error) => {
        console.error("Error fetching data: ", error);
    });
}

// Load more data on button click
document.getElementById('loadMoreBtn').addEventListener('click', function() {
    fetchData();  // Load more data
});

function exportPDF() {
    const { jsPDF } = window.jspdf;

    // Initialize jsPDF
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

    // Get the table body and ensure rows exist
    const tableBody = document.querySelectorAll('#dataTable tbody tr');
    const visibleRows = Array.from(tableBody).filter(row => row.style.display !== 'none');

    // If no visible rows, return alert
    if (visibleRows.length === 0) {
        alert('No data available to export.');
        return;
    }

    // Get table headers, excluding the Actions column
    const headers = Array.from(document.querySelectorAll('#dataTable thead th'))
        .map((th, index) => index !== 10 ? th.textContent : null)
        .filter(header => header !== null);

    // Get table data for visible rows, excluding the Actions column
    const rows = visibleRows.map(row => {
        return Array.from(row.querySelectorAll('td')).map((td, index) => index !== 10 ? td.textContent : null).filter(cell => cell !== null);
    });

    // Create the table in PDF
    doc.autoTable({
        head: [headers],  // Headers
        body: rows,  // Table rows
        startY: 30,  // Start after the header
        theme: 'grid',  // Use grid theme for borders
        styles: {
            fontSize: 10,
            cellPadding: 3,
            valign: 'middle',
            halign: 'left',
            overflow: 'linebreak',  // Break long text lines
            lineColor: [44, 62, 80],  // Table border color
            lineWidth: 0.2
        },
        headStyles: {
            fillColor: [44, 62, 80],  // Header background color
            textColor: [255, 255, 255],  // White header text
            fontSize: 12,
            fontStyle: 'bold'  // Bold header text
        },
        margin: { top: 30, bottom: 20, left: 10, right: 10 },  // Margins
        tableWidth: 'wrap',  // Wrap content to fit the page
        pageBreak: 'auto'  // Handle page breaks automatically
    });

    // Save the PDF
    doc.save('data.pdf');
}

// Filter data by date range
function filterByDateRange() {
    var startDate = document.getElementById('startDate').value;
    var endDate = document.getElementById('endDate').value;

    if (startDate && endDate) {
        var formattedStartDate = new Date(startDate).toISOString().split('T')[0];
        var formattedEndDate = new Date(endDate).toISOString().split('T')[0];
        fetchDataByDateRange(formattedStartDate, formattedEndDate);
    } else {
        alert('Please select both start and end dates.');
    }
}

function fetchDataByDateRange(startDate, endDate) {
    var dataTable = document.getElementById('dataTable');
    dataTable.innerHTML = "";

    let query = db.collection("dataCollection").where("date", ">=", startDate).where("date", "<=", endDate).orderBy("date", "desc");

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
