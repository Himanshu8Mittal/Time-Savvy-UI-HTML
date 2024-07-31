function handleLogout() {
    localStorage.removeItem('logged_in');
    localStorage.removeItem('indxx_id');
    localStorage.removeItem('employee_data');

    document.getElementById('login-box').style.display = 'flex';
    document.getElementById('bg').style.display = 'flex';
    document.getElementById('features').style.display = 'flex';
    document.getElementById('footer').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
}
document.addEventListener("DOMContentLoaded", function () {
    const FASTAPI_URL = "http://127.0.0.1:8000";
    const featureButton = document.querySelector(".btn-features");
    const feadbackButton = document.querySelector(".btn-feadback");
    const featureSection = document.querySelector(".features-section");
    const feadbackSection = document.querySelector(".feedback-section");
    const featureBoxes = document.querySelectorAll(".feature-box");
    const navEventListeners = {};

    // Function to add the show class
    const showFeatureBoxes = () => featureBoxes.forEach(box => box.classList.add("show"));

    // Event listener for the features button
    featureButton.addEventListener("click", function () {
        featureSection.scrollIntoView({ behavior: "smooth" });
        setTimeout(showFeatureBoxes, 10); // Adjust delay as needed
    });
    feadbackButton.addEventListener("click", function () {
        feadbackSection.scrollIntoView({ behavior: "smooth" });
    });

    // Intersection Observer to detect when feature boxes come into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    }, { threshold: 0.1 });

    featureBoxes.forEach(box => observer.observe(box));
    const loginbutton = document.getElementById('loginForm');
    const newLoginButton = loginbutton.cloneNode(true);
    loginbutton.parentNode.replaceChild(newLoginButton, loginbutton);

    newLoginButton.addEventListener('submit', function (e) {
        e.preventDefault();
        const indxxIdInput = document.getElementById("indxxId").value;
        if (indxxIdInput) {
            handleLogin(indxxIdInput);
        } else {
            alert("Please enter your Indxx ID.");
        }
    });

    function handleLogin(indxxId) {
        fetch(`http://127.0.0.1:8000/users/${indxxId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })
            .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok'))
            .then(data => {
                if (data.indxx_id && data.indxx_id !== "NA") {
                    localStorage.setItem("logged_in", true);
                    localStorage.setItem("indxx_id", indxxId);
                    localStorage.setItem("employee_data", JSON.stringify(data));
                    showSecondPage(data);
                } else {
                    alert("Please enter a valid Indxx ID");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("An error occurred. Please try again later.");
            });
    }

    function showSecondPage(employeeData) {
        toggleVisibility(['login-box', 'bg', 'features','footer'], 'none');
        toggleVisibility(['main-content', 'sidebar'], 'flex');
        setActiveTab('profile-btn');
        showProfilePage(employeeData);
        setUpNavButtons(employeeData);
    }

    function toggleVisibility(ids, display) {
        ids.forEach(id => document.getElementById(id).style.display = display);
    }

    function setActiveTab(activeId) {
        const tabs = ['profile-btn', 'timesheet-btn', 'fetch-timesheet-btn', 'comp-off-btn', 'admin-panel-btn'];
        tabs.forEach(tab => document.getElementById(tab).classList.remove('active'));
        document.getElementById(activeId).classList.add('active');
    }

    function setUpNavButtons(empData) {
        const navConfig = [
            { id: 'profile-btn', callback: () => showProfilePage(empData) },
            { id: 'timesheet-btn', callback: () => showTimesheet(empData) },
            { id: 'fetch-timesheet-btn', callback: () => showDownloads(empData) },
            { id: 'comp-off-btn', callback: () => showCompOff(empData) },
            { id: 'admin-panel-btn', callback: () => showAdminPanel(empData) }
        ];

        navConfig.forEach(nav => {
            const button = document.getElementById(nav.id);

            // Remove the existing event listener if it exists
            if (navEventListeners[nav.id]) {
                button.removeEventListener('click', navEventListeners[nav.id]);
            }

            // Define the new event listener function
            const eventListener = function () {
                setActiveTab(nav.id);
                nav.callback();
            };

            // Save the event listener function to the object
            navEventListeners[nav.id] = eventListener;

            // Add the new event listener
            button.addEventListener('click', eventListener);
        });
    }


    function showProfilePage(empData) {
        toggleVisibility(['profile'], 'flex');
        toggleVisibility(['time_sheet', 'admin_panel', 'comp_off', 'fetch_time_sheet'], 'none');
        document.getElementById('sidebar').style.height = 'calc(100vh - 68px)';
        document.getElementById('employee-name').innerText = `${empData.first_name} ${empData.last_name}`;
        document.getElementById('codes').innerText = `Indxx ID: ${empData.indxx_id}   HR Code: ${empData.hr_code}`;
        document.getElementById('project-details').innerText = `Currently working in ${empData.project_code.project_code} ${empData.project_name.project_name}`;
        document.getElementById('dept').innerText = empData.department.department;
        document.getElementById('mgr').innerText = `Manager: ${empData.manager.manager}`;
        document.getElementById('lev').innerText = empData.level.level;
        document.getElementById('date').innerText = empData.start_date;
    }

    function showTimesheet(empData) {
        toggleVisibility(['profile', 'fetch_time_sheet', 'admin_panel', 'comp_off', 'save'], 'none');
        fetch(`http://127.0.0.1:8000/get_time_window/`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.status == 'Unfreeze') {
                    toggleVisibility(['time_sheet'], 'block');
                }
                else {
                    toggleVisibility(['time_sheet'], 'none');
                    alert("Timesheet Filling Window is Over");
                }
            });
        document.getElementById('sidebar').style.height = 'calc(100vh - 68px)';
        const grid = document.getElementById('grid');
        grid.innerHTML = ''; // Clear previous timesheet data
        const generateButton = document.getElementById('generate');
        const newGenerateButton = generateButton.cloneNode(true);
        generateButton.parentNode.replaceChild(newGenerateButton, generateButton);
        newGenerateButton.addEventListener('click', function () {
            const year = document.getElementById('year').value;
            const monthIndex = document.getElementById('month').selectedIndex + 1;
            const userProfile = { indxx_id: empData.indxx_id };
            document.getElementById('sidebar').style.height = 'calc(285vh - 68px)';
            fetch(`http://127.0.0.1:8000/time_sheet_data?indxx_id=${userProfile.indxx_id}&month=${monthIndex}&year=${year}`)
                .then(response => response.json())
                .then(data => {
                    const df_ts = data.data.map((row, index) => ({
                        day_of_month: index + 1,
                        IN: '10:00',
                        OUT: '19:00',
                        work_description: row['work_description'],
                        status: row['status']
                    }));

                    grid.innerHTML = createTimesheetTable(df_ts);
                    document.getElementById('save').style.display = 'block';
                })
                .catch(error => console.error('Error:', error));

            setUpSaveButton(empData);

        });
    }

    function createTimesheetTable(data) {
        let tableHTML = '<table><tr><th>Day of month</th><th>IN</th><th>OUT</th><th>Work Description</th><th>Status</th></tr>';
        data.forEach(row => {
            tableHTML += `<tr>
                <td>${row.day_of_month}</td>
                <td>${row.IN}</td>
                <td>${row.OUT}</td>
                <td contenteditable>${row.work_description}</td>
                <td>${row.status}</td>
            </tr>`;
        });
        tableHTML += '</table>';
        return tableHTML;
    }

    function setUpSaveButton(empData) {
        const saveButton = document.getElementById('save');
        const newSaveButton = saveButton.cloneNode(true);
        saveButton.parentNode.replaceChild(newSaveButton, saveButton);
        newSaveButton.addEventListener('click', function () {
            const table = document.querySelector('table');
            const rows = Array.from(table.querySelectorAll('tr')).slice(1);

            const df_ts = rows.map(row => {
                const cells = row.querySelectorAll('td');
                let workDescription = cells[3].innerText;
                const status = cells[4].innerText;

                // If there is something written in the status cell, clear the work description cell
                if (status.trim() !== "") {
                    workDescription = "";
                }
                return {
                    day_of_month: cells[0].innerText,
                    IN: cells[1].innerText,
                    OUT: cells[2].innerText,
                    work_description: workDescription,
                    status: status,
                    indxx_id: empData.indxx_id,
                };
            });

            fetch('http://127.0.0.1:8000/add_timesheet/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(df_ts),
            })
                .then(response => {
                    if (response.ok) {
                        alert('Timesheet saved successfully');
                    } else {
                        alert('Failed to save timesheet');
                    }
                })
                .catch(error => console.error('Error:', error));
        });
    }

    function showDownloads(empData) {
        toggleVisibility(['profile', 'time_sheet', 'admin_panel', 'comp_off'], 'none');
        toggleVisibility(['fetch_time_sheet'], 'block');
        document.getElementById('sidebar').style.height = 'calc(100vh - 68px)';

        const downloadButton = document.getElementById('fetch');
        downloadButton.addEventListener('click', function () {
            const year = document.getElementById('year_fetch').value;
            const monthIndex = document.getElementById('month_fetch').selectedIndex + 1;
            const userProfile = { indxx_id: empData.indxx_id };
            document.getElementById('sidebar').style.height = 'calc(275vh - 68px)';

            fetch(`http://127.0.0.1:8000/time_sheet_data?indxx_id=${userProfile.indxx_id}&month=${monthIndex}&year=${year}`)
                .then(response => response.json())
                .then(data => {
                    const df_ts = data.data.map((row, index) => ({
                        day_of_month: index + 1,
                        IN: '10:00',
                        OUT: '19:00',
                        work_description: row['work_description'],
                        status: row['status']
                    }));

                    let tableHTML = '<table><tr><th>Day of month</th><th>IN</th><th>OUT</th><th>Work Description</th><th>Status</th></tr>';
                    df_ts.forEach(row => {
                        tableHTML += `<tr>
                            <td>${row.day_of_month}</td>
                            <td>${row.IN}</td>
                            <td>${row.OUT}</td>
                            <td>${row.work_description}</td>
                            <td>${row.status}</td>
                        </tr>`;
                    });
                    tableHTML += '</table>';
                    document.getElementById('grid_fetch').innerHTML = tableHTML;
                    document.getElementById('fetch_time_sheet').style.height = 'auto';
                    const rows = Array.from(document.getElementById('grid_fetch').querySelectorAll('tr'));
                    const csvContent = rows.map(row => {
                        const cells = Array.from(row.querySelectorAll('td, th'));
                        return cells.map(cell => `"${cell.textContent}"`).join(',');
                    }).join('\n');

                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Timesheet_user_${userProfile.indxx_id}_month-${monthIndex}_year-${year}.csv`;

                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                })
                .catch(error => console.error('Error:', error));
        });
    }

    function showCompOff(empData) {
        toggleVisibility(['profile', 'time_sheet', 'admin_panel', 'fetch_time_sheet'], 'none');
        toggleVisibility(['comp_off'], 'block');
        document.getElementById('sidebar').style.height = 'calc(100vh - 68px)';
        document.getElementById("from_date").innerHTML = ''
        document.getElementById("to_date").innerHTML = ''
        const submitButton = document.getElementById("submit_button");
        var indxxId;
        if (empData.role == null || !empData.role.is_admin) {
            document.getElementById('ind').style.display = 'none';
        }
        else {
            document.getElementById('ind').style.display = 'block';
        }

        submitButton.addEventListener("click", function () {
            const fromDate = document.getElementById("from_date").value;
            const toDate = document.getElementById("to_date").value;
            const transactionStatus = document.getElementById("transaction_status").value;
            if (empData.role == null || !empData.role.is_admin) {
                indxxId = empData.indxx_id
            }
            else {
                indxxId = document.getElementById("indxx_id_compoff").value;
                if (!indxxId) {
                    alert("Please enter Indxx ID")
                }
            }
            if (fromDate > toDate) {
                alert("'From date' should be less than 'To date'")
            }

            fetch("http://127.0.0.1:8000/comp_off", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    indxx_id: indxxId,
                    from_date: fromDate,
                    to_date: toDate,
                    transaction_status: transactionStatus,
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.detail === "Comp Off data added successfully") {
                        alert("Comp Off data added successfully");
                    } else {
                        alert("Sorry! Comp Off data not added successfully");
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                    alert("An error occurred while submitting the data");
                });
        });
    }

    function showAdminPanel(empData) {
        toggleVisibility(['profile', 'time_sheet', 'fetch_time_sheet', 'comp_off'], 'none');
        toggleVisibility(['admin_panel'], 'block');
        const subnavEventListeners = {};
        document.getElementById('sidebar').style.height = 'calc(100vh - 68px)';
        if (empData.role == null || !empData.role.is_admin) {
            document.getElementById('admin_panel').style.display = 'none';
            alert("You are not authorized for Admin Panel Features!")
        }
        else {
            document.getElementById('admin_panel').style.display = 'block';
            // toggleVisibility(['time_sheet_status', 'edit_time_sheet', 'upload_download','stoxx_sheet', 'role_allocation'], 'none');
            setSubActiveTab('timesheet_status-btn');
            showTimesheetStatus(empData);
            setUpSubNavButtons(empData);
            function setSubActiveTab(activeId) {
                const subtabs = ['timesheet_status-btn', 'edit_timesheet-btn', 'stoxx_sheet-btn', 'upload_download-btn', 'role_allocation-btn'];
                subtabs.forEach(tab => document.getElementById(tab).classList.remove('tab-link-active'));
                document.getElementById(activeId).classList.add('tab-link-active');
            }
            function setUpSubNavButtons(empData) {
                const subnavConfig = [
                    { id: 'timesheet_status-btn', callback: showTimesheetStatus.bind(null, empData) },
                    { id: 'edit_timesheet-btn', callback: editTimesheet },
                    { id: 'stoxx_sheet-btn', callback: showStoxxSheet },
                    { id: 'upload_download-btn', callback: UploadDownload },
                    { id: 'role_allocation-btn', callback: createRole.bind(null, empData) }
                ];

                subnavConfig.forEach(nav => {
                    const button = document.getElementById(nav.id);

                    // Remove the existing event listener if it exists
                    if (subnavEventListeners[nav.id]) {
                        button.removeEventListener('click', subnavEventListeners[nav.id]);
                    }

                    // Define the new event listener function
                    const eventListener = function () {
                        setSubActiveTab(nav.id);
                        nav.callback();
                    };

                    // Save the event listener function to the object
                    subnavEventListeners[nav.id] = eventListener;

                    // Add the new event listener
                    button.addEventListener('click', eventListener);
                });
            }
            function showTimesheetStatus(empData) {
                toggleVisibility(['stoxx_sheet', 'edit_timesheet', 'upload_download', 'role_allocation'], 'none');
                toggleVisibility(['timesheet_status'], 'block');
                const freezeBtn = document.getElementById("freeze-btn");
                const newFreezeButton = freezeBtn.cloneNode(true);
                freezeBtn.parentNode.replaceChild(newFreezeButton, freezeBtn);
                const unfreezeBtn = document.getElementById("unfreeze-btn");
                const newUnfreezeButton = unfreezeBtn.cloneNode(true);
                unfreezeBtn.parentNode.replaceChild(newUnfreezeButton, unfreezeBtn);
                const statusMsg = document.getElementById("status-msg");
                const fetchDataBtn = document.getElementById("fetch-data-btn");
                const newfetchDataButton = fetchDataBtn.cloneNode(true);
                fetchDataBtn.parentNode.replaceChild(newfetchDataButton, fetchDataBtn);
                const projectCodesSelect = document.getElementById("project-names");
                const chartContainer = document.getElementById("chart-container");
                const tablesContainer = document.getElementById("tables-container");

                function updateStatus(status) {
                    statusMsg.textContent = `Current status of timesheet: ${status}`;
                }

                newFreezeButton.addEventListener("click", function () {
                    const payld = { super_user_id: empData.indxx_id, freeze: true, unfreeze: false };
                    fetch("http://127.0.0.1:8000/create_time_window/", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payld)
                    }).then(response => {
                        if (response.status === 200) {
                            updateStatus("Freezed");
                        } else {
                            updateStatus("Error");
                        }
                    });
                });

                newUnfreezeButton.addEventListener("click", function () {
                    const pyld = { super_user_id: empData.indxx_id, freeze: false, unfreeze: true };
                    fetch("http://127.0.0.1:8000/create_time_window/", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(pyld)
                    }).then(response => {
                        if (response.status === 200) {
                            updateStatus("Unfreezed");
                        } else {
                            updateStatus("Error");
                        }
                    });
                });
                projectCodesSelect.innerHTML = '';
                tablesContainer.innerHTML = "";
                chartContainer.innerHTML = "";
                fetch('http://127.0.0.1:8000/project_names/')
                    .then(response => response.json())
                    .then(data => {
                        data.forEach(code => {
                            const option = document.createElement("option");
                            option.value = code;
                            option.textContent = code;
                            projectCodesSelect.appendChild(option);
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching project codes:', error);
                    });
                document.getElementById('select-all-ts').addEventListener('change', function () {
                    const isChecked = this.checked;
                    const options = document.querySelectorAll('#project-names option');
                    options.forEach(option => {
                        option.selected = isChecked;
                    });
                });
                newfetchDataButton.addEventListener("click", function () {
                    tablesContainer.innerHTML = "";
                    const sh = document.getElementById("timesheet_status").scrollHeight;
                    const vh = window.innerHeight;
                    document.getElementById("sidebar").style.height = `760vh`;
                    const selectedOptions = Array.from(projectCodesSelect.selectedOptions).map(option => option.value);
                    if (selectedOptions.length === 0) {
                        alert("Please select at least one project.");
                        return;
                    }
                    const data = { project_names_list: selectedOptions };
                    function getInnerDictLength(data, key) {
                        return data && data[key] ? Object.keys(data[key]).length : 0;
                    }
                    fetch("http://127.0.0.1:8000/timesheet_status", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(data)
                    })
                        .then(response => response.json()).then(data => {
                            const notStartedData = data.not_started_data;
                            const incompleteData = data.incomplete_data;
                            const completeData = data.complete_data;

                            const labels = ["Completed", "In Progress", "Not Started"];
                            const values = [
                                getInnerDictLength(completeData, 'indxx_id'),
                                getInnerDictLength(incompleteData, 'indxx_id'),
                                getInnerDictLength(notStartedData, 'indxx_id')
                            ];
                            const totalCount = values.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
                            // const totalCount = Object.keys(completeData.indxx_id).length + Object.keys(incompleteData.indxx_id).length + Object.keys(notStartedData.indxx_id).length;
                            const colors = ['#4bb845', '#fb9900', '#f03c59'];

                            const fig = {
                                data: [{
                                    type: "pie",
                                    labels: labels,
                                    values: values,
                                    hole: .6,
                                    textinfo: "label+value",
                                    marker: {
                                        colors: colors
                                    }
                                }],
                                layout: {
                                    annotations: [{
                                        text: `Total: ${totalCount}`,
                                        x: 0.5,
                                        y: 0.5,
                                        font: { size: 20 },
                                        showarrow: false
                                    }],
                                    showlegend: true,
                                    plot_bgcolor: "rgba(225,225,225,0.7)",
                                    title: 'Timesheet Status Distribution',
                                }
                            };
                            Plotly.newPlot("chart-container", fig);
                            // Clear previous tables

                            // Add new tables
                            function createSubTable(data, title) {
                                if (data.indxx_id == null || Object.keys(data.indxx_id).length === 0) {
                                    tablesContainer.innerHTML += `<h3>${title}</h3><p>No data available</p>`;
                                    return;
                                }
                                const rows = Object.keys(data.indxx_id).map(key => ({
                                    "Indxx ID": data.indxx_id[key],
                                    "Name": data.name[key]
                                }));
                                const table = document.createElement("table");
                                table.classList.add("table");

                                const thead = document.createElement("thead");
                                thead.innerHTML = `<tr><th>Indxx ID</th><th>Name</th></tr>`;
                                table.appendChild(thead);

                                const tbody = document.createElement("tbody");
                                rows.forEach((row) => {
                                    const tr = document.createElement("tr");
                                    tr.innerHTML = `<td>${row["Indxx ID"]}</td><td>${row.Name}</td>`;
                                    tbody.appendChild(tr);
                                });
                                table.appendChild(tbody);

                                tablesContainer.innerHTML += `<h3>${title}</h3>`;
                                tablesContainer.appendChild(table);
                            }

                            createSubTable(notStartedData, "Employees who have not yet started filling timesheet");
                            createSubTable(incompleteData, "Employees with timesheet in progress");
                            createSubTable(completeData, "Employees who have filled timesheet completely");
                        });
                });
            }
            function editTimesheet() {
                toggleVisibility(['stoxx_sheet', 'timesheet_status', 'upload_download', 'role_allocation', 'save_edit'], 'none');
                toggleVisibility(['edit_timesheet'], 'block');
                const grid = document.getElementById('grid_edit');
                grid.innerHTML = '';
                const generateButton = document.getElementById('generate_edit');
                const newGenerateButton = generateButton.cloneNode(true);
                generateButton.parentNode.replaceChild(newGenerateButton, generateButton);
                newGenerateButton.addEventListener('click', function () {
                    const indxxId = document.getElementById('indxx_id_edit').value;
                    const year = document.getElementById('year_edit').value;
                    const monthIndex = document.getElementById('month_edit').selectedIndex + 1;
                    document.getElementById('sidebar').style.height = 'calc(305vh - 68px)';

                    if (!indxxId) {
                        alert("Please enter an Indxx ID");
                        return;
                    }
                    fetch(`http://127.0.0.1:8000/time_sheet_data?indxx_id=${indxxId}&month=${monthIndex}&year=${year}`)
                        .then(response => response.json())
                        .then(data => {
                            const df_ts = data.data.map((row, index) => ({
                                day_of_month: index + 1,
                                IN: '10:00',
                                OUT: '19:00',
                                work_description: row['work_description'],
                                status: row['status']
                            }));

                            grid.innerHTML = createEditTimesheetTable(df_ts);
                            document.getElementById('save_edit').style.display = 'block';
                        })
                        .catch(error => console.error('Error:', error));

                    setUpEditSaveButton(empData);
                });
            }
            function createEditTimesheetTable(data) {
                let tableHTML = '<table><tr><th>Day of month</th><th>IN</th><th>OUT</th><th>Work Description</th><th>Status</th></tr>';
                data.forEach(row => {
                    tableHTML += `<tr>
                        <td>${row.day_of_month}</td>
                        <td>${row.IN}</td>
                        <td>${row.OUT}</td>
                        <td contenteditable>${row.work_description}</td>
                        <td>${row.status}</td>
                    </tr>`;
                });
                tableHTML += '</table>';
                return tableHTML;
            }
            function setUpEditSaveButton(empData) {
                const saveButton = document.getElementById('save_edit');
                const newSaveButton = saveButton.cloneNode(true);
                saveButton.parentNode.replaceChild(newSaveButton, saveButton);
                newSaveButton.addEventListener('click', function () {
                    const table = document.querySelector('table');
                    const rows = Array.from(table.querySelectorAll('tr')).slice(1);

                    const df_ts = rows.map(row => {
                        const cells = row.querySelectorAll('td');
                        let workDescription = cells[3].innerText;
                        const status = cells[4].innerText;

                        // If there is something written in the status cell, clear the work description cell
                        if (status.trim() !== "") {
                            workDescription = "";
                        }
                        return {
                            day_of_month: cells[0].innerText,
                            IN: cells[1].innerText,
                            OUT: cells[2].innerText,
                            work_description: workDescription,
                            status: status,
                            indxx_id: empData.indxx_id,
                        };
                    });

                    fetch('http://127.0.0.1:8000/add_timesheet/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(df_ts),
                    })
                        .then(response => {
                            if (response.ok) {
                                alert('Timesheet saved successfully');
                            } else {
                                alert('Failed to save timesheet');
                            }
                        })
                        .catch(error => console.error('Error:', error));
                });
            }
            function showStoxxSheet() {
                toggleVisibility(['timesheet_status', 'edit_timesheet', 'upload_download', 'role_allocation'], 'none');
                toggleVisibility(['stoxx_sheet'], 'block');
                document.getElementById('sidebar').style.height = 'calc(110vh - 68px)';
                const yearInput = document.getElementById('year_stoxx');
                const projectCodesContainer = document.getElementById('project-codes_stoxx');
                const selectAllCheckbox = document.getElementById('select-all');
                const downloadButton = document.getElementById('download-button');
                const newdownButton = downloadButton.cloneNode(true);
                downloadButton.parentNode.replaceChild(newdownButton, downloadButton);
                const statusDiv = document.getElementById('status');
                fetch('http://127.0.0.1:8000/project_codes/')
                    .then(response => response.json())
                    .then(data => {
                        // Populate project codes checkboxes
                        projectCodesContainer.innerHTML = '';
                        data.forEach(code => {
                            const div = document.createElement('div');
                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.id = code;
                            checkbox.value = code;
                            const label = document.createElement('label');
                            label.htmlFor = code;
                            label.textContent = code;
                            div.appendChild(checkbox);
                            div.appendChild(label);
                            projectCodesContainer.appendChild(div);
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching project codes:', error);
                        statusDiv.textContent = 'Error fetching project codes';
                        statusDiv.style.color = 'red';
                    });
                selectAllCheckbox.addEventListener('change', (event) => {
                    const checkboxes = projectCodesContainer.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(checkbox => checkbox.checked = event.target.checked);
                });
                newdownButton.addEventListener('click', () => {
                    const selectedYear = yearInput.value;
                    const monthIndex = document.getElementById('month_stoxx').selectedIndex + 1;
                    const selectedProjectCodes = Array.from(projectCodesContainer.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);

                    const data = {
                        project_code: selectedProjectCodes,
                        month: parseInt(monthIndex, 10),
                        year: parseInt(selectedYear, 10),
                    };

                    fetch('http://127.0.0.1:8000/get_stoxx_timesheet/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    })
                        .then(response => {
                            if (response.ok) {
                                return response.blob();  // We expect a binary response
                            } else {
                                throw new Error('Failed to generate Stoxx timesheet');
                            }
                        })
                        .then(blob => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                const base64data = reader.result.split(',')[1];  // Get the base64 part of the data URL
                                const link = document.createElement('a');
                                link.href = `data:application/zip;base64,${base64data}`;
                                link.download = 'stoxx_sheets.zip';
                                link.click();
                                alert('Downloaded successfully');
                            };
                            reader.readAsDataURL(blob);
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Failed to generate stoxx sheet successfully');
                        });
                });
            }
            function UploadDownload() {
                toggleVisibility(['stoxx_sheet', 'edit_timesheet', 'timesheet_status', 'role_allocation'], 'none');
                toggleVisibility(['upload_download'], 'block');
                document.getElementById('sidebar').style.height = 'calc(150vh - 68px)';
                document.getElementById('upload-employee-button').addEventListener('click', () => {
                    const fileInput = document.getElementById('employee-file');
                    if (fileInput.files.length > 0) {
                        uploadFile(fileInput.files[0], 'add_employee_data');
                    } else {
                        alert("Please choose a file to upload.");
                    }
                });

                document.getElementById('upload-leavesheet-button').addEventListener('click', () => {
                    const fileInput = document.getElementById('leavesheet-file');
                    if (fileInput.files.length > 0) {
                        uploadFile(fileInput.files[0], 'upload_leavesheet');
                    } else {
                        alert("Please choose a file to upload.");
                    }
                });

                document.getElementById('upload-holidaysheet-button').addEventListener('click', () => {
                    const fileInput = document.getElementById('holidaysheet-file');
                    if (fileInput.files.length > 0) {
                        uploadFile(fileInput.files[0], 'upload_holidaysheet');
                    } else {
                        alert("Please choose a file to upload.");
                    }
                });
                function uploadFile(file, endpoint) {
                    const formData = new FormData();
                    formData.append("file", file);

                    fetch(`${FASTAPI_URL}/${endpoint}`, {
                        method: "POST",
                        body: formData,
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.message) {
                                alert(data.message);
                            } else {
                                alert("An error occurred while uploading the file.");
                            }
                        })
                        .catch(error => {
                            alert("An error occurred: " + error.message);
                        });
                }
            }
            function createRole(empData) {
                toggleVisibility(['stoxx_sheet', 'edit_timesheet', 'upload_download', 'timesheet_status'], 'none');
                toggleVisibility(['role_allocation'], 'block');
                document.getElementById('submit-role-button').addEventListener('click', () => {
                    const indxxId = document.getElementById('indxx_id_role').value;
                    const role = document.querySelector('input[name="role"]:checked').value;
                    const messageDiv = document.getElementById('message_role');

                    if (indxxId) {
                        fetch(`${FASTAPI_URL}/users/${indxxId}`)
                            .then(response => response.json())
                            .then(resp => {
                                if (resp.indxx_id === indxxId) {
                                    const data = { indxx_id: indxxId, role: role };
                                    if (role === "Super User") {
                                        data.is_super_user = "true";
                                        data.is_admin = "true";
                                    } else if (role === "Admin") {
                                        data.is_super_user = "false";
                                        data.is_admin = "true";
                                    } else {
                                        data.is_super_user = "false";
                                        data.is_admin = "false";
                                    }
                                    delete data.role;

                                    fetch(`${FASTAPI_URL}/create_role/`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify(data)
                                    })
                                        .then(response => response.json())
                                        .then(response => {
                                            if (response.message) {
                                                messageDiv.textContent = response.message;
                                                messageDiv.style.color = 'green';
                                            } else {
                                                messageDiv.textContent = 'An error occurred while creating the role.';
                                                messageDiv.style.color = 'red';
                                            }
                                        })
                                        .catch(error => {
                                            messageDiv.textContent = 'An error occurred: ' + error.message;
                                            messageDiv.style.color = 'red';
                                        });
                                } else {
                                    messageDiv.textContent = 'Please enter a valid Indxx ID';
                                    messageDiv.style.color = 'red';
                                }
                            })
                            .catch(error => {
                                messageDiv.textContent = 'An error occurred: ' + error.message;
                                messageDiv.style.color = 'red';
                            });
                    } else {
                        messageDiv.textContent = 'Please enter an Indxx ID';
                        messageDiv.style.color = 'red';
                    }
                });

            }

        }
    }
    
    document.getElementById('feedbackForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const feedback = document.getElementById('feedback').value;
        
        // You can add your form submission logic here, e.g., send data to a server
        // For now, we will just display a thank you message
        
        document.getElementById('responseMessage').textContent = `Thank you for your feedback, ${name}!`;
        
        // Clear the form
        document.getElementById('feedbackForm').reset();
    });

    const loggedIn = localStorage.getItem("logged_in") === "true";
    const empData = JSON.parse(localStorage.getItem("employee_data"));
    if (loggedIn) {
        showSecondPage(empData);
    }
});
