import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, remove } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
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
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database(app);

// Global variable to toggle the visibility of actions
let showActions = false;

// Function to handle tab switching
function openTab(tabName) {
    const tabcontents = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontents.length; i++) {
        tabcontents[i].style.display = "none";
    }
    document.getElementById(tabName).style.display = "block";

    if (tabName === 'view') {
        loadData();
    }
}

// Function to save data from the form
function saveData() {
    const isConfirmed = window.confirm('Save changes?');

    if (isConfirmed) {
        const editIndex = document.getElementById('editIndex').value || Date.now().toString();
        const data = {
            date: document.getElementById('date').value,
            name: document.getElementById('name').value,
            contact: document.getElementById('contact').value,
            address: document.getElementById('address').value,
            brand: document.getElementById('brand').value,
            model: document.getElementById('model').value,
            serial: document.getElementById('serial').value,
            purchaseDate: document.getElementById('purchaseDate').value,
            amount: parseFloat(document.getElementById('amount').value).toFixed(2),
            remarks: document.getElementById('remarks').value
        };

        // Get a reference to the database
        const dataRef = firebase.database().ref('entries/' + editIndex);

        // Save data to Firebase
        dataRef.set(data).then(() => {
            document.getElementById('dataForm').reset();
            openTab('view');
            loadData();
        }).catch((error) => {
            console.error('Error saving data:', error);
        });
    } else {
        console.log('Save changes cancelled.');
    }
}

// Function to load data from Firebase and populate the table
function loadData() {
    const dataTableBody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    dataTableBody.innerHTML = '';

    const dataRef = firebase.database().ref('entries');

    dataRef.once('value').then((snapshot) => {
        if (snapshot.exists()) {
            const allData = snapshot.val();
            Object.keys(allData).forEach((key) => {
                const item = allData[key];
                const row = dataTableBody.insertRow();
                Object.values(item).forEach((value, idx) => {
                    const cell = row.insertCell();
                    cell.textContent = idx === 8 ? `₱${parseFloat(value).toFixed(2)}` : value;
                });

                if (showActions) {
                    const actionCell = row.insertCell();
                    const editButton = document.createElement('button');
                    editButton.textContent = 'Edit';
                    editButton.onclick = () => editData(key);
                    actionCell.appendChild(editButton);
                    
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.onclick = () => deleteData(key);
                    actionCell.appendChild(deleteButton);
                }
            });
        }
    }).catch((error) => {
        console.error('Error loading data:', error);
    });
}

// Function to toggle the visibility of action buttons
function toggleActions() {
    showActions = !showActions;
    document.getElementById('toggleActions').textContent = showActions ? 'Hide Actions' : 'Show Actions';
    loadData();
}

// Function to filter data based on the newly saved entry
function filterBySimilarData(data) {
    const rows = document.querySelectorAll('#dataTable tbody tr');

    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        const nameMatch = cells[1].textContent.toLowerCase() === data.name.toLowerCase();
        const brandMatch = cells[4].textContent.toLowerCase() === data.brand.toLowerCase();
        const remarksMatch = cells[9].textContent.toLowerCase() === data.remarks.toLowerCase();
        
        // Display rows where any of the data fields match
        row.style.display = nameMatch || brandMatch || remarksMatch ? '' : 'none';
    });
}

// Function to filter rows based on cell data when a column is clicked
function filterByCellData(value, columnIndex) {
    const filterValue = value.toLowerCase();
    const rows = document.querySelectorAll('#dataTable tbody tr');

    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        const cellValue = cells[columnIndex].textContent.toLowerCase();
        row.style.display = cellValue === filterValue ? '' : 'none';
    });
}

// Function to populate the form with data for editing
function editData(key) {
    const dataRef = ref(database, 'entries/' + key);

    get(dataRef).then((snapshot) => {
        if (snapshot.exists()) {
            const item = snapshot.val();

            document.getElementById('date').value = item.date;
            document.getElementById('name').value = item.name;
            document.getElementById('contact').value = item.contact;
            document.getElementById('address').value = item.address;
            document.getElementById('brand').value = item.brand;
            document.getElementById('model').value = item.model;
            document.getElementById('serial').value = item.serial;
            document.getElementById('purchaseDate').value = item.purchaseDate;
            document.getElementById('amount').value = item.amount;
            document.getElementById('remarks').value = item.remarks;
            document.getElementById('editIndex').value = key;

            openTab('input');
        } else {
            console.log('No data available');
        }
    }).catch((error) => {
        console.error('Error fetching data:', error);
    });
}

// Function to delete a data entry
function deleteData(key) {
    if (confirm('Are you sure you want to delete this entry?')) {
        const dataRef = ref(database, 'entries/' + key);

        remove(dataRef).then(() => {
            loadData();
        }).catch((error) => {
            console.error('Error deleting data:', error);
        });
    }
}

// Function to filter table rows based on search input
function filterData() {
    const filter = document.getElementById('search').value.toLowerCase();
    const rows = document.querySelectorAll('#dataTable tbody tr');

    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        let match = false;
        for (let i = 0; i < cells.length - (showActions ? 0 : 1); i++) { // Exclude Actions column if not visible
            if (cells[i].textContent.toLowerCase().includes(filter)) {
                match = true;
                break;
            }
        }
        row.style.display = match ? '' : 'none';
    });
}

// Function to sort table rows based on selected criteria
function sortTable() {
    const table = document.getElementById('dataTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    const sortBy = document.getElementById('sortBy').value;
    
    if (!sortBy) return;

    rows.sort((a, b) => {
        const getText = (row, index) => row.querySelectorAll('td')[index].textContent.trim();
        
        let index;
        if (sortBy === 'date') {
            index = 0; 
        } else if (sortBy === 'purchaseDate') {
            index = 7; 
        }

        const dateA = new Date(getText(a, index));
        const dateB = new Date(getText(b, index));

        return dateA - dateB;
    });

    rows.forEach(row => tbody.appendChild(row));
}

// Function to export the table data to PDF
async function exportToPDF() {
    const { jsPDF } = window.jspdf;

    if (typeof jsPDF === 'undefined') {
        console.error('jsPDF is not loaded.');
        return;
    }
    
    const doc = new jsPDF({
        orientation: 'p', // Portrait orientation
        unit: 'mm', // Unit of measurement
        format: 'a4' // A4 paper size
    });

    if (typeof doc.autoTable === 'undefined') {
        console.error('autoTable is not a function.');
        return;
    }

    // Collect only the visible rows and exclude the Actions column
    const visibleRows = Array.from(document.querySelectorAll('#dataTable tbody tr')).filter(row => row.style.display !== 'none');
    
    // Get headers, excluding the Actions column
    const headers = Array.from(document.querySelectorAll('#dataTable thead th')).map((th, index) => {
        return index !== 10 ? th.textContent : null; // Exclude Actions column (index 10)
    }).filter(header => header !== null);

    // Collect rows, excluding the Actions column
    const rows = visibleRows.map(row => {
        return Array.from(row.querySelectorAll('td')).map((td, index) => {
            if (index !== 10) { // Exclude Actions column (index 10)
                if (index === 8) { // Adjust for amount column (index 8)
                    return td.textContent.replace('₱', 'Php ').trim(); // Remove '₱' for PDF
                }
                return td.textContent;
            }
            return null;
        }).filter(cell => cell !== null);
    });

        const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARUAAAB4CAYAAADc82bSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAIs8SURBVHhe7f1nvBVVtrYP8z7nOec8p/v06dx9Oge77bbVNqe2zVkElJxBQMmC5JyVIAKSc0ZAlCiCWUExYEByRskZA7CBtfYe//ses2bVrKq59t4EtT+8H65f1aq0aq295rXHmKlKLDgs8jxYeMhHgfLCQQFYHspPsQgsPlwQcUTkRQ8v4T0sL4NXcP2XcfxLR/KxLVgmeOXzAuXVIz7yQVZeA697eOPz/LMgAxLXwPu9CZZgfckXWVmK/XEKDF/kY5kvb8XIKm9j/e0vCgpBZNnnIu8oBSA/oEDew3XfB+/hOu8CrpPlXxYo732FbWD5lxEffJkvH+C6H+C4D/E6yUdf5Ssf47hcrPiqwMtKvOeqoyIrj+XLyqP5WM+X1UcLZPWxAlkD1mLdIH54zHHDOof1uN4G7NukSMhGXCuCx2SVjWATOZ4fsrkItuQV5Oa4RITbs7IV97YV5249znUu+drst+uWT/UYA8+18PU2wP1JPsvLP2M+BdtO+PdZ7DEWvnb3b8dnco9197lwX1H7S8yHMBaA50MKArIgo/iFEwBBvOBhsQuOe1EpAPkBXPeRlRcPG3yiefkwZAP8oimQ1yEo4ttneQ3Y417HNY2ITmFfNiehvFCgKR0KJskSEMolRiSW3PiFswznG8HEeRcCUlDwiZVMUjaEYvmwWFj5ZMCpACMfn1jIJ2AlJLHqK6ByyYKMQsGshhCSpCUDuUAMa49lwCnIJaNy2YiCnQuKJ4mVDiW02UcglbPBCALLQCiuiFyx2H2bTkTr7v4k2/KkUHznWMltw/24wigW9trBa58gXCiL2PkO3O++LkIqBq9MLIFEkiwi2M8lxXJaUgkIZQKJWKxUXskhjtewnfj2Wbg/LZUM9vmFQtyIKJdUyBIUeJfTk0oaSsUnlphUcNy3JRWiYsF9rMJxkViyEMjpSsWIJZIKJOGIJCItFJUKUanEoxwDtyGSKYqEROJkQcYscWy4HdemtNwCT4lsplSCJSXk7k/iCsSH75xiS4X7U9j3xDqOSUokSVoqOD9Y5353X4l5BwrEisVQkMInk+cDfPtcrGRM1BKlSUYgVjZWOHHixxpeAi/jnl6GmIxcTp9XcU0rn9cgAgqDRBLxiMg5zhVMCK5F4pKxcjEpk8vSJF7REAgJ10mKJZRKANMjmyKlpBKIJS4XCCQkKRWXIEVCYXUpXCqGM5OKgVJZj/Nz4ZOKJUqTEuC6RUGxxEVSDPCeJhpCBBPA7ZvARuc4vxjOhmJIBft4TBpzP8WRSkooVnbuNgeVyjzIhGIxUDIkP1y3AnFZgAJEnkch98nEEkYuWF+E4w35Bm4LwXbi7M8lFRULpMKo5WUUXjc9cuE+PSYgJpZQGKZuxuVlbCevOETHcUnBxIlHPnFMvQwjHMObCZYopr4mXR9ToFJ5G0sTuRjegQTIuyFZ5T0FYoFISEouKPwG1rkE4HwlsS8mFYiDfITCSZJy+QTHrcRxtn5FBYPCthJwaTGiMcSkgnPWojBaqazDulvXksQnkyQaucRAIS8CisBHKBAfuLabXrlSiZ+L43KQFkaUNuVOnSgGFGQW+tMF5ytchwgoDotXJhrZWBJSie0rCKQC5kIecfJ1O4mimEA8kMB8FGyyAFAsuUiLhttsRS8rfyGdGFElsE8qoVwgBp9ICsMViysbBemPJde5xAgmjZWKG83kIhnlvHEYcsF72PQpWSdDqRjBRBGMSY9s5ALRQCbkHex7h4JBIQ8jF6xHggkqcr/KROvYb7DHGLHEpBIsyQcQQBi1YHtYqYtzV2D/J19lFQpGK3ITaBSDc9ekopZIKmtRWHwysRQasSBFIv7U6cwI62UKoTAJufuScL+bHlmRaNoUEJdJ8THiCCTgw4rB4VPiSgXvX+i5ie0l5lIoYA5EEic/FEwYxRwwy3nYNg+F3kQzuVkA0mLhaxd3X3z/CyikRKMXvJ/LYhTwxSiEabIxXnR4CYX3ZSUtjZe4P8S336DRDwp5Si64x1dx3WTU4yMpFkqFrUuMaN6EJFxUMrg+IxibJhErFa1z0XUjFRULQSG3YnmPS0QTuaViiaRixMJ0qHCp6Dbsi6RixKJyKUQqq3DuahTEuFiCiAWsQUHzsQ7nKygsuaSynvvAhjPAJxTik0gSpjobkFpoa5QP7OcxLlYqFkYedn0TCrVZPzu5JAt9nEAMhZFLKro9va/E3P2Qh1cqEfMgkwgbyWQhl8KZj8LPSt+0OE4XXiNfFqLQPg+4fAHYdMpGNItROC0voLASdxvRViXiiOJMcFMpF59EkviiFZULxJEkimACqYTwNWSC7aapmqIxLIMgKBUrFpULMBFLUiQuVioRuaTyEVMhxScVwyeQxOlJJWINjluNgpjERDJFS4X7ffuKwicU4pNIEreZO11Xw0peI5HCpJKrPuZsI5ZcnJ1U/JSYcyBfZhMU/iRzKBuViCiUSpQexdHoBcfGwDZNmyCGNEGKdFjSYD9xpfI8pEGhGCAZLI1cGM0YybwAWYSgIBKNaBy05YlLD24rk7Y04dgk8WNM1PMyhPAK1hUKpwg0ovGgTd0e3gBvUjAgqntxUySkRpAJeTuIYpahkL+DJWHrUBi14Jj3IJD3vswgNcoGkrGRiRGJWx/DbR+Cj4Il4Ta+DqVixYKlrXuhYFiBS7EkWYntK7FcDXlE8DXTogCViql7cWEfGO0HA9YRnBdC2QSoeJK4x+rx9hzW4Rh8oiHp+pk0G3CtXJj6GhynBFLJg3DAJkY3ViA4zkolKRyy5XShiBTxEkUbhZEWR2GUoFCeI0hVkqhsgI1Ypm/9Sp58fZ20HveyNB0yX5oMnhfSFDziZX4anPvIEOxzaDZ0vjQf/rx0mPK69H1hhUxaeyAW5bCTnq0cNh32ArE4UYzLCyiIJIpiDKyPSW5LEtbbeLD7DDbiyUAoBkZC09ftkwGLPpKuU16V1sPnS6th86Tl0HnSCp+zMFrjmDYE6ymwvS2u0w7L9rhm9wkvy7gl62XxjqOyBJ/TbUGynezCFiOVS5AWARO9UCqmzsVGJays5fIdfI75a3fL0HnvSPeRz0s3vF9XvHeM4YZuIzxwO+iO9cLoOWK+wzzpNXKe9B2/UCa/8qEs/exQGM0kyRXdxOpkUjCtSh5vW51M/xhiO999HUSRTyAWlUpGoVgojTWH8+Slj7fIqFlvSL/R86UPvpOzoe+owumHY5RR82Xo1JdlwTvrZOXer0wUo5GMXxyFAakIpFLglYpl4vpDUqXtaPnvH94qJUpc+Y3wPbxX+WZDZMS7WzWqSUkFoon3rWGqFQDJ2KgmimIArhO2MuGYNGafW1lsic4z5y7G+yw+ZCTCiOXFg6dk9NsbpVyjJ+X//sd13s/0dfDDn94hD3UaK/O3HDKRDCSn9S6QBSt3KZhliKRctJcuoxYs34dIrFjex+cYvuB9uermht73+qYpW6unLPhoq7YkmUgmIi0IcqZSiYik4u9gVygqi3ja5MeVimHVoeMqkfP+UsH7XXyT/ABl79HOY+TD7Ye80iiKEs8VIZUJGw7KvQ/18775N8Ev/1hW2k54RWbvORm2OBlMpTHTq6jDniUf4jFSiUUwOC9WR5PCREVRmuVizo0kQzKIbLKyYE+etB+7SH7x+zLez/BNUKnJQJm/9XBQ/xLUuwSRi4leIpYxigGMYt4LpPIuoq0hc5bJ7/5cznv9b4sb7npE5n+0JaiHMVAqjFbS4D89xOCH++LH+6SyDsdpCxP26/I0KH6Lk5MCgVWITroOnCn//g3+MyoODzbuLx/tPII0KaoodvEJhZSYuT9fnkGK88yBbIppO45JrR5TvG/4TfJf/30j0qMFEMupqBIY8ghbpSyQhZXKfKQmBq4btB6H+7EeScbFplpGSlFkZCMlIxwKyMgFQtl7QpoNeu4bjU5y0bTv0/LS3jxTwQtRJMcoRc3RwRAAxaRG05ZtkMuuf8h73W+bcrV7ypJPD8bEwtQojbvfR/z4qA4nq8s1iIhMC5SNhIJ1RjnFoMhOeR65rPsqKyOfXSK/+HVJ72f/tunQZ4qsRhSVrNshUWWvRyozIJAZKKgzgRXKzP0Z6fvKavn9hVW8b/ZNc8HVdeWpNzeGUpkHCcyDAGzEkpZKBlAqbnRjiEvDyCKO3Z/ep1IJeB7XH/zGWjn/8pree/6mOf/S6jJ26TpIpQBSIVkl7MFr5YJUhxi55Mure49K3XYjvdf8V+D7CMefnPKSfPIFxxQZQfhalU6L4DoGSAVCoVTWUDaIUiL4Ot4ClYSRkBvl+IRCfFJ5a8s+ubdcO+/n/lfgb5dUkzlvr8G9RpHVpkAqNmJJyiWQCkBhnIk06JmA6Xsy0nDwPO8bXX5HM7mlareA7sqtZ8FtATeW7yS/+lPu8PuOmr20fsdt7taWJ9xvuuUpatpOov1oPLI5PbIyad1eua1KV++9kt+cX15uqdBJ7sBnI3eSakm6ebYZ7iqEq25vmno/hs/tRy2UVyDU1yCL1xGxuM3SlrDVSGWTL7PX7JZ/3NUsdb0/XFBR7qncWUpV714I3QLS+0rX8FMG+xSuJ7jjgbbyo5/ekbqXWs0HybK9X8kKdqyDBLyiOB1iUonQlqiUVLC9EMFYqRQGhZOUC9dnvLpC/nB++jd/xXV1pVyNblKuZvczpnwxcI+/Galm8j74m+o7ej4iqkxKKhY7NMFW7paYoVLBh0tIZdrOE1Kl47jYGzDEb/jUHJm++4RGMy6zcvAsCnAunsN7zkYBdSXx3L6sDFm2VQXjvjfRNGj48/Ls3kwkFQrEh0cmEWcvldlIex4ZPMeb9txWpZuMfH8b5JVBdGPqZBjZsLLYtDC546DYfyZodUKBd0n2jXF5Yf9JaTZgVuq96/eYLC/uyytUKtFgR0Yu+TJp2Ua5IBFtXX93c3lu9Y6oV26AbSky8LVtkna3Gz74SpQPEQGETc+AfVoURAUpsH38ix/Jb897IHY/91XpLK9vOxhIxSOJ0yUhk6KlwqVdj8P6Gl86FOGXynq837AZr2sk5n7Wes0GyYq9x7TwuhHC6cLzi8I9dv0XJ6X38DmxeyGte06Q1UfyYsf6pGIpMX2/SAgK43RELWTSjuNStuWI2MV/8PO7pe30pbp/Jgq0FdCZMksriQMoFBVNRmYfyMjgtzfJpbc0jr0/+fuNDSGdLWFzdxLtzAdcUZ0uPkkxItJ9gVSGvr1ZLrr+4dT9XXVncxm1fLuTMkXp1kLKIGjqLgpKhgMn083YJAsy2mTNVjL3/R/sMEYW7j4u7pim+Ngk28nOjLRma9FYpHB//Fvl2HXuRQT1wrYj2ixtxhZx4KLp78LmaAt76r4PYjLBMfFBiQlwPeKKxuWZ9zbKxVfXjt0PI5hXNh+Ida47l3yC911ZyNACA6WSlE4afwuTSY20ty9SBLIG7zVg8ovy3e/dGPusbR6bFCvEBjdtKgwcm0eiyMJAmRHuSzdls/PeRnwHo2ctkR//9M7Y/TTpMFJWHzwR6+iXgtdQMgmp7IdUUCDJpO2FS4XRDSMbTZ8KwScTC6XybIiNYLKQQwYRy0npPPMt+elv7ovdA6nSboxM/+xoSihkDj6DEkjgTChUKuCZ7UelYothqftiS1WvOe8hQskGMrEEUgE+gdjhCAuxbtGewhAI5RKuu1KBfH1Sqe2TCt43lAoiIzPIMZq+YUyhUgkGMCpm0GJKKo5QzplUrvp2pMIoyE/QYS+MWHLDepkYoVQCsZy2VHz1MbmgNEhxpRLIAGI4Z1KZtg+pjocJn+XJAy3SUmnz9BJ5en82jGiKQsUDfFIhsyAABccmU6cpn34l5TyFl/UuPeYul+dwH2mxSEBye/GxvYSTUCqzcV/dZr8jP/c0H1dtO1qe2XEslSpZ3P4zMQ6J4kY3yWNs65QddLkI4uoy+ZWUVGq2Hy0Ldh/TFEkHQIJXcXzI4YwOE3CHCox+3SOVqt1k4ZYj2tdFW4xw3LIjmWhsUYAdApCUSjgCOqD4UsHv4t3NXqm8vHl/eFyYQp0BPqmsQAFfcTRrgFzSUDzFaWHykdEWpmTEkksqrR+bKKs+z5MNkMPpD4x0RWKx+wKpOFAqBpENuJ9RzxZfKjpPDc6LSwXpz9R9+TIVhTrJ+O15cr8nUmnz9NLTkgrramx9jUtaMOmm7VmIXAYs3Sh/+0c6zbilSjcZt+6giXBimMgn2d/GC473ScWNWpKMW7NPbqyYru9hWjb0na2mElhBVAMRuMxHASc2comwEU06ZbJE/WSCvjKQSucpfqnMt1IJxGIx45MYvZgoxspl1BtrvFJ5HlKxAxlNc3RGYmOMAqkwLYqmXDBE44nMwMQYEIp2/4ccFGyLwG+hGFIpjlySx0bYIQYOKFAfqVAoHR9GKpoGhbIoLlnTbI1zTf0LUyIICt/Pk5MWp6TSClJZCamsh1TW5xkBRZGGD1cqfB0XR3yfbz/B++AeRz77JqQSryinVFYdOqECUYkE2Oua7QXACKrEZEhlCtKUYktlGqSCc3wC8WGl4mKlkhSNgsLi8vSeE9oKlawQZaVt46HPayvVLJyXJFkpnIukZArjmd0npdGg2d57aT5ioVYgc6Alp42wkY3LXIhlLuSQlI0KB0RSScvFSkXB64VIgTrlksqeY/IiZJCs7A3lgvTqVUjCMuKNVZBKpdh17oFUFmw5bMYaQRi2eVqboVEYrFTMwEX20nUiF5UM5ZJOjeJY8UTbKJtn3tlUpFSskOKyiBNKq5jwHB23lAMduwQpELeuxS+SJEyN4nUvnIOm/8S0VFpCKiuOnNCIxlLYVA+RNFxcYST3RWLRaChg3bEMpPKGXyqHIRWkbGRzQPq6BFKZtC8rkyCVyQnGbj/ulUprSGUapPI0jjEUyNMoxElM/QzWUcDIdBcUUG3GzgWOcRmFiOTGSl1i90IuRnQwcNlWFVQKnFcUjGw07cI6sdFOTDQOAxE1XeiJmm6r1l0mbbBN3Yx0AO6Brzkw01RC4zXEoWJBpOEjOeAyFrHgdTRPjZk/uKNHKjU0UjkeTANhMIMlg9HZwEzfACAMDoYc8fpK+UNCKndDKvMhFa3UhSAMpglaI5cAjohWsK4pkUrGwPqWaMoFH2mpkJnvpqVyO6Ty0qZ9Jn0CHyAlIbG0KoE9Jg4iJRRyLikSXQcf4j7dyMUnFUYsH0MiK4Bb36KRC/ZpJa8HOyOenbCqOFL5+EheMNUDpEIoFkcuLv7CbaMS3/5oH2ViIiJGUBkZUQypWNLXJQVSYiL+u1qxuIyBVMp4pNIKUpkCqUyjMPYBLKch3UhiK3+noZAmeRokIxqXZGTDbZ3nLpf//WO8mZFUbDtapnx2LC0VJ43KBettfNuiVCpi6qdHpdyj6fqdX59fXno9/6FKh83jyVRKo5xASjryW6F4sjF0UqywE5/pyJcb9rXJSIfJ6YraGu3HyLxdkAqEFDZVQyQusegFDH9tlUcqXWXelkNBpa4lk5oKM5YOoSC7UnkXBfFMpDKjCKmwjsaemxSJS3R9B4oFBdxGJzGpfCmBVOJpVAykCMStb9EJqYKlu93dpzCqgQSKI5WPDkMqOF5bkHCOG7UkOZsJqc69VERKTNiblQl782UiROEy+jNIxVNRq1LB8RQLYapEwSSZioKtoBBNI1i32EgmGd1EiDLdYSLup0K7sbH7Ib/8UznpOm+5Rjhs5p6JYxUU0pzwWIjTRc8/kFGSopm575R0mvWO/Px3nsrZTuNl6o6vkEplIQ4QiCQpFFcss3WZJlkxrGlUIpphHxvta4P77OCpqK2OSGXOrmPRIEpgpuaMeBHpj8GIZfjrq72RylxEKuH0C4FYzBQMkVRSUy44vAtBvOch6vNiYD0Ll7Y+Zsa76dYfSuXFTXtxLCeXiiaYSlYIu8RkEmyz2PobplsubirE6Rxi2O3ATPMQJ10Pg0gmhJW8fOIAhMJUiKnUFxl5YuIij1QmQSonIB62HHGcEpemHsZg+r5YNILJgU4+hXNywv15Bk79kLNOxSOVXJQYD6mMhyQmQBAuo1CIS3uk0nLqUpm8BykSjmFE46uPIVMgBzIV/3mJG8WoMBDFcOluTxI1dRueXPapXHxTo9g9kZuqdNMUSSMbnKdwPRcUiCMUohESCiqxcrGMXL1X/lm+Y+p9L721iTz13jakUqcQ4ZxCRJMBjHQgl/1mGSctGRemTDbCMelTOqIJO/Dhvdr7pNJulMyGVOxQAuLO96uRi30eEwRBsQx7fQ2kEq+ovQtSmbPlSPjkgTcSEYsbrdhxRcnnGpk5dOMTdJN4RzpKxRR6PreI5JLK4s17EGmcMgTnFIf3UXhf3X5EJr66Qto9OVNqNhsk197aOPUelv/Bd3rVjfXlutsaa0/elr2nysgF78qi9Xj/I6dicnHxp0yGT/gIEwuEwnToky9OSb+JL3ikMhlSORlGNJb4IMhougbbVO1DxeKTSYAbYbAzHsch+Vp/zkAqRizj9xaEjPw0T0o9mpZKC0hlIqQyCcdM2itInQSCKUgDsZApKOARgWiwPR7ZQCKpbYhYcB2XKbsy0mj4Qq0Yde+LrxsOXSBTd590opt0WmU690E4uLaVCfvSsF+OSckyCsc9WZ7elSf1B6YrZzkNRLPRi2T6npNGPsHxz4BZAVw3IOKBhGdhafcRKxvbAdAKJZJKBCMZisfsg2BwfjuPVKq1GyPP7Tyu458sySkfXMEwchn2WjpSoVRmbz4cTiBlOs5hecQ0Q4eTRmGbRXvoQhZ20m53NLQLH4hGVCwBXNdpL8HTkMpFPqkgUjFRSnJ+3bhEyLsolJPeWCV12ww7pyOvv4vf2i33tZTHxi3SimOmWVYqOkEVCn0SI5VgcqoA1rMwUunnS396IVI5hEgF54YEUjFRizv6Ogt5fP1SWYn7cY8lPqGQEmMhFMs4CmWPYeQ2v1SaT1uiEpqAYydCKhMhlYmQgoWSiYHCQqZgn5VKkqnYl4x00uIxjEBEcnO1HrH7Ihfd2FCeeHtLmDpREmmYdjHq4dLIxAqH+61UXPot2SB/vbZe6v3uqP24jN1wMCag3HCAJiXGZbTdplfP4n6exb3FIxeIBBKw2B7HRjoZmb3/lLSdlJZKVUjlWUiFdS98vAoHWLojsHWENdIZYsUyxCOVOwOpRNNkci5e05mORFELgFBM9/9E5AJRMGKxcokkg0IfSMUS9dbF3yKHVBZt3hdGM0YeJm1yZfLKp4ekdf/p8qcL45/n6+KGu5trFKMRDAr/RyiouaQSAaGgAK+AHH1SaQGpfHgoT6MZYqVi4Hp87FFhUikKVxLnTCpjEHWMhSCSjECkcp8n/Wk+ZamM242oJpAPo5oJiCKSTMR2JZCNga8R4aCAxSMbRjtBxIN9bn1NEm7vPP8j+dX56clsyrUdI+ORtpn0yVYMx1Mqk3JhOwo4+9twSaY665bxW7+U+x8dmnqf31xQSXosWiHT9kE8KiZXIJZ4ehWXipVMEhPZaPQSE4wHHNMWkUpy4ixKZdbOE7GKXdsHxkiFvXcl1qN38Our5fceqTy35XDYUhSb5JvRCiQQEgqGI6NNE7SNWoiVi8VM1I1oBkIw9TCm5YhLMu2dtFRug1QWIlLxdbYjS/YelUeRpjB1cc/7pqBcpi5dqxXBbkqkEQzudwWBUKJ0CMJBGtnXU6eSlIqf6EmQtlNdLnwysbhRi07DMMtfp+KTSi5KjELaMxqFfwwK9BgsC5PK9yGVR5D+UEQ2quFyHAqEZTwKvVs3E5eKFUt8ezy6iaTii2rIuB15UrHThNi9kV/8qZx0mLtcj5mKgmcwdToxIBVKpDCm7D0l7WYtk5/5Kme7TZaJO44jJcvGpDIDRFFOFAVFsNMg9/k7D0ZCShOlUgH7TknriS+npFK57WiZsf04ohkz3IEkJykPW5CUjAx6bWVKKndU6SrPbDwoiw9mFB0aELYgnYJozONMOIWm9tJVmBplELmcQuTCYQAZjV7eUoGY6RbSUCym9UhbkAqRyvObjVRULCiUHHPEKGfcyyvkb/8C0098h/2VHp8s7+w/npKKaTmKRzAfIv3pQ6kk0vnTlYoZBpALiCWvIIVPLudUKpbRkMSY3aIM33pC7kukP5RK0ylLZPTurIrFYEXEiCdKpSwTkCKFBKJJw32McMzribgWsc3bPp547zP5+63p4f83VO4qQ9ceTInID+Th4Epl6Kq9cr2ncvbyux+VgR9sjx1LKBhGPsntPhgFqZA8YonEY9CKY0iELVax5nJsaz351bRU2o2V6TvzkDIhTVLYL0YU21Sd7GD31GtrIJV4Re0diFSe2XwE6ZF5CoHbDE3sw/Ojh+jny2uIVtzR0fYJABSHXyjAiWAsU97ZlJLKrfe3lfkb92nqpJ3svhB5G6LrMmLBtxad5KJqo/7y9r6jKam4omHT9Yf4HH0mIP1JSOXRXhPl/YN5iGiCZmmvVCLY3d8vFHL2UmncfqR8gvtxoxriEwpJS2UPpAKGbyumVILIpnhSicThpkqRVMz+UCpYz8WEPRlpPOZF+Z+fxL+A/4c/0END5suE3adkMgpg4filMmnXCannqZzV9G/iKzJ5z6mYJAiFclpSAcWVCiOgpFRmIlJphXtJS2WMPL3zOFKkoIkb0ZrtH6P9YDRKsWlR4VKZCaksCqSSq4/Ly0mpAFcqpp6luFIx6dAUT6QSSgUFkbyNCKtJj0kaHbjH/atQ8aE+Riw2SjkbqeB4n0wsRiq5WQNpJFkLvjapjEBhHwlGQSQuQyGVko/GZwOjVJpMWSojdxdAQCaiGYNzR0MGFps+FY6pxxkHmZDxlIpXPIVRIEM3HJFba/eO3SO54J8N5PG3tqTSrAhuh5xy8NiSjfIXX+XsQ0/IiI2fQ0Dpup4IKw/fvjip+h5GOzmYgWvG6l+wzSeVSu1Gy9M7jsWGIkSd7gwmcrFzyuTLgNdWpdKf2yGVGZsPm3FGwDyKNqrcfQlCUigWW5mrFbp81IgdrGjkYmahSxN7zIiKB1L5EoLPKZUDKh9WAncdu/CshHLpPx6SPlNfl8VbDutk4Eyp3kZaN3f1Lmnee+o5aTHqOXqhfIDPrwMoIdC4VPKxLyO9PVJp3nOSvHcgL5QR62NW4nwDRKKSidIfn2gs8UreNGsggbWAc/Jy5rvhnlHKjSCVjw+e0GPIelDYxOAlhiM6GQFJUBQuQ7bmQSrpSCUmFTA6IRVGLi5poZC0VMbjOgquYYmiF79o2ArV6YWV8usL4v9lyf1tRsmoT49CHqZy2GUCCiVRseA6LqO2fCWlmqcrZ39/SXXp9tJqHJM1TeXAyIH1My6uVJL7IqGQuFTYumWiGBcrlelYd6eUmL43Iy19Umk7WqZtPxY0XxvYCU+bomNyMYMejVRWy++SUqnSTaZvOmxaixysVOzcLhq1QCahWPBaBysiqlGpAH3aoiMTi50syqRJAAWGHemKksrQhcvlfz1TYhSXeu1Gyet7jiGFsnPFENMCpc3aiCLmrdkl19+dng3vdDj/oioy+4NtX6NULHGRuHwrUhm2Gxciu+I8teW43Ns8Hak0hlRUQhAKiUU4EIWbTpG0UIqPyibEVAInGbX9pFTqPjV2n+Tnf3xA2sx+X8ZBPL7zfJXKE3ZnpNWMZfJTT+Vs9cemy9jteZBKAQgqlXGN3JhWriSTUbiTcikMbUrHeyZlM3XvKXnUI5WKbUfJ5O1HNWWy0Q37yXD4gZWLxc4VM+CVtZBKXMycvW7apiPBWCNnygUIhahUVDDp9MgKhh3ntPPcEdGUyGJaikwzdAiiD7YakUmQyoU5pLJwyyG5qVSr2L7ToXTtnvLq7mPmcbEe9OFrKLhkxvItcuGVtbzXKS712o6Q949khL2Giy2VXpPkXaQbPMZKJerrAsEgTXHxycTydUnFUKB4pRKnQBmESOUej1QaQSoqIkQ4ZCSIxMJ1FHQHtiwVRa7oxkYyBr6GDBSuW0T6frBLLr2rRexeyT8qdZWBaw7EWqdckqIZuHKfXFcuPa3BFSVbS/+PdgXyYaRjwWsl66xbkvsjVC6FwF7KFo1w8L4m+smETNl7Uut3klKpAKlMglSm4xgT3QQc4Ghut3cvW4cKlP6v+qUyFZHKfEiBGLkgWsG67fpvyISoXCCIMHLBOkdEv/a5AC5JJJeYZFCYTXM05OuRyi2QyryN+6XtkPR0h8WF0c3YN1YH9Td+9MmOFgiu/eDnvNcqLlfc8LC8sIGd9uzQgIjlkM3jxZCKGQIQNUebIQDR+CKfTCIoldxQKmQdlzh+uKefSqMOkMohjpo2x1m52PoYd3AjKTEEBZ8MJSoUUQZtPSH3eOpUGk5eIkN3ZVUsKheQTp+ykI0hGbkUB7cSOAYK9BgUsOT2UbifRuNf0/tz75eVtnWHzJfRu056peLCY2oPSFfO/uhXJaXZ1Ddl3J5MSkIhKLTe7RYUcJdxCSbsI+lBnSofnG/IxJi056Q0m/CKfPcHcamUR/ozAemPG9U8vf+U4lYAE21FOpiVvq+tkd8mpHJrla4yedMhrXvhdA06ahrpkk4oBWGYdCgrCyET8oIjFhu56KNhA7GEICIhnHLBthSpWFCg30AB4nLCO5vkbx6pTEXkcONZRCn3VOsuL+897pWJhVJZhkJr5TLzw63y54vP/IkSrPcZ+9JHKhUz7iioYwHL8R09Pr5wqVhsM3QoFgjATiilI6HPECMXIxa+Hgap/MgjFfbwZUQTJ13hS0oMRuEdDDEYCkKeRKRyt6dOpcGUJTIE0hgaSGWYRiwiIwjOG4HXI3DNEEiiMEaiwCSlMhrnKayvUWxUw20kHumQQRu+kNse6h+7X/LXfzaQHm9tlTGIHCxjY5GOofsbG+V8T+XsXY0GyZBNX4bncBmB9I6g4NooKtxm92PfWAhjnAuPdxiPbcRGNsnBnQqOm6RAKGAiIpVHEKl8NxGplGs3WsbtOBZr1ZqG458GpmUpwk6M1ReRik8qkyCVOZCHnbJhHtZN5MKpGPI1clmIgmHhM6wXQSIWDlp8CbwcA1EMgUhsa5FCwQSMV6k8GLufmyGV3jNeP6vK2caPT9W6HNspz4dp/maFseHl3V/J3ZU7e69XXHqMXRj2Aj5TqdgpGUgoGEhABy1iaSePSpKUSBIrFaZJK3F/pyWVHM3TJZ6CCHz0h1TuKkwqKPQGRDcQSigWlYpLNjd7DRrReLFpFXCkE0P3MQ3LSoeX1sjvL013girVepQM2XYsVpns1t0M3XxUSjZLT2vwxyselM6vrtf3secwWrLXGY3CPhoyINqEHqyb7dxvXo+x+y3YH6VyDhAKI5tYPY+FsiGIMMiEfSelabGlYit7483Xtom6MKnYYQK2cncuhDKPYmHkolKJ4/bUXRwMXLStRC6ml27U7V8jl0Aw45D++KTyYPtRsW2nS1cUYKZascGQKeLN368fPCmVGg/wXq+41O80BlIxwwnOXCou8ahF58+lVHx4ROJipcL1T77MyNBZ50AqAxFtDNplwX988NQugVROQCrx9Od/IJX6SH+eQrrByGYIYMo0FAXbpk0KZBOCApmL4dgfi2oCRuK6CqKUCIjDS7R/6PY8qfz4jNg9k5/98QF59Ln3cQwkxMKOYy2jIMjmM97xV872e06G7zhljgtwzw0jJxRYK7komrJALAkoGR82GtJeygFmoCfFYutkIBQwHpFKE59UkP6MRfozGceSKYD1MSYNMlip2Emxer+aTn84XefEjYeDYQEQC6WCY+0kU/qYE7AAKZDleY1YIsHYJmhW6CoQjZ1uIYxYArT+BQWejPVI5cZSreXuarmfsVQchi7+2FQQFwLrdIgbvdTtOMZ7veJSH+ezVel9SIs9gO0gyveQLj42flEq+moGqbwDqZhpGCAg4JNLOOWCRi1GLl4ongBO3r3yqISYqRjMkvO7DH0mLZWG7UfKhwdPiH1crIViidWxBJQYgEI1EJIYRHZCKjvFSGULpJKoqKVUHp68VAXEFGkIBDSEUoFIYkAMlmEoGDlBJKMtTwlG4Pqsm2Gk4xeLu80lXx7/aJdcXqpN7L7JtRW7SL/VB1LpVt8V++SqBzqkjr+yTHvp+/H+IFKiUPypmiGj+1RaKSicTIzRXhjFxCMoMg7X0FHklIrWvRjG74FUPHUqZduO0Qm2bH2MGUNlxKJSwXXcaIU8/upqSCXepByXStRiZCIWt8s/nwRpoFjiUvFNuRCPWCyuYMYso1TidSrXl2wp151lE6+VSmGwsjj2VEdQt+No7/WKy8OUCiITdwAleRdS6TX+hZRUHoFU3oZUlkMY5rlJnDwqLRVLqr6lED4JZOJKxU7J8AnuaUghUrEtRpakTCwlntyZL2RASAEkI9IPUrmzEKm4qZJbFxMB8aAwahSTA6ZMwyEhhYIJSKdQvrTKz3DIkc3eP/xl/Nm0rLSt9dQCRDOntMWK0hr22Smp/kS6cvYniFqaTn9Hm9bNdW0UlX4/Q7QvEhzXc4kmAc5zm+PdSGcMZbMnA8EE9TEBY/ecksYeqTwAqXAuHKZMrIuZhGuYsVSIVnANwjmGzax9RjSPv5KOVG6GVCZsPCKcblNHUgdYyTBqIbExRRq5ROhD7ykXLN0pF7R/C5Y+uZDRfLhZQir/uLeFXHpDeirP0yEuFU48FU0+VRh1OpxdpNJl5PNhXxj34Wy5pTJR3tp/XN7XKR6CyaOQOqVhK5I/irEk59z9RqXiMgARSN/TkEouBkMGZIgHRjQxyaBQ5aSQ/T4JDdz4ldzR6KnYvZO/XN9Aui7ZGrZWdX51o5x3Vd3UcXc3GyYDNx3DtazMipJKRCxyQuHNHcE44H2I/1imTIhkIAU3VRoNqTTySOV+SGUEpGLrZuxwBztIcypeR3PUFC6VcZBK8gkHdrJwG7mYib4DIA5b32KGAXDC7iBywb6wrsXKBQLxRS65pHLJWUrlqRc+cJqyCwLs6zhvOJyNVCiM0S+uMFKBBFz4yJOeEzxS6RlI5QsjFTu9g5mxzgES0PoZ7PcJxRKvf4lLxYX9YU5HKqk6loAS/Xdkpf+O4kvloclLROthUIAKwyeZJIxkrHRiqZNdT8HIp/DUStMmSK/jy+vlvCvrxO6flGw5SgZtPiaDNh6Vex5JV86ef93D0uW1TXqdcwLu0zavh+D78x6LQm/FkjvKMenUyN0npcF4n1RGQyrHtNLYVgwzstFm74AJkAExLUr50uOVtfKbhFRuqtxNxm44LHx4v45B2h+MlrZyCeATJe1TJXV2OqRAcy2HEcEArW9xUqMocjHNzy5sih71NqRyZSL9ua+V3FgmndaeDm2HL9BOeWmyIBOvMEaBJS8dOCEVGj3pvV5xuPKWhrJgw36d7sFO7RCOXzp8Snp46lSaIv15C4X4fUjAlYpZ2m2IYCiUYkjFxU4kpYJJSCaXVBq0HyEfHDgOkQQtRQG249xZS6UepDIAhWIghFAYVhy+fZangI1mIpg2JbdZeDz348OjgA3Bf1uLlYqNXIZsPylV+z2bSm1Yadt0xjvS5Om3Nc1x9/HY6gPmyuDP8mTY7oxpMj9NkpGLiXASrV66LXmcI5Uk+KwhEMTIfRkcD6l4IpUykMowSMW2PBFt8oYQLOMhg/EqFbYm5Uv3Vz1SQaQyZuNhCMVIJda3xcFKRYE4ZjtQKnNRWMM6FxRgYuSSRdQSsQhYsYykVBKRyj9LtZbbz7Jptyzk8MK+E6nI6CW890uIGl62fWgCoZDndyHqPYv3bfL4FEk+L8myFFLp7pFKk55xqXDe3ve+4uRUpy8VO7l3OO+uIxUFcrBw/1Oe1p9cUlmd56dE3+0Z6Qex9NsJIBfyBMTy+JbjcnvzeJPy//yMUlmq0hmIyMEyYFcaVvgS97gkgwArhZVAQk/tzjrrFne/wcrF8hQKHHG39fx4n1xxf/vYZyC/v6K2/NbT9HxV+c7S65P9uD7vIcnppXyuAIsiHnlxmU0xHLhiGr7rlNT3RCplkP4M/fR4LLqxTd82erEd/mxzdRekP79OSOVGRCojNxzKWclrBzbGJIO0aBYikDBFAhq9BMSao7F8HgWaj3hlSsTl80hHuByxbJP8NSGVG+5vK5VaDIltO13+emUtmbRiRyASt16HUgmGGFixEGx7euVOufDqeEtUcbn42roya/WuWBO1yxJcv/v4xWmp9JgoSw/kaYpkH3Oi88fgHFcqlg/5FAB9EkBcKOTrlMoqRCU+VCp9Q6kUYAmpIH0oTCpP7ixAtGLEwCUlk2QgK3xJcJwPlUqILZgswPGC6pPKU06htEJxpTII64MQbTScsUx+7GkuTvLTP5aVxs++hwgqm4OiozNN+/biXhWux+/NMjj5mveMpY22ckllOO7DMgxSedgjldJtfFIxEYs2W+M6tk8MhcK6F59UbkhIxTZJ274uHNSoYolJJWuenxSQkgqEQ7FYqdg6FwUFmlIhw3JIpeWI+bFtZ0LD3k8HY5QK5GXcg2lx4rOQguchQSbE9p/pN3uZ9zpFQVF0GbfItCJBDjpYMkbxpGIpSipKIJEk9hlHZy0VnFekVLC9RG9EJn0gkz4QgKUvIofHckilLqRC6fSHOLjMRZhKQRKaLkEMOUkUzpBCjrUF2E2P3Ne2bqfPpqNyh6djW5K7W49GyndMrx2J4Vxg5GJlZ4giGvdYpnFDQ7EUzlB8rw+Pf80jlbEy5NMTSJWCFihII9msHaZF2M7opcvLkEpipDelMmzD4aiCN5BLMmLR+pZkWgSZmIjFpEeuWLTOBYV5nsqFD7K3mNSIghmO9OeviToVSqXf4o/lDxedeZd58tvzy8vItzaoQHz1K9xu06KFe/Pk/vpPeK9TFNVbDpXXkPLZJzuSZCc7SqXbhLRUGveYJG/sPyGcz9c8gcBU8ppHnEgQueSHvXSTkmEztBKLUOJS+fiopGDl71PPvAmpxOdTqd9upLy3Py9nJa9tPVLwWqWShGLpufm43NZ8eOzilEodSMVEM5RKAI4PCbZF9TOWIILxiQKRh5/cx6o0WBiDwpnERjSURJvXN8l51+VuOTj/hobSfunWSFi4roLrhOtJCttHwv24j5hQ8mUIPoe9z+icAhkSQLGkwH2xX4+F4698UikFqQyGVDhPzgicp0MhCpMK9vuk8k9KZf1h7etCwogF5xGNWMDTkAjrXfRZSroMpKLRCluLMohYKBRGLYawAx2kEk1racSiUnkrLZV/Qipjkbpwnhd3+5lw3b0tZMaGA2HrU66+M0NfWy0/P4MpFsrU6yOLdx2FSDjFg+37YjATV5lOdW8WQyr6BAIca6ZmCKZoUMFkEbkY/FLhMohScLyFYlGp4Jgk50QqoMRj27Py2PZ8UBCQlcchlu6Qyq2eSKXOJEqF4hBIxKBpU4Dd1j+Qytngq6uxqFwogEAedmnha8Jj+m8/JVUGzpN/S1Takv/EH7TakOflyR2ZUCohlFhym6WwfcTZ794b1wfj/u3r8BjgSjEJW8goI4Vy2pWReuNfle8kpdJ2rDy1LU8rrNljWdOmANv6ZNMiO3Cz40ur5VcXxDu/USpDIBV90ByYDEHZqIXYZmk7PYN5CBwlw166pvu/PlIWkrHpUJgWQSrEzu2iUzBgu6ZFeD1sKdKfpFTKtJVJG/ZL+0mvxLafKTU7jpEFB046FcXsrFdgHhOLQj972+dyI0TmO7cwStbqKfO2HjYTVeE6ptmaUz+IGd+EbaapGtsRoXUb/2JOqYSDHAnlouSbKTXBu4h4KBimRf7UyEQysWZoyoWigXS0U52tjwEffJGRQc+8cfZS6bU9I71iUsmHVAq8UvkepFIbUukD6ahYcFxfLDVl4jrFQskoXEeBDohFNl48KRQKEClKKiyQbgFWmWjKRbheID0+OShXlk8/j/mayt2lx+qD8iQK15M4n9hzKIYBWA4ItrtoXRL36X6mecF6SLQ/ul50XbvO99XzwUAUXEYsNnUjbCFzsRXAT6lUXklJ5T5IZSCkwshGK4AhE4utj7GDOe30FBwzlZTK9ZDKYEjFjrSeCIFEk1llw6kZzFQNEAvEYJ9goBW5eO1GLhZGMM9BHiEqFkQwrG/R6AXCRKTyl2STMqQyccM+mYII4+p7Ho3tOxP4rKhWY16QBSj8z6OgLoRMWElMuSw8cErqdE1PrF4UlZsPlgU7vxQzURXHMdnpHjj1QyQVFQtEwYmsunqk0ghSeQ2FmNGMThoOIsFETdNWKm5Frot9hInpz4KohevARDEmRQoreVUqWUglHak83D6SyifHQFIqCUr0VKkwWrFSKYBUJKdUak1cIo/jeE2TICAKhusWrZ8JoHBYP9PHQSOcFH6p9EfhI1YurmS0UKLguPRHgRxAsP5kUJdjJcTK5UazlstP/1A2/Dw//3N5aTznA+mPAtofhe1JFnK+R3COnofX/bG9PwqfvZ/0fUUCTMNrOvtxTZ77BCIPotfFe3PJ+ybJz+USSnNnVup4pFIS6c+AbScQzSCVwjV92J7LFiOVePrzj8pdZeD6Q1GLEWRiW41Ms7Tp66LDAUA0sRTFktWIxTZDz0T64/IMxEFY7xJRIM8i9XkOBW0QpHK+RyoT1u/VJuoWoxbG9p0pP/tNKemz8IOwglhbn3D9NmMWph5YVxhMkdpBUIsPntSWIzvNw2tfUCQuUVP16xAEK4K7eCpqG/aYKK+iENtJqzgWSVuMArEYEK0g8qBU7DOrXaI+LkGzM9BHuwYyCaUSoFKB7AbNZEVtWirvHsgLK3RzRSyWEt0/y0gPSKInBGHpBSF03ZQntzRLS6UGpNKTEoJAHmdUA3pTMuDxHXEomcdRmC29A8mQfikQ2SRB4XmCBRrrLk8SbLeRACOH/gE2ktDX3BcWbpHeEOXdraPnMZfsMEF6bzmuxz4RHE/4nuZ9UfCD9X4QA+/H8gTFEOx7AvuidYvdz33J/fi8WBp4XXOM/Qw+THRkYXqYkQc9UrkXUumPSMVENohoQpAvg8FA+/gEDAXtXlrrkUo3GYBIxQwVcKZyIPshGUiD2OkadKY7SgZMAXwMyjQI5Wn8159+EHJxmAmJkGcQpRhMBPMstpGBS9NS+YdKZZ/MgXSmbv1crj+D1MTHX66sJSPe26KtT/Nwr80Gzz4toVxzV3MZi/Nfwn1pXQwKpoFzx0jIqxqxEEYwRiyv4pzOnjqVBpDKK5CKreD1SyWYSArb30E6Q+wTHkOxBFKxz4nWdQhkOQp+Ui6FSeUhSOUd3I+t4NWIJRCIjxLdPstKd9ADcrD0hFS6QCo3e6RSfeJSPYbi0agG64xciKmfifP4TorF0Bto9KJALglSomGB80QwGsWoWIws7H99ktxmX1vaLv1Uzr+hkfz1lqbSftn22LmGoKDj+oyibKFPofcYSSG+D9uLOtcRiiV9LxHJyKj/zlNSe1xaKvdAmv0glXiEY5rF2Vw/CEs2t4fN2aANpPLLhFSug1SehFSiZumCsIJXK3khEsLIZTyEYub/NR3qouglA7mcglwCIBRCscxAxMLnWvOh+joUgGKhVLDMJZXx6/Zpp7o5iGj6LPpYIw33mDPlL1fUkgGvrpZq7ccUWyi//nM5jWgW7MnTJmoFUtHnUwekH2NinjrACIViYS/ezp5IpXhS4YRSEApkYGeq06jFkUoyYim+VOJNyg+1GxE8yyjeHJ1LLCW6fpYv3UD3ECOYzhuP5ZDKklA8FEuvoB7GpRcilF6IVIgrFSsWRix9UPAi8CPxEMrFg6ZMKJjE/tfvG7x2tyVTrb74fDVGvyK1xr1u+ucEx/HcfiiwCo5z4T4D1w2xYygF93UMXFeJtrnX6YtzDc77e+DnjaI1CGhHJrdUtkIquF5UrwSpOAzagx8PsK1SbZD+pKRSqas8se6QqdglFIsFUhkDaRCVCoQTTU6eDbv/T4ZUJu/n40zMFJiMXEz0wvTINEvb6Rf0ofkQCvu6DMghlXGQinaqo3xw3aodoqjzm4KPma3YcqhM23xQO+0tdrBSWQyBLKY08PoVCMTgSsasvwxBdvJIpX6PSfISpMIJq1ipq61GkMhS8BbOs7yNlGqZYutaTH0Lo5Z3v8qGkYsVyvsQx3KVCl4HWKkwBeJ0DAM93fQfaodIZR/nd4F8FLYe2SkXkBIFaH0L+6l0gRS6flYg3T+1QCooeJ03Hi1SKiqWoB7GxexDSuWRih8el5Heu5AyObgFMQ0LYfw/fZ/EaxWG51ytCwLuNfRcz7GEhb8PrtVHl4ZYClfIuYa0VKJrmffm9d1jkiTrnfpBKrXGeqSC9IdDLLQJHwLxYSMY2wLV+sW0VK6FVPpBKuy9a8RiIhZDNMDRSMV0pAulAliZa2epm0L2USxBszSEQqK+LoFYIAzWuTy5JIdU1u5VqRixZGX8elbatowd93XBCKZs00EyYfXusBfwIhWJQCAiiwBFQqlwfRGWnKfXPsmRnesiqRhewmfoOC4tlYcRqbxIqeAatqVInz5AsWDd8hbe522C7RGsa2E6lDFRSygVUam8Dym8Dxm8fzRfcaMVjpwe4JHKwyqVE2GFLqUSNk072DqXUCrdQrLSDWlLJ0QqN3mkUnXCUj2u+3aBXER6BhKhXBi5cL2HI5XHIA3il0nhRKlSRDzCidMbFOc4HzzXt51wXxLfccXFdz3iO9bifgd9+d1AKjXHppuU70Kk0ntLnkYzSaKmeggH2Em5Wi1OS+WaSt2k79rDZvgAiI9T4hgkyAWMQYRC3GkZxkM64/eegmDM3C+TAsKJo3AMJ/O2D91/GmLiJN0qF6z3h1T+nJDKdaXbyui1+7RznbYgHRSlx/wP5Kdn8biOomBkUq3daBm/creYXsAF8jxYCHQC8EAwVjJkIQr8ws/NeCY7pulFLCkc1ruYXrwQENJAr1S6J6USiMURikGUt7A/gi1DiFi+PGWiFqy/h2hGgVxsSmSxUQx5D+cOmOlp/TldqXRGyhMnI122Z6QDpHJjs3jnt/8OpKKRDaXyGaBE8EO3QlGp4LWVSi/8iE8XK5VkgVNZAHd7ElvwfPuSPE7wn/prIfFeLqf1volzDYjsdpyS6p5I5a5WY3WIBeuikti+Q0YqYsZnYb3V4nSdCqXSG1Jha5ERi+nJa7GDHUdBCqxvcadlGAuBjN13SluJyES8ngjR2LqWqJduIBWs6xCAQqRyLSKVkYFUTMWuKKyPaTbqhdOqXC0OfLpAg/6zZMb2ozIf0YiFT3V8XoFcIAYbtRCuE9OSlFWxEDtgUutaKJOARZBKh2JLJRALohELn5lk5JIPsiFmGMApjVpULBABYec5tyI3We+SSyom/TkNqXT4FB8soGNAJ6RA7TcclRsSUwNQKlUmQiqISrrtEEQ0hOv5Id2dJaFgjGQMvfBDTsPtHrk4hYrLXnj9mFvgQLrAGdxj3Gu423mtc00vFF5Ld6Q1PtxjThcr3Mcg/mqQyn8lpHJ76zHSA5GKRjNIK136BGmlrcdR2WDZDOnPLxJSuRrpz2NrD5lWI6RMVi4WK5fhEMIIykXTItNzl/O/jAkmlmKT9BhIZcz+UzL2ALYB81QBdwoG02o0CbLgo2h7Qyp/SkoFkcqINXshHjZTu5W8BTId71Wt8+n3K8kFBfXoqIUyG4WeAyBd7FwxdvzSfEhkHgQxHywgiF4UrOeSix2N/cKBU9J+7KKUEB/qPkkWoRDrwEYcb2HlblwylizgA/HZ9T+j/VvCaAYiYSWvVuwSrLuVum7lLqdj6P/Mm/JDj1Te3n8iVv8SCiYUjenqT2JSCeWCFKjtxqPyz8SYGVcqXa1UIIqukIfFFQyxUgnlgv+Qabg9P0WqwCZek6RMLO4xrlTc7bzeucbee49AIN0ICqErlR7OZywuKpVAtoT9i6rmkEp3SKU3jnfrp1xsPY6tT2r24mpIJd75jVLpBanYliN3mAHRcUrASsVELmZahuRwgNGQyGhHKiaCMdMvWKlwCobCpHINpDJs7V5tPXoaUCoufNbRnXXSj8A9U5hS9Zy/XOZAHITjlSzzIBSF6yi481CwKRVLOI4pkIoVi+29a3n+4ClpO+70pOL2dbFYqRjBcLwRK3ejehi35SgpFdtyVJhU6rUvhlRAKJWOSGU6IO1JSWXDMfnnI+n0p/KEJdIFx7MuxkLB5KJ4UjEkj+0CsTV/cyvSrIwWqrCAOYWrODyGc1yZFCUVtzAXhiuKrttPSdMlW6Tj5qPSDQXX0jXA3ZYbRH0xIKRgX3d8jui7ySLtzEiVsa+mpHIbpNIF6U8vnNNrF783Ek9D7ee3An5k8Rr530SkclWl7tJzzeeiHQhZuYul20zN8UocBGkilvh0DXaahvgkU0YyoyATt5LXYud4oWR6eaRyNaQydO0emYKCOAX/4d1KXjJq3UF9kJp7ztny5ytqyaB3t8qzkIcdWhAOMTiUL7MhjrhwkJrtPip3137Me72zpXaH0V7JJCOXWIr0hUAoAZQLoxZIYRkk4DZHn45UQrk4QolJpcOnFEo2jkYqxxGpxCtqrVS07sWRShfIw5KUSncUglz0QOrTgzIJSO7viB/1XR0nqljORioxcP5jKEjEKxTASKI4uFJp8sZmubPTJGm3/vNQBKT4UqFAvkap4Fr2O7CfP5TKIkjlr0mpdJMea45onxgzypxN1A4US1jPkpYKhwPEpWJkklMqTuSSUyprIBUIZYqmQEYmQz7eJaUfGZx6UuO54qp7W8q4DQfDYQUqFURGbNY2UjHTORgolWPfuFRs13+LKxWyFEIhjFZcqRhYqWuilmWIcrxSSaQ/oVQIrqFywbqlRDtIpR0k4dIeomi9MU+u90il0oSl0hHndEKE0/nTAl12QgpkickGJCXTDSLxYwtSVNDar/lCrqr+uNzaaoy2RkWFKsLW1SRJHse6m55ABZbY50KZpQt34Wj9U7PhcvWD/SCVL8PtXXLQFejnDQm+g3B7sO7QXaUCmVi5ILUsTCpuRBUJJhJLJBgIcdHalFSuhFS6rTkc9kq2wxYMFIvp66KpEDB1LXweVEZxxxlRKjpr3f4ClYqF/VzcDnTjDxDcM6Ry3hU+qezT5xiRQR/tlDvr9dUJzd3jvg7uqttHpm4/rhXDtknbANFAJhxaoJ3ywMydx+Sur0kqtTqMCVqP4k3TdkIp07kOstG0KKO8jujDRCy2jsWJXIBtimZaxNajJ2YugVTS/VSWBVLxdZxLUqLtNkQlFItDe4iiKKl0pFA+FSMVyMNCqbh0RQEvGggHBaUrfuRdUXC6ERSEdqu/kCuq9JQf/+EBqT3jfem2HVEBjldYsLRwFU8qus2zPUmxpRIc13VHVqpNf0d++LsycmXN3tJu3Zfms2BfUiad8fk647N1gRDiYD/oCplE8HVEN5zbHefaKI6V4D6p3AqpdIZU3Iiqp5UKzk9KhTT2SaViN+m6+oh2JFSx4P5dBuCaKhakRioWrA+BRCwUjIla8rXeReteII6RjlS0vgXow9Wwj4yHYHJJZQikMgxpTunmQ7+2yCQX1bpMlBlI4XQ4gQsilucCODBy5s7jkMrj3mucLbXaQyqQmJlMqiDE9tINpQI5JKXC5mhtLYJIXExdCwcs5svSIxnpN9NfUbtsXyAVh6RMLCVab82XNtsKpG2IEUurDcfl+kfSUqkwfom0h4jaQyrtIZUOgPUyLh2c9aRkfJioBoUtwFb6tl39uVwOqfC9LynXWVp9tD9WCRwWMA8+YVgKO57rFELRoOBj+eiH++TC0mbKyitr9ZY2674I5IHPpsuITijUnSChTrh3N7oLozzIJE50ja6Qg/v+XXCdSmNfS0nlFkil45Y8PcamT92JCimOFXAjpD8/T0jlCkily6oj0hfXYUuR2/GOPAlJmc50pq7FdqSzAx51RDWEMnifmUNY5xHeJzJ8f0ZG7DOwUpeVu4xk9OFsOIZ9Xrq/sUn+mJDKlfe1khp9Z8ov/lQutv2bgpWp1bpOkml7T5pBkYiW3KEFGrkgypqxA1Kp9fVIpSak8iKkYmauM31eNHKhaCwQg0YuQfTyGpZMiaI6l6CuhYJROLdLVvu3LDl8SvrN8KQ/bUfIW/vyzOjnr6KmaJ9QSIlWkEhaKgW5pYJIxUQ0onT4LJIKZUKYPtn1jk6hyYWRCwoPhNIZhcX+B2+LSMVK5d/+/Top/cQc6bztpJEOChr/e58ZQbSRgy4oNGm43YVCPSn39nk2/H6uQKTSClLpiPfoiPcwyzgdUJg7cInP7WKOJ4j+ELl1wrrBSKUL1t335/dU0SOVmyGVDohU7H3bOh0F761RYAjFnC8NPFK5HFLphEilN6TBlqK+uJZLP1yvP7YTHVlNuTjo1A2QxVOIQgZDGGTIfgFO5MKUCIS9dSEU0vXNtFT4oHz3dXH47YVV5NoH0nMUnykUS9NRC4Uz3alYIBIdbY2ljVymIVK582uSSg1IZTHEoXO+BLhyMbDnLocBRFKx9S4xqQRiMU9kNP1bckmlbrsRshRSsTLhrHPETKGQRqXSGjJpA5FYsVAWrTYg/fFIpTyk0hbHtoNMeFx7LG1k0gFyoFBctMAUQVwyjFZQIHBuG0jlsiq9wvf/7TX1pMErG1HAWMgKx/6H92EKW/RfvzP+s7p0wv4UWsBZ2ANwr/VeXC+/uiz68V9Rs4+0RPrTAcdGUCTE3ebDHhcXTvj94Bj3/TviO6ow9vWUVG6CVNpBKu69h587B/UXrYZU4k3KlEqH1YflMcjjcUQk5DHAvi4WE8GYUdRPIN0x00cYdH4YvDaDFxG5YMmoZTCilaF7DfowOaCTeSNVYtM06fLmxpRUTpcf/6aUdJj3gYz57JjcVqeP95gz4Se/uU+6zl8uHBAZjra2YNvUHccgla+nTqVGhzHBRFIcW2TGF9mhAba3LtG0CKKwE3j7pBLBil0zxeWbR05JX0/6UwdSeXO/kYqZZiGr6Mxy7Orvgm0lWm3NihGLBBjBtFyfJ//wSKUcpKICCiIVKxbWw1jaQggWt4CkYQHCf3AUkAikB1iS1gmpkOsbD5G2675CIYEAik1aKlH0ERQ+FBAF6x3xX5x0QMGJiIuhJe7h6ofiD+6+HFJpAam0x/4QnNdOgYjx3go+ewy7He9J2uM7sZjvJxAwrkf4/u3xPZXzRCo3tRojbTcfx3H8HAaNdnCdXDz8wmr5WUIql0EqbSGVnhBELweVTACjGO1IB6n0hUTY58VO9WCma4BYIBNOPsXlIEhlEKRi5+S1ctHWI+wbHtAZUvn95bVi93M6sPK2/qhFWj/D/i+D1x6Qy+9p4T32TPjTFbWk/7JNMv1QVmZAJiFMf5AWsVMeB0fqAEkcMwvRhYL1yu2LfoRq7e6TZPbeE9qBjsMBlNh6gbwAQVgYuSxGVGIJJQNeBlrHEkC5cC6XCL6GWLgdkUrvmW94pfLG/uPhFAvvBiynWHxSaQmptNyaD1BQlHyVzKPrjst1TeNS+S6lMn4pxIOUKYhsrFjaQSa29agtgRRIMnKJw/0osIB9Y5K0WpWWyvd/XUqqTH5L93dGQcsJ/psn6yXSmH3uf3ViUhQUbhScEL5mYQbt8N7lx72hknXvLS4ViJbHQiZtA4xQIA7cXxxu82O+I4gESyvhdqDt9oyUHfuq/L+EVG6EVNpsysNxlLYhHgkmoVTWQCrx9OdSSKUN0p8e+Ow9d2dCombqjEYv2qEOErFpku1Qx8GcTI3MjHoGnUArgKIZDKEQM7eL6Uw3DJFK+9fWyY9+febjee5qNFBG7zop4w+ItiaRQRDLZedQLFfgWiPW7dOOeE9DFhSMbeY2HfLY69dgo5lpu47KnbXjv2cftSCVZ/ecEH0Q22EODTBPHjCY4QGcrc7A8UZRL11ipWKjF1OJa9MhVuKmYRTz2uGT0ntGWioPUir7IJWgT4uCiEUn3nYIpfLolqy0gEhaWKlsgVSwbJ5LKuMoFUYzIm0Q2ehSIxcD113cCCYNfkAeTN8Z3BOkcmlCKuSCkm2l6ft7zH/vXKBAR0T/teO4+6KopD1e+zFiaPjOTvnznenRsZdBKo+u/RKFnqIQaYvjSRuc0yZYb4t9uWiDAt4mkHEcXI/gGEtbiO2BMa+lpdISUtkIqaiI8PkIjs9NvjxUiFRYyUuxWNiSZGETtW+Mlk5dAaFoxAK5mNnvIBOkOgYjFhOxBKkRgVQ4TeatDQbI//m3q2P3U1x+c2EV6bVsm4w7ELUmGRBlvbUZadWZR0BJ7qjTW8Zv/8o76trIhVAqhjEbDsrFNzX0XsulVrdJMmtPHqTC5yTly3yIgoRPHaBULJ9z3FE0eFEFA0HYtEjTIaBTL+Dc+DSXdtKorLxO4Rw6JY/7pNJ2hLwGqbwNmRD2a7GTQvEBZxEUDaTSHBIhj4IWZDOili0F0mztMbm2abxHLaVSFlKhdDRVglAMKBBB2sR1F7f/S3GxUnmUUqnqN/udPWZI2y38j2z+e6eJ/lMr+PFrBJLcbnEjExT+XLTCe97aZYr3nhipWKmoJHC8wUilUHB8awiEpKViwXUD2nyalft9Umk1VrsDmOjGkvxuIiiVup705xJIpfWqw1qha/rH+LFjkVQu+BxGLmaIgA5ixGtLOMlUELmYeXi5ZN1LVit1a49cLP/xnRti93I63NdihM7/Yvu/RJjhAW3mvi8/PosoKEnlzhNk0u6TOqWDmULTlUo8Yun35nr5xR8f8F7HpVa3iSoV8+hYjj+yT3iMHmVCXKm4cNoFotEKjlGx4HgjFTY7u5gIpjCp1IZUXt2XF/bIVakA29XfYitxQ6kYCoRyeRTSeGTtcUglHak8AKkwmmFU02qrIFUy8kgLxQgnalVKw1Ymn1RsStV85edySWXT+pPkF5fUlAcXrjXRDQpOkqhA2UJFoQCuJ/cF+6O0A/cAbKQRgm3V534iP038V7dcVqOPNF/zhQqAEUdrHE9aBdjXKbbju4qB74/nO4QRzGfmmFaQbpkxr6ekcgMilRYbj+vxbXAdHm9ElPiOA/j91Xl+bSpSoVRarjyE9DCrlbmmD1GEO2C0J3hMydfOdKFkNGqxI8dNSsTUqD+E0x+pk+2ta4cBtF+yRX53FnUp3//53dJu8cqwadpgOtgpBzJ4nZGHRiw8Z53meJ2GI1/QKR046bd9ooCCSMWl9dTXvddIUhORykykPzocACLgFJpzIRXClMhEMEHkQrEoWeGjZPlIWTtq2jwIH1ELtmsztGIilyT63KODJ+UxSOUHKamMlFf2HhcdqAjYpyWaFAqCgbzYxd/KpUQzpD4WSkWjFgij6do8ucYjlfshFY1ocEwLiKElwQ+c9TBxKByTGhErEvtaQQqk9S8pUBBAs0KkQq6q01+jGVcmtnnb3cZ6mzjuPkrJbHfrMiiQZDTRdNURuaR67ubCSyGVRyAVVwaUSUuHUC7OMUmptELqZEWkx3uOpVRKe6TyT0jlUUhFz8Xn47EqF5xrv9/iSOXvFbuGUmG9k8oE17RoPyGgfXu4/lkGy4x2trM9dzkUgKPB9WkLuE40kDEDnJYi0G/rcbmhTr/YPZwuF97aVPqvO6RSiTBDAtjZTqWC5ahdJ6Vcp3M3qvknvyklHed9IFMhDh+UzVTIrEzz4j22lVKZsTtPO9aZAY0cEnAKS4gFYrDjjExKFEUu9gH4PqmEQD62OdqFYnnp0Enp6ZFKrVAqppXIdJYzPXG1N64STA71ZVZKPIJ0JwIRCpbNIJfGiFSuaeKXio1mDFjfFtXLJLGSeRSFoEVCPq3xujXCeLN0oxxD00+OyN8LkYq2Ro16Vdpv4UBIRBsObsGJyARAHJ59JsUwaKTh0GpbRkoNXZwqxC6X1ugtTVd/Lq1w/ZagBUTlB99NscB3pkTbWkKY5FF8b6VHp9Of6yGVR5D+uOcYuUTRjissUnPhmlT09fcKXaXFJ4dMSxxSM/Yhcjsouh0V2RGP/WYoHjOMwKRG2mMXgrHDBUxqZCt3AVIf0ndPRhrMWS7/g0jDvYfT5e5mQ2Q4hBWNN8oXO++L6WgXrT+19Su5+cFz19TMHsC9l22WSUhz7FACVywjNh6SS25r6j03SfWuE2Xarrygg13Qye6gyLPADGi0D8A3dS5h3Qu2uQ9lcx+EH1bmUio2NXJgivQiIqGeM95MSaUm0p8XIRX2yjVTWxq52Me3WrnoJNyMVJpAEJamQOVSiFTKQCrNGdUg6jBwPQuxuKKJYBTTAlAqhK8jsloAW6FQt0JBSdJkZeFSIX+6rbk0eGuHRxIGkwZYkFMrWWebu8+suzKx1Htjm/z+xsbee7BQKo3XfI6C7BMJviOCwucWeB+PWlBgFWdfeEwOqfyjEKlYkpGTVyqIVJpDKqbuha1EtjewQaWCpduaxjTJHQRphghEmNHRpr+LthwFUun12XG5vt7ZRSmk5tAFplNdKA+DdrbbnzFL3WYE02/VAbnk7nPXInTJHc3kyY93qliSdH7ho2KnXJTKFEQqti6GTdO5pGKiFjOg0ZVKFLkk61uiOhcXimUxIqEehUjF9HFJS8Xy9lcEUmm4JSuNNmelMWiyCQV5E+QCsTRac0yuLpZUDD6hkJZIgVoAv1QKp8nKL4qUCrmp4yRpzpBfBWXQAuQUntPBphiWZuvxo3ce7ZGLS1QqX8YKtIk0rFSMIJK0QKpHmoUUAESMDs2B+Q75XYr+DUqNSqc/PqkURktQc+HalFQuqthN0z2b+rHimfVMtiXMVvLapmlWhHMYgisZHbOE6MTAFiPIxWmetoJp9vpG+dmfy8fe/0xoNm+5DEZ6MwTC0KEBbK7G0oyk5vasDAVGLqZPTNe3tsofzrKjnQubrdl8bZuyydi9GSndMt7oEeP/d1XsddVukVS0qRroNJq4lg5ihGT0OdVIj+w0DOlnVdvJpKL0SCMYRCSmctdiZMMoZtHBU9Ldk/7UbDNSFu8+Lq/jXDY9czIonRAK14kmg6JkjFwSUkFBDqTScPUxucojldLjliA9wg8BP+qwLoZSySEWCsWVSosEPpnYfY0hlYuLIZUfn19RKs/5GAUzg4JiCrBPFsUGImllpYICXnHGcvnReUWPOSmOVJpjW5LTkwq+18Kk0mKMNIUE7fet3zmup/C9POSSShNIpTXEQNg6ZVqxSFA3he8q1pLkk4oliFx6QCaEneqsVMr0nRV77zOBj69tvmiFDIJUntrPnruRVAxWKkHkEkiF648i9TqbfjFJbq3TW0Z89lUolYGr98nfCmlK/j//dk3sNaUyaU9e2P9lBqUCYZjhAAU6HGBWIBVOx6BSUbEYipQKZBJNgxlEMIxoIJVu03NIZY9fKiGIYEKpNNickYaBVFzqUyqN003KpccuDVOkZltQACAOE63gh+7B/mf10QIFREWC8xnRWOz+hp98Lhd7+qn4+HvVx6Txx4fD1Mli6yCKg+/cBh8dlL+VSz8u1cclNftIg9VfBCJwxACZPOJg9rkSMTyC74M0xX4DBI/vx24nzfS75neflftGptOf61qNlcYbTsSu29x+37gmSUZK1SCVn/ik8slhiNWkTEwLTX0ToxZWZBtsxTYlo3KBTGznQR15bae7cCIWzj/DmfE4f023bSfkmtpnX7fxywurSPu3t8lA9tgFHA5ggFAOQC4o3EP3iw5qtFNhRkDaz713TsVSvvN4GbvnlEql8YTCn//8f//zH7HXVbpNkol7Tsg0FHST/kAokIMdYxQ91dFg53mxz6aee0gMmhoZ5jtiCeUCGbiVuwshr67T0+lPDUjlBUjOPL6Vz4YO5PKF291fZMmXxJGKjVbiUklHKqXGLJFHNmUdsQCKZSt+vB6sIHwYqYCcUvlCLkpEKryHCx7orAMM3e0sXCUHL5ZH8Xn0moWQlEcuHt1ySu58Ym7qvXgPl9buJ9/7ZXyQ2yU1KJUvUZCtNLgEKIiPOLgF3iWUCsF5KhUl2ObQZGtW7h2Vlsq1iFQarc+Liai5gr+HLtPRUtXnPVKp0E0arziCiC1faYP7iMgYIJK2oB32aytaGLWY5nut4KVYIJWoOZr1LfnSXVMhpFSrDsl5NzSKvfeZQKm0g1TYqc7OSqdAKoMhk8GIXoZAKEMJthsKAsy0DbWHv3BOm5ofHvmCDN54WC4v2cp7DPnhL+6R//zOP2PbKlupMFKBUBituOOMwvFGGrFANBCKiiUpFWxTIA3TiS6C0YqC6ywEL0A8Cw9mpOvT6UgllAqON1IBWE9NxJ2UipsGWalcmUx/fnq33AepNMV+VupqxS6k8gjkkYtmkATxRjGghcolTlwq8UjlR38qL2XGviEXVeoR205+d2NjefC1rbgGop9CgVxQUIui1osb5VdX10u9zxUNBkvpCUvlB85zmcnfVSpf+YWBVIo0DZZ2nTTDZyVNLDi+Cd7fpTGBABpjH2m0LV/uGZ1Of65tMTYllQi8b2JbM1B1PqTyl7hULizfXRp99LkRPr4z02KXifg0g9Qwq4SyYSQDiWjvX2BEQ7mw7sWp5A0Ew8ilyZvb5H//ViX23mcCpdJ26RbTRL1HZGCIkYwrGk2LCAQTpUemN2/pThO91z8TfvzrUnIzorDCRHXxrU1T+yt3nSgTUIinoLBPOZSRqZDK05DD03g9nUAc+owkREGc+NsOaLRTMJjKXBfzVMd45MKu/yILsH8BrrcQEnoeUunikUr1NiNk4e7jYYe513Du64DRiouVS4n6iDrqQxINWI/CCtqAh1cflys9kQql0ngTQjoIhTSBVJoiUsnFIxAHaUbBJFCx4Eftg/9VG3giFUql8pwVUvGZD3Xd3UdYp9Bk7VFcI6pTSFJY/YJJEfDZ1nwlVzVK9yv4xZV1perijVLhuY8hlXjvyIshlfqQSlMUepcmuG4cu91gj2uMQh9iRRLQCDRUIFvQAIX8bo9UroFUGkAqTfD9pcH7hesmtSKV5q+RH6ek0k0afnQk+s6UbACjQQChuGglOUSiKRO+Q0YxTJFMBBN0PtyRCSp0TRN03fmfaH2I+95ngkrlrS06UtoMZmTPXcIhARKON1K5QCYRkIlipml4YttR+ec5bGouDHbWK9t+XEoqlSCV8bvzZDJkYJmKwj8NPA0BGPJ1AONMSCWMYrCNmMrcAGx/Dufr7HQQi+lMx8jFiIX1LpzE+3kKBlGRTyrVIJUFe46HI6D58HkVDERCdJAixQKhkBIPQSoPQxIPQyT1sWwQUG/VcbkiIZXvQColxyyVRtjPqEYjm0AuuWgCcZCmkIhFI5igPoZ1BLmoD6lc6JFKpbmfSJN1+OO3S3dg+uEfy0n5mcvxHziLCCGo00iglZ4ooD64r9nWU1Jm4lL53q/iz+plGnRbv7n43CelnFcqvSHjrzTSYDTREMJQ8N+7IWTSKCCMNgLC41Do4+A8xbxugGMt9SGVuyCV/0xI5aqWY6XehhM4BlJWonMa4RqN8bdQIIkmuEZjUGEBpJJIfy6AVB7++Ij5ziCJ2He4PaNiSYGUqCVEYmltm/AhEKJ1LztOaX0LK3U5eLP2nI9j73um/AJSaf32Fum3Nyt8HrZ9/rQ+gxoieRJCsbDehdgIZhBlA6EoSIV6rTogF5/DpuZc3Fijl9QdtiAllYpdJ8nY3SdkIgr5JIhhMkTBqGXqQZFpB4jpUGd77toUyWLndrHMQrTzbCAWCsYXuTBqmY9jOz+drlOp2naEzNt7PGp+hjheUrKKOzCRI5/jUnGoi0glJRWkP/dCKg1xfEMIw9KoEBpDIKQJJGJpqthIxoJUKkH9Ff70p9K8lZAOcuAl2+X3tzwS20/+Wraz1Ht/H8SCApAL/FfNRe1lu+S8u1t7rttF6i4/iP/uIuXnrEylPxfX7AMZf6WFl2hEQSASBYXcRhsqkwQNKI4QHO9QPwRCAQ9vzZc7R+WQCiKV5PkKZBK9xt8H3zEpl0Mq9T4+jAjK1Os8kkDrZiDu5vi+LKbJPCKUCyIVogMmg8hFoxdIpdY5ksr38F+/6UtrpA+kYKZi4JAAAwVjRFMg/VUsVjSBbBCpPAmhkIFYp2TaL90qv7v83DU1J2GU0nLOcnlo1GKvVMbsOiETUMgnIhKZBCZTLhDKVAWCUcxAxqchFXc4wDM4NoKvWdFrKnt1+kts07SIQsGSzIdU5uG4TpDK9xNSqYJIxUjF9HOJOs1xPRMMSjQwclGpGLEAyMRSJ4dU7kH6o1LZjMJBIA7Wx+SiEaXiCCUCP1ZNkSAY/LB9UCoXpqRSQSrOXan1AU1x/XuGvSzf+XH8SyDXPjpaGqw5mqpDMKBgoED4qL/yCNK+oanrMQIqO+MD3BfeF5R7bkVKKhch/bFScSOL+gH2dQqVCKMPF3x+h4dxzwYIBTyUSypIf+quO54638DrQkzB64YBZZH+/CiR/vwVUqkDqTSGQGy9Ttgq5XyXbgTTXGWCiC/ANqeHKVGAHWnNAZo1zpFUSJ0Z78jjwVAAdxoGI5WI/pBJhBGNZYATxTSdgxT71/Fo9VxxR8OBMuTTPKnnkUoFSIVTN0yAQCbuN0zCOqUyRSkIe+0SG7lYzHwuAXjtnfpSibcYsZ9LxxxSmYv0J+zTgjTISCWjhFMrQDKcGKpE3Y1IdZjugIc2FUAuhjqr8uTyxiNjFzdSWSoNcE4DCIWEcslBo834r+yCCIURjPbihVQU/NB9PASp/C0hlR8iUqmAKMHUB+AYhOgXV08/RIqpyjXNR0mNNz7De2X12AieG6fJloxUf32rXNkkLRRyLSKA+iisphJVpCzu4fseqdSFVKxQrEweRmpj1vHd4v0ZaTBq0IijUPD5FEiES34nOI/Uw/d3x8i0VK6EVB5cl4dj8PdU8J44ntdLSov1MsQrlQrd5EF8t43wvoR1MKYexojFiuaRBM3wWdnaZQRDqZheu8QnlYff2Joad3Sm3NttqrjPMwqfQ40UiPQLiEuGEQzFY2D0wjoYVvIOwLVqDFt0Tup8XH6NVK0bIqHhiNR8UinfZZKMRKRipm4wTIBINGrZn2+ALCbtD55N7QiG0UtspHQolYhZeM1WI2LlMhep1Rxs7zgNUvlJWipzIBWdKArSiKZV4Fy5EAlSKR2UyPoWUKIOBEGxqFw24kcb8ODKwqQCoUBCxCeSOPivHWK2mVYmpkbM6SkQFFQPlEoyUlGpIFLRHzh+xBRCxXmr5GcXV48ddy75wx0tpOaSnWFaQ7xSQfpTB1KxqYpKAfdIuG6wEUNSIH4ok3oQUj0cXw/flaUuRHn7yNdSUrkC8qsNqdSDLAyRiB5GVBiCfRafVP5SobvUXvG5CpKfl3UvrIOxcrEVyGH0EsBWLdtHh3VUrPy2nQp9Umn07i759ZV1Yu99plxWvrN02fBV7ImUpA9EQqxc4lIhFArrYrJauRvN+4JIBunafR3PXYsQuaPhIBm6IyPDKJWRaamU6zJRRu7Mcx5fYjrRhU9zTMCnOrpiCetaAtjPJZys2xIIxkYujFZmQ1Adckhl9t487dfCpy2GU1gyYmHlLQgrca1U6mzMyoMbslhGgqm18jik4kl/Ri+V+htQMCAW0gBRjRVMHPw3Bj6pGLEwYsEPlumRgh9pgnofI1KpFK+opVTKz14ZkxElddeQl+S/fhx/Xsm54Cd/qyJlZ32M+2SqgHsnWL8f276fqKj9GyKm2iu/0PqOh3H/jBJUABADMQXcYgp64djzRepgWQfXrYPvqg6u/eDmjNw24tWUVC5/dIzUWntc6uLYJPXwfdfj98p1hwfmr01LpXx3qfXR5xpRNQzh57dpU/BdQHhWPCofxUQ2TDPZZK1dBCAZtqoRO4yiDUTTbM0X8pd728Te+0z53s/ulvoLV+ogRk7BoM/p5joiDmKeoS3SG7LoA4xkGMmwHsZgK3l13peA3puPy22J54qfDZRI7eGLZPDOjNTxSmWSjNhxQqdu4LOox+1z5OIwAduJefC9iVpI9OB7gOV0RDgzsJypQDIOjFqeBRTLs/sz0n7aGympVG4zUp7bnafTLJAXlAJZ9LkoixWI5QvzyBAjFQjFSMWIheSSyl2QykOQio1omCq5FbwR+G8MGuCHHAEBuaCANAQUSyP82FlwXep+/LlXKuUSUiH11xyXa1qPjx17tvz0wmpSetp7mq7ZAsV0of7WrJShVH6flkqtlZ9DBiisON5S9xzwIKiN6z6oUsGyCKkYASUx5ya53yOV8wOpxFOmqD5GgTCY5rlSMWLh3yZKl9hPh61qFh1GQZgWYfnPVmNi7302XF9/oHTdlqfjjPQBclxCHD0hCy41PYI0Isygxj5E5VIg/bBdW40SYrn+HPT8tbCupulzy+VBj1TKQirDdp6QUZAAp22wD11LMj6QSjJyMXUuBaFcpu8XSEW8UrGRC1OhZyCVth6pVIJUnt2TFz4rmr1xtZv/F6IYuZiWIcqlBGViSUrlsmJKxVTucomwuljwePwok5JR0UQpVV1GKqn0p4KUn7Ma0rEyMmIirM+4ofsMRCzxL+VM+M1NTaXcgrWmpcQpOHzNAnX/cyvSkUqNPlJz5ZfnVCZ1UZjJg6C2Qy2I7taRHqm0cKXC6IZRjrlGnOg9/FLpJjU+OhJ+FkZexMjFEQv2WZLflW06dzsBGqkEfYKYGoEK096JvffZwGil5jPvx56W0B1SsI+ntcMDrGAM+VrBq5FMTDgWI5zOnxyUC+9OTyN6pnBCqge6TUlLpfMkGbr9ZPjY2NEEUcdoCMQ+gM3OE6PCgRTGIZUJxYJUxmXyIZEpB0WbpA2IYILUyI6Eplhm7jvllUpFpD+zEKnEJofCuvbIRWRiIxaNXo5kz0AqY5ZKPeyvB5koKPwP4Qf+EJcQRpEgYtHjleCHGhOLI5WPckhlNqSC61isVPjDZmpSfekuubHXLDnv3rbaYc89vzD++5cl5bxS7eWOoS9J3bXHTMtMksKkUrOP1IBU3ALrUgfnPnjaQCjAFUphUrms5Ripse44jskHjG7S5xoY9RhKz18jP0xI5c+QSnVHKnGyWtejlc54nZSKhc3mlIrbi5hjn9whAo/uwDkf7pPfnYOu+hY+NqXRG1uDpyXklkoIpKEUIZU+iGJaLtkqvz2HTc2/vaSG/Md349NnPoBIZfCOkzrYUR8XiyWjllEQBiebsqhYHKnYAYwTIA1LLqlMQ2TCliIrFTJ9/ylp45FKBUhl5u7jpuMcpDEPmIilMKmsz0htwKUVTM1PjsmlHqncMXqJpktWPnU3ZSEWsMkRjRKJJFZB6KCC4X6FkY6JYCwPQioXVEpX1JZ9bqUjIfyAFSMou93+J7V1ALalI6oTMET/cYkN85PbEyD9Kf1suk7lAqQ/lEoYISSwKczpYcRQC9dU8FlrYll9S1ZuGvlKSiqXIv2pvjYPx+IfgxKcF5wbvc6G3IdIJSmVPyH9qYL0Jxnl2JRJRQnZ+SqXLfGIxVTskkgwbCli9FIgN3aeGnv/s+Uvd7WUlisOqVS6QQwhKhgLhWNkY+F4JCMbcaTD0dSmToYVvg8/96H88Bw2Nf/bv18be10GkcrAHSd0XJId9EjBJOeJ0SgmiGDcFGkcxGHhEwXSzdEmNdL0CGKxTEX603ram/I/Sam0HiEzdh3TTnM6j4uOK+Is/4bnjwDIRQcoskn5XEjFwPUcUsGP2YeJWrAeSsWIpT6WpLhSqR9gox7F/vfEtgZcxrCSiY4zWKkktyfgf3ePVP4KqVSHVB7Ee7LuI4kRhE8chRFJhTKpic9ZA8vqEHkuqVSDVGriHg2OVHAPaankn6ZUTIWxib7w94M0csG+N+wRnJSKjnnCNtv3ha1FD769U355Zd3YPZwt593URBq9uVW6QgSWM5OKqey1Umm3fM85TYOSWKnwsSVJqbgwinGlYtEnCQRYqahY9lMu7EQHsfiksi8jrYohlTnaYU60w5x5ZAjFwqVpci5RewN+tOvx410X8SBe1/wkTy5t5JHKqDchlQyEYokEYyTjiqWIlEhFkIaCoCyKKxWVVHi+iVgsFExym2mdyca22ZYWLiO5GHQ/CMN/nF9q1sfyP4mKWkql6sqvVAI+bIFmQa+B65wWeM/qSHks1TZl5MYRr8p/JKRyCaRSZc3x2LGUkO+a9n7um5dbKlaI8agLf2ucT7HUw2sFn898P6ykRuQK2FzNyI6V3I0sn2ZjgjF9XRC1QD53DloYu4dzwY/PKydlhy6SjttOaNTCOpZoGgaDK5fkbHWhWECXzcek7IB58tNizK1zNpTpPFkGbj8ZDnTk85CG75MUI7BdIxYsmR7Zuha3MndsIJYJQSc6Q9DXBfApAJYpe09Jy6lveKUyfefxoE8LCCOWfMXUsUR1LSVqbUCIrFLJRlAqK457pXJ7kVIxYrHUgzxyYcUSRiwBNvKoDan81SOVByAVewyJS8VACVAG9YNlCvzYH8aPXDuGAbcpt0ipoKDmlMonkAre34cWYkhOC/lpUp04oqBUbvBKZaxfKh5q4l7IvXPXyA8SUjmvXDep9OERvd/awI24mMaZ+hh8F3gdiYXfD6ViYK9fwr+BRowEsjHjmSAboB3rArnUX3dU/l7z6xnMx0fmVpm8VDrw4fU7OR2DQcUCYXSDUAinZNDJpAJ0eoaVh+S+x2bIzy+If0dfF5eWaid91n8RPYN6bzAPTFIq2KfPo1a5iEYsJmopCBkL9KFqkAnFMgGvJ1AoOI5MwTqZyiWlkiNSeRpSeRbRjHKQTdDBTHNgHgRj4XSWJWqsy0hNsjYjtRyqf3RULmkYn6TpvwKpuGlSkkgw+I8G3KilKJKRTM0PIZWKcan84E8V5P7ZK1HQ4xJJwh84o46UTIiVBcJzL9zngnOsVOpiyY5nJT1S+Uu13lLlky/DCIC46UdNFnCnsEeIgdFIEhRo7qumFChVQRWknDeMeC0llb9DKpXX5IXHFoe75671SKW7VPjwc9wvBIR71NSLnwPfhxJ8pkg2WIdIiKZHDsnvX2WN75mVueznYip0TeRS78OD8pt/NIjdy7mEj4n9e7ku+hzqpst2ShsUXn0ELoTSZXdWOn92UtquPSINXlor9/WdJX9FmnOue9QWhx/+6j65se4T0mD6Mun+8T7pv/WYzgEzDNi6luF7IBWCbSMtjFwgDhO5sElaIBaRcVhOwGvbt2UiZEQmYdsk7GOdyyREOS2mLYFU4v29yrcaIdN2HDM9cR2eO5CR2QczoVwII5cSNSAQF8qFVPsY/zU8UrkNUmH9S21EK3EQ4ahY8MOCVB7ciB8ZqANZJIlFMi4QiUuhUkEhc6OcJKaTl5FBDBSSojqf2XMV/e+Lew3QTmiFSKUypGILINFUg0uFkjCiqIbXIbhfUhUpWVUcUxXHRAQS2UzylcqgEqLE6z2RysXNx0rF1Xmx44viLk+k8kdEKuURqVTDPVTDPfHeY1GOgxWMrRyujc9hYUSjIna+Q/s9257HdqBlI0QuHGtUasJS+c/v3Ry7n/8/hgtuaSp91h0JIph8nWBK610ghuGQynCsM2ph9MK0SOtcIBWVC9YN+dqhTvu5aOTCIQBIiyCVR1Uq8UilHKQyBVLhOCIzloid5tjNH3JBZKKjn0EoleprTwmpFiwJo5eqOaRy68g3pRb214JIYqzPmjQKUtF6moAHkQ4lqUOCVCkmlQSFSUXlAfHkwv1PaWHaouBHbmXhw7Zw2LqDWBMvX6Ow3DtrBaQS76avUln5ZazeoroDC6eB6xCJQ1VQBbIyQAgJVCQOFSmV4WmpXASplF91AscUxI4vjDshle97pFIWUqHkovtOY6MtRjOGLMA/KILvqQZHkyN6cYm+6yzkgkgGMqmvZKUBqPTSRvnpRdVi9/OvDCOZv5ftdE4mmyqKv97cVB5f97mZrgFC4SNjdXY7EFXqMj1yWomCyCUCaZLbJA2YGo3HtZp7pPIApDJhx/FwFDSfvOjO4zLrCOQCYlKhUKqtc6SCSKUq0p9CpaISSeKTiiUtFV061EVBIFYq1SGVv3ikUua5VWckFSsKrseikQSuVFQijlS0YKCw3KORSlwq51djpPJF+N+c6Us1HG8xUQiiEUjCRyXsIxVROEklhXJIU3FjFlJJpz+USrnVJ6Qij0mck4s7kf4kpfIHSOUBSKUK7iEeOSG6wee3xCIuhbLh9iw+P6SC18mmbY32QF18J6QevldNVbFOwVSAVH5+2dc37cC55FeX1pSaM98VTpPZ6NWN8uvLzt2zmn1QKr0QqXDCqYGQAB8ba55HjcgFqZBGLxQMYNRCRmjkYqIXQxZRjO1AZ+pexkEqHBLwiE8qrUfI+J15MhUi4ZQLT2M5HZHNjEAqzxw2zIZwiFcqpMpHX8nFDePjHSKpGIH4SEqlNlIgA/5jBTzIyl2mSkyTIJNQNviBEyuVapDK+RXj3fRDqXhE4pIUCnGlUhhFSaUW/gsbqcTTn/Or9ZFKK74IUxyVigOFYiIRFEzsT8KooSKogP2UCqOTyvg+Km8S7ItTEd/d9cNfT0nlwkfHStk1J3ANHJM4Jxe5pXJY7yGZLlXC57dYIUZRlxULvgOCzxFPkdKRoE2LtHIXUin/Yloq/+9Ht8def9t8/9el5M5uU6X9pmNhJztO6t38vZ1ywT2556Q9WyiVnmuP6EPuOVWmnS6T02QO3kPM40nifVzYUsQ6F9NapFLZy4euZUx6RLFg/2i8bjo1XVF7f6uRMm5HXtjHxUwUBakgMiEqFmBbh0pUW4v/Kh4qf3QMUvFEKiPelJrYX3MdfiwkJhX8aBJEgrHCwXEoEKR2AhPRiDyIHy6p9sHnaamcV0FKP7cyjGrq4jgvKFSWeHNo0fiag0NYMFBQckmlAqQSRR/Bf3aCAlQZy0qbEY3gvn1UwDkWRhmV8X0YUPixrAQ5k4pYrwAp/8MTqVyISOUBRCrlIYvyvGZh4Lrk9jlpqfyeUvngSHhvvI8oZeJnMOtWiFXxPSc/t4WCDdMjRC/8Dkn4nTti4cDLci9ukp8lpPLHe1rLzf3myM8uqRnb/k3z/V/fJ7d3mSwtVx+Wzqzgdega0GHzMbml9ZivpYL3L5TKGkhlt3kONZ9BrWIBRipcmojF1LlQLKaC19a5DN+blREBtscuxcIH2zedskS+l5BKGaQ/lMpkpElkCqIVEqZDh4IZ/1mBi+UZSGUJ0iOEtRAKoVgioYgHuz+iJsRSg3JRyUTieXAjhAJq4cdKckmlFKRio5o6OK4OfuRJvi6paAcyFI5cUim/4suwoBmMVCpjXdMZLYwsoPFogVEFowsLX1MmFkqF0QmpgKiu3IaMXDcsXaeiUlkFqeCc8jinPI7NDY8RuS2HVEpDKhX4viFZiArpGZZ2m4lk8Dlxv/HPHWFat0zUUn0rUucwYrHfOdYdsZT1SOW8ku2k5gf7pcHmU/LAsx/LBRW7p+bn/Tr50+3N5YFhi6XtpqM6DabFfc6RjVhMR7sCafLmVrmscvdzKpfzb2kqPdZ8LgPw3nwGtX24PcXyFN6T2IhFoxZsH4bXisqFksk3YoFETJO06Z07andGmkx50yuVsduPq1B0RDTkwSkWbKc5G7HYwYnnRCoRBR4Y1cSpAaqvxxL/bSkXS038F64FauJHS6rgR/3nhFS+f155ue/ZlbG0yUckHcgKP2z2tTBCgBwAt+XCDdWTaN8OFKy7Z6al8udqvaXcx1+YtCUocJZIJmmhGKlAAAHl8Loc13ENSzmcb+A+gO/rumHp9OdvkEoZRCplw2v4ZGIxUrl1dloqvyvXVUq9f0jK4r0jslKOIH01UHK4d1zDfA77+Qz2s1fDejV8ZxY2rfN71GEDhCLHd8vew2ySfgDpTypSubed1Hj/oNhpGNj9/6G1x6XMjOVyReMh8oM/ntsOaRTWX+9rK6WHLJKmHx0wjyHZIdIxpEA6QiQunXcWAIFYIBWHVp8cksoT3pSravWRP/yjgTZr+96zOJx/cxPpjijpSbzfAAiMDITEFK6DQVgfBIk8FTAkYCgEMxSiIcMgouEE27RZGgxH+tZocjpSKd1ypIz6LC9sjrZTLdj5W+y8LTpAEZy2VG6GVKpjf3VIpFiszxRCUipGLFYqlXJIpSQiFRvN5MKVBIWSlIrdFu0rHlogUDDueuZj+Z5PKh9BKiiwpmBZmRgoDl9dh0Yn2MeCThFQCGVxvMsDeN/7uUThJvdDyNcMS6c/FzQfI6VX5QXH8fhsIZhr3YJI5X88Uim5/JDcz/cKjnPPtVKxYqpgP0fs85nPrZFMUJ/EeiUbtdTA36Nm8DdRsVipLC5EKjjOSsVQII0+M5NG1V97VCovWi8lR78u17efKBdU6C6/vbGJ/O/lD8au5fKLy2vrM7Ivq9lHbu0yVSpPf08av79XH0OiT2UMMBNLibSHNCLMRFMdiEqmANGLSGcUahdKxoimQDvb6UPs+VC17RmpOHxxKpK5s9MkeWzrCemD69lZ7MxcMCRf+iFKiaQSCAXYaRrsBFPcpnJBhEK5mNTIRjCBXDRygVBiUon3UykVSIVN0JzXhZ3n2CvXRiwpqVRZk5GqCaEUKpWR51IqBjZh6xIFpTp+qFYyFZZ/Ln9KSaWC3DsLUsGPvBZ+zD6hkEgYwY/WwZUKe4z65JGEP34Wgho4tzoKyV3PrIBU4q0/f4JUyiJSMYXJFqxILhVAeRJGChZTMEk5YKQiEAlBocb6/bhOGRxbGt8PKYXv6yqmP9+PS+WvzcZIyZXH9Zgy4P5iUJRUyuC9rYCsXJJSiXCiI8i3/OYMPjt+T3it4LWNWMJOf/iM2g8GQqm5NStlIJWfJqTy+5JtpfLyA2G9Sz1IhCOlOQzAjI42vXRNX5dgjFFAOHjxM4uZ18U8rgXrO0jw8HwUVqKTdQcz1YVQMCjo5rnSFs5kFzwpAOdRMh1R0CmXJJ0hBZdOOzJSbsQi+Y+EVO7oNFE6bcvLMU2DgXLpDex8vKQ/trtSMZKBeCAMNz16CinTYDAEEhmK82z0MmRXRhpMTqc/90EqQ7fnaUvRWKRJdtIoO9WC+yD6yUClYnHlkksqN0EqVZG+VF2fXzyQ+yep5gglLRW8f0CF5Ue8Urkb6U8N/NBrorDVRCH1EQoBP9riSMXt2BWe65CUyp05pfI5/lOzBcf+52Z0Ylp0QqFw6RIUSCuTSCoowIBSYcE+XakUC1zzJo9Ufgup3PPBoeB901Ipi79PWZybvOeyON5GV+UCqVTEkt8JYYtRGLXg+2SnP9tSdvpSMWOLcknFYp+vZORiprqkVBTIwkpFxRJIJXyutkMrSiUJjg0fQRJIpQMEkqQjCvPpSkWfP43r9kTBT8sFUsF+C6XineQbMqFU3NaigXuySJGyRi6QCSlMKiUDqZiWonzRznOQiZlqIRKKxUhl9SmpDFy55JbKmyqVahAGI5GqoApenw56viMwJRCLK5/yyw/LeRXiTyJk+nMXIhWNaPADz4URTlHgR4zCTsKKxOA1WyrcbfrDRwHQ+gEUpjtmUirx9Oc8SOX+j1i5CSFSHjlg3Yib2tgCaQoslhsRmWC9DPYZTME2IhClFL7/q4a9Lv+eSH9OWyrgxtlrUlL5Tdlucvf7h73HExvlxGUTpyz2M6KJfX58HhvBVcF3asDvCJIx/Vsyct/iDfKTpFSQ/lRC+lNHm6Hzw0pdM7eL04EulEyUItnJomzkouDYRz7NYj0L0WA9QOd4Ae5EUhZOKNUaYjJwndELH0GSUWwEE0+RgjQJqYrKBUtbydsR6U/ZYYtTUrkd6U/HbSfCdKk76Ilze4HHSCCWMDUCfG3n4rX0w7FPAJsWuTBtMqlTFMUMgsAenpROf+6FVDjzv22OtgMXxxzIyFgwXuUSzOVi058qqzNGKlhaqVSCVC7KIZUq2E+ZVFtLqfjFURR8DwXr1RRGMHgdk8oRSCVdp3LXM0Yq1fHDzUUN/HDTcLvFvoZAgCsQ37azkgrOYV2Ji/mPbklIBdi0419VKmFqhfvKBaWiYnG/C2A75ZlWI2KkwmEKhUvlgHb7Z71LJJV87ZXrThplH3mSnIHODly0UmmqUomEYqUSigXHhfA1aAWhGLhupsNsBaEQSqXtDgmAYCAUgxvBMD2CUEAHSIUtSrmkon1fcB7pgXNVLFjvFUgknOAb6z6p9MXxFIt9qBrTI5siPYntKpUgeilKKoMhFbYUsRna9nEZs59iiSaHcqSCSGM1ct3ViE4C+Lrih8fl4qbxuUP//bs3yvX9F0uVVRRCgULBVF4LKZ02gVxQOBj1EJMuRWIp+9Z++V3J9rF7+MH5leXu59ZItQ0o3BtQyBNURYEjpsWBArDrbIXAj5a5PH7YNqIJjyuCqiD6z4r057lV8r1Ei8Pv7u8ipd87EErFElW+xkn+ZzcSyQH2mwINoeAz3Yfv6rJ+z8v/STw8/oJWE+Xe1Sfkvo0FxebGeevl+3+Ld4v/xT1t5fa39oXHlML3HSerJGXjQrHwc/kjForF1DuxpUw71kHeVZAu3cUHtSUk9/vSHZEO70cqmlUYsRipRHA8EQeEWqkokAmf/mieDBmvawnBfjs7nTv1ZRwIBxi5cJlNQdkwimkDqZjUiJjUqG0gFpd2OKfsqJdTrUE3NB8h7TYe1Wbqrki77HOnGbFYufTEOif17oV9jyGNITZycemDY03EUgDypT+WsYgFKZKt1H0S71XT80iS+9qOlUGfnghaihCtADNBlIlYmApZOCF3CQqkCmUCUVj4utKKk3Jlx5mxi5Pv/G9JuajRSLmm17yAuXLNY3M8cHtRzJNrLY9b5ipXd58lv70rPcv6z656WEot3gYBobCrWOJUQQEg1fBDNUAq+BErgVS4TrEwogn3JahK8MOvyv+iAW6v0nsXb5WfXJ5+tMRvSraTK3rOkqt6z5Or+hiuUOaHXB4yL8ZlIfNTXIrrWS7B9/TnRiPkPxE5Jt//773myL2Qdkl8F8Xl5pc+kx9fkx4Z/L93tJKLuj8rl/Sej/fEPeB9I+biXkh0X0kuJ7j3K7BU8NksVwL7/VwNriF98dk7TpEfX5ru6v6X6n2k8iefB1JBtMI0aKuJVqKoRRCxmBHQOgpa4WBFisWpY8G2EOxzn2fNuV1CkeB8BeeEUsG6eSoARJKA0UuUHvFpAax3CZ7MiMLfjiJxwfaq09/T3rnJz3tlrT5y3xNzpPST85QyAfeDB8gAsyxLBsxVymGbS3nsK//kfKkwYL5UxGtLJbwOGWiojPU7W4yUH/yyZOpeKvWeJYMRVQ2DVIZDKOzfMpIwaoFUooGKBTIOlGBkUmlVJo5KJiO3Tnhf/vvXZVJv8m3yp8qPS7n3jkQVwRrdRFQJsBFLVQhGBeFQJcC3z91verMGrRYWCIU8gNTsD+W7e+/x2+K7fygn1037WO5dVyD3rpcIfB9egv13Lv9Cfl/jCe81/1W49rHn8Pc9GdaBaUU7pKLDKJD+6JQLVi4QAeWiU1xAHHbOXKZDLm6dCx9ez8fZ2oelRU+ztGQhGD7elc8zMi1HSVriPNJKMY8hKbzlCPf21g75401NvJ/5X4Gf/uEBeeS5D2TwbtMMbZqiM5BL1nSg28eIhRW4BrYQlai4OiMVIZAYFA0o++7ncn6N/t43+zb43u8ekFvGv6PpUxXIREHh8BGTCsJvKwuuG2FwiahGifYRIxDTNZ3rtknYhT1bbxj7lnwn8RD3b5M/1H1Kbv/gK7kbUVwMfB93I1UxSwe7f12+XD15uUrJd91vm1/e0kzKvLFdqm3Jht397VSZttMcx2QZuRRIHciB8+eaKRYK5GFI42EUdK3AdbAPv9f5XLAksXoXC47TR+VCJiZqMQ/yt4SSwTKqh2F9i613MWKJtRoFtN56Su7uM1ufqOn77N82N9cfIH3Wfxnv47I7A7FklWFaeWsHKhYgcoFUKkAqSSiVimsM976wTX5169f/BPyi+L/fvVGu6PqMlFtxTCqtg/TWI5pCwUiSlEq1YBnJI979PcLs8+2P+pqYjl3apR6wO/ylnaen6jW+DX5+Z2u58eUdchckkSYrd0Eqd0HCvv13Ilq5feVJuRCpLL9n3/W/LVi3ctvTy/F3QFquLURIT4FWqAdiMeRLLUilFgq3HfxpUiI2PUMuKORsIbIkW4ps5NIYQiBWLkncZmmLigXXCyWDdWLqX5AWMTVKRi5WNKDZys/lmgaDvJ//2+Siu1tK+2Wf6hijQazIJRAJm6LDqGUvR0HH584tUW7VKUlSHmJxKfXqbjm/+rcXHn//TxXl+iGvSIWVeaFQVCooJJUgkIoO3Ea0bmUDohTA9cqgEqILMygPogjha3efA4QSjXvB9bHUnq8E+7RvyZqTcu3gl1OVtt8kv68zSG5asl/lEAfCwOe/A98LuVMx25TE8bevycilI96U7/31658XpDj88rYWcuf8dSoUTTshFQ7MJByoyFnrTN8iIxjt56JRC4AsmA5pSgRZaN+WADNJl4EVu2H9S9hT1/TSjYFtlI2NXhi1WJpBICGQR3OmScB9KmNLYNKiOK2xnTRf+6Xc3mP6NzqeqTBueOhJ6fThXum/K1+0A50DxxpRME9RLJDK0H2i0y2YKRdySiUuFqZCFT7KkztmrJRr+y6Uq3vNk6t7zs3JVfiPdxWOIVGFruHqx7A9gOuFcU2f+XLDiDek9Jt7IBPcRyATl4oE/4UtdnsYsQQpEqMYIw4CmWwICIWSBALBcW4rDolaMJxepDj2nqV75bpRb8oVfRdo5aQlqnw1xCozH58rl/Qm8+I8bipG/9474mK8VrB+UcDfn1ws185eK7evPpkSRIhKpUBud2ViSRx7O76P2yGiG5bul0tHLpUL+yyQC/GeEfMKIb7/ImDv2XyGeSH2c/I7uAy4ldVX4vu76omFctOU5VLm4y8DoeNvalNPyISwBY4jok1Tv41cIBiIghGLTYdsK5GLr8XIzkcc1bWYjnQRTI+clMjBrXchzbcZbMSiUUsOqbTS7WyWpngyUveNLVJ6xItyz5Nz5Z7+c+ReZa7c++Q8LOdJSXAf1u/D/lIx5oXYSl3DXHkgRlC5C8pxOSCi3MB5UmXoImn6wlp5bOtJ6ZerxYhN0VjawYucQ9edpLtEuU8gkoDyKyERhwqrIBNQcRX+S+eE+1kXg2NXo+CB8kpWqYQUymJTqgprsQ9UWIsfCPL5FGtR2IlvX4KKCez2yigclkqgIgpRhQCuV0QBMtjXuPdgvwuFwe7ohihCsZSDeCxlATuuKdh3P5YupXE92yRrmmrzAwqkJME9sDXmXtwXuSfgbpx7F5Z3qSQCkkLICYSSE9/xhWHPyw/Xk/dhoyNylxJ9DgWf13xOfu6slMJr9nmxaBM0vjvtretInEMcKmyO5MLIxfRvoVxs5AK5QCJMh9gL2k6xwKc7Enckel1gJ+y2dS/s76L9XAhEEAPb9HEjAU3wOokRSxS18HlG5FFs5/OkWyLNimBnOogE6ZF9BCxJpkdtQ0Ta4bx2OK890qoOOLYjziOdsO7SBceH4HW3nVnptiMr3YGOO9pZID0D2CTt0hfbXDjOyIrFwsiFcmHHuWjKBTO2iNMtlCi3AkIJKP8JZYICH1DBK5EkkVTK47URComiHMJ6mgoUCihPAqlU9ILCrvj2FY9K6yATgh95RaCCCOA6t8VAlGP3J3GlwrE5calwv6EsuB8FJxcxqRAcb6FU7kVhNUSF8G7AgpkUyR3r4tyGz3Bm4FyenwvuT52T1SVF495TCD6bCz9DJBbzGa1UiK9vix0MqaOigenbgt8Z1onWgVEskIqBUuF4okgqFjtthSsVFcuWSCwmcokeK+KDYtGIBdeyz/B2iSIWA5ulmwN9QD1ogfUQrW9hvYvp41KoVCCStjiHqFRULOw8B6kgyumE9U472O3f0AXXjjB9XboFdAeUiqUnhEM4HID0wX6LimVXVvphu4tKBkLR+VxiUgHnRioRVirlipJKEKmoWIJtcVDwgU8WxaVQqfA1opkk5fBjdymLH34KFP6YSMJ9iE5AGVw7F+wFy05r92G9JAofiQobBILtSTQ6cbgDxxEW6HRhT2LEcCu4JVjeCll7CY5Jciu+w1vx3aQIzolHMhYb0TjRTCAYlQy2kZKKQLLEyLYM1ingMvhuowGRGRWMHchYHrCOi3PMuFNMsC8ROypG48IAJBMTDHBHsD8IsZjIBakRohzTQ5dyccB2fQoAjtOpF+wSkiGNsI+YiEWkKcExj1A0oBkJxGJA5IK0xyXssQthuLTBsa0B17lsgwioDY6nbNphSTRyCWEEE0HhqFgIju2GY7oh6rH0gIRcyfTGNtJnBymIScbSD9uf2Clh1GKmWjBRC6e3LLZUuB5FIWl0f3CMKxWfNL4xqeBHayMRVyrl8ZrSKI/CUZhUHoAskpTF+Ump3K8EhQHXdikNwugE1yQsTLaPSGFSsS0zMZkE+COIJEYqlMPNFERSJAFWIDwmSaFSAf73jZNLKvzMTPPuI/guSSmmiYrpQeyTio1cOIGU25fISiUa/UxMXUsqeoFQiE8q9mFoFp2cG/v56BfWu7BC14jFPDq3Ec5TgkiGQlG4DlQsWDJqMZFLvEma5JJKDBVMJBUTxUAsOC/q+5KFZLJhFKNiwXZGLV1xjaRU7DAAi5WKgvN6QyJJ+gZS0ToXiESnXuDSSuX+FSfF8sAnp6SsQzmI5WxxxVM2gZGPHyMW/EfyCKMwXEkQiiMpi1AuReDKI5IIQnMKBgXFisTFKxNsJyWBTyaWSCZRZGJhBOAWVG9BpwAcWVhyCSPJTXiPm4mzLZSK57rEvadcWBEaIrncBXncA+z3Q5JSsXCowv2b8ZtypYJttqt/WM8CUVhSckGht0SSMakRn12kaRHWk5W5Flup61bsmjqY6Nnc7vO53dRI62JQqC1h3xdbuYt1t2LX0jIgLhgzoJHN0aFcHBi5UCwqF0iAc70kCVMl7NehAAH6cLUAM5AxelrjYzuNVDjPi61v4cjovnuxDqHo/C54fVpSeWBVbsqC5PEkKRKXr1sqPqEo+EFTED6RuCSFQhiZGKlE9Sd2kB9JSoV1J5SJCgX4ZGKx0YmVyh0gLIxYN4WUSxRoFvQUZyYVyiQkse+WIqVSNEmpELZIUSqshL7XoeQmM7YpJRVEJJSKiVjwtw2kYvoNcYnoFOLgtJ0qFWzTeXMhCp1iAZGEfVRKPHKJpKJiwXqytShCop66IaZil2kQ111MK1KEKxXT7yWSiu3z4hNLC+CTSrL+xcKIpS0iFmIjl6RgrFTsVJihVBixUCpYFiYVM4FUNO0C4cRRT+L11y4VJXGshdt9QiHFlYorkSS5pFIWUAyxbYEsuLTbVB5J1mflfoJrW4FoRILCQ0pjOykFTKrDikmT7tyDpUYjKKw+7lyL/+DgDhRkcjtI/te3lacs6LeAm4NlUioxkeD1TWtygH034rwQvP9NxeRm4r5PglA8WDeCiT4HJUlxUqCRWJESQSD3Qij3bTADFpMDF90pF9hKZCrM8beGcGzrkEmJBGKJz5trZ/vXqAXYLv9uWhRGLIppko5AxILtDwHzJEymRLmJxGP7wFA0lkA02K6VvC4axTgVvsCtj3FHTZNoaADJagRjBcP1sO4F+03LkYRSSaLTYQaSYauRrcDVeV0gqMcgp8ex73EcYzGDF21Fblb+P72B8yLYPW7LAAAAAElFTkSuQmCC'; // Replace with your base64 image

        // Add the header and footer to the first page
    const addHeaderFooter = (doc) => {
        const headerText = 'MI & I Refrigeration and Airconditioning Services';
        const footerText = 'Budgetwise Free Installation';
        
        doc.setFontSize(15);

        // Add image logo
        doc.addImage(logoBase64, 'PNG', 10, 10, 35, 15); // Adjust image position and size

        // Add header text
        doc.text(headerText, 50, 20); // Adjust text position

        // Add footer text
        doc.text(footerText, 10, doc.internal.pageSize.height - 10); // Footer at bottom-left corner
    };

    // Add the header and footer to the first page
    addHeaderFooter(doc);

    // Add the table to the document
    doc.autoTable({
        head: [headers],
        body: rows,
        startY: 30, // Adjust starting Y position to avoid overlap with header
        margin: { top: 30, bottom: 30, left: 15, right: 15 }, // Ensure space for footer and margins
        styles: { 
            fontSize: 8, // Adjust font size to fit content
            cellPadding: 2, // Adjust cell padding to fit content
            overflow: 'linebreak', // Ensure text wraps within cells
            halign: 'left', // Align text to the left
            valign: 'middle', // Align text vertically to the middle
            textColor: [0, 0, 0] // Black text color for readability
        },
        theme: 'striped', // Add striped rows for better readability
        columnStyles: { 
            0: { halign: 'center' } // Center alignment for first column as an example
        },
        didDrawPage: function (data) {
            // Add header and footer on every page
            addHeaderFooter(doc);
        },
        pageBreak: 'auto', // Automatically handle page breaks
        tableWidth: 'auto', // Adjust table width to fit content
        cellWidth: 'auto', // Automatically adjust cell width
        styles: {
            cellPadding: 2,
            fontSize: 7,
            overflow: 'linebreak',
            halign: 'left',
            valign: 'middle',
        }
    });

    // Save the PDF
    doc.save('data.pdf');
}

openTab('input');

// Function to show suggestions based on input field
function showSuggestions(fieldId) {
    const input = document.getElementById(fieldId);
    const suggestionsContainer = document.getElementById(fieldId + 'Suggestions');
    const allData = JSON.parse(localStorage.getItem('data')) || [];

    if (input.value === '') {
        suggestionsContainer.innerHTML = '';
        return;
    }

    const suggestions = allData.map(item => item[fieldId])
        .filter((value, index, self) => self.indexOf(value) === index) // Unique values
        .filter(value => value.toLowerCase().includes(input.value.toLowerCase()));

    suggestionsContainer.innerHTML = suggestions.map(suggestion => 
        `<div class="suggestion" onclick="selectSuggestion('${fieldId}', '${suggestion}')">${suggestion}</div>`
    ).join('');
}

// Function to select a suggestion from the list
function selectSuggestion(fieldId, suggestion) {
    document.getElementById(fieldId).value = suggestion;
    document.getElementById(fieldId + 'Suggestions').innerHTML = '';
}