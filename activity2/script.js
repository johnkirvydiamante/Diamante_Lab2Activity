let currentUser = null;
const STORAGE_KEY = "ipt_demo_v1";

window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};

/* =======================
   STORAGE
======================= */
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        window.db = JSON.parse(data);
    } else {
        window.db.accounts.push({
            first: "Admin",
            last: "User",
            email: "admin@example.com",
            password: "Password123!",
            role: "admin",
            verified: true
        });

        window.db.departments = [
            { name: "Engineering", description: "Software team" },
            { name: "HR", description: "Human Resources" }
        ];
        saveToStorage();
    }
}

/* =======================
   ROUTING
======================= */
function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    const hash = window.location.hash || "#/";
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    const pageId = hash.replace("#/", "") || "home";
    const page = document.getElementById(pageId + "-page");

    if (!currentUser && ["profile", "requests", "employees", "departments", "accounts"].includes(pageId)) {
        navigateTo("#/login");
        return;
    }

    if (page) {
        page.classList.add("active");

        if (pageId === "profile") renderProfile();
        if (pageId === "departments") renderDepartmentsTable();
        if (pageId === "employees") renderEmployeesTable();
        if (pageId === "accounts") renderAccountsTable();
        if (pageId === "requests") renderRequests();
        if (pageId === "verify-email") renderVerifyEmail();
    }
}

/* =======================
   AUTH STATE
======================= */
function setAuthState(isAuth, user = null) {
    document.body.classList.toggle("authenticated", isAuth);
    document.body.classList.toggle("not-authenticated", !isAuth);
    document.body.classList.remove("is-admin");

    currentUser = user;

    if (user) {
        document.getElementById("userDropdown").textContent =
            user.role === "admin" ? "Admin" : user.first;

        if (user.role === "admin") {
            document.body.classList.add("is-admin");
        }
    }
}

/* =======================
   PROFILE
======================= */
function renderProfile() {
    const profile = document.getElementById("profileInfo");
    if (!currentUser) return;

    profile.innerHTML = `
        <div class="card shadow-sm" style="max-width:700px">
            <div class="card-body p-4">
                <h5 class="fw-bold">${currentUser.first} ${currentUser.last}</h5>
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>Role:</strong> ${currentUser.role}</p>
                <button class="btn btn-outline-primary">Edit Profile</button>
            </div>
        </div>
    `;
}

/* =======================
   REGISTER
======================= */
document.getElementById("registerForm").addEventListener("submit", e => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll("input");
    const email = inputs[2].value;

    if (window.db.accounts.find(a => a.email === email)) {
        alert("Email already exists");
        return;
    }

    window.db.accounts.push({
        first: inputs[0].value,
        last: inputs[1].value,
        email,
        password: inputs[3].value,
        role: "user",
        verified: false
    });

    saveToStorage();
    localStorage.setItem("unverified_email", email);
    navigateTo("#/verify-email");
});

/* =======================
   VERIFY EMAIL
======================= */
function renderVerifyEmail() {
    const email = localStorage.getItem("unverified_email");
    if (!email) return;

    document.getElementById("verifyEmailText").textContent = email;
    document.getElementById("verifyAlert").classList.remove("d-none");
    document.getElementById("verifiedSuccess").classList.add("d-none");
}

document.getElementById("verifyBtn").addEventListener("click", () => {
    const email = localStorage.getItem("unverified_email");
    if (!email) return;

    const user = window.db.accounts.find(a => a.email === email);
    if (!user) return;

    // Mark user as verified
    user.verified = true;
    saveToStorage();

    // Directly pop up the message and navigate
    alert("Email verified! You may login.");
    
    // Clear the pending email and go to login
    localStorage.removeItem("unverified_email");
    navigateTo("#/login");
});

/* =======================
   LOGIN
======================= */
document.getElementById("loginForm").addEventListener("submit", e => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll("input");

    const user = window.db.accounts.find(
        a =>
            a.email === inputs[0].value &&
            a.password === inputs[1].value &&
            a.verified
    );

    if (!user) {
        alert("Invalid login or email not verified");
        return;
    }

    setAuthState(true, user);
    navigateTo("#/profile");
});

/* =======================
   LOGOUT
======================= */
document.getElementById("logoutBtn").addEventListener("click", e => {
    e.preventDefault();
    setAuthState(false);
    navigateTo("#/login");
});

/* =======================
   EMPLOYEES (ADMIN)
======================= */
const employeesTableBody = document.getElementById("employeesTableBody");
const employeeFormCard = document.getElementById("employeeFormCard");
const employeeForm = document.getElementById("employeeForm");

document.getElementById("addEmployeeBtn").addEventListener("click", () => {
    employeeForm.reset();
    populateDepartmentDropdown();
    employeeFormCard.classList.remove("d-none");
});

document.getElementById("cancelEmployeeBtn").addEventListener("click", () => {
    employeeFormCard.classList.add("d-none");
});

function populateDepartmentDropdown() {
    const dept = document.getElementById("empDept");
    dept.innerHTML = window.db.departments
        .map(d => `<option>${d.name}</option>`)
        .join("");
}

employeeForm.addEventListener("submit", e => {
    e.preventDefault();

    const email = document.getElementById("empEmail").value;
    const user = window.db.accounts.find(a => a.email === email);
    if (!user) {
        alert("User email not found");
        return;
    }

    window.db.employees.push({
        id: document.getElementById("empId").value,
        name: `${user.first} ${user.last}`,
        position: document.getElementById("empPosition").value,
        department: document.getElementById("empDept").value,
        hireDate: document.getElementById("empHireDate").value
    });

    saveToStorage();
    renderEmployeesTable();
    employeeFormCard.classList.add("d-none");
});

function renderEmployeesTable() {
    if (!employeesTableBody) return;
    if (window.db.employees.length === 0) {
        employeesTableBody.innerHTML = `<tr><td colspan="5" class="text-center bg-light">No employees.</td></tr>`;
        return;
    }

    employeesTableBody.innerHTML = window.db.employees
        .map((e, i) => `
        <tr>
            <td>${e.id}</td>
            <td>${e.name}</td>
            <td>${e.position}</td>
            <td>${e.department}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${i})">Delete</button>
            </td>
        </tr>`).join("");
}

window.deleteEmployee = index => {
    if (confirm("Delete employee?")) {
        window.db.employees.splice(index, 1);
        saveToStorage();
        renderEmployeesTable();
    }
};

/* =======================
   DEPARTMENTS (ADMIN)
======================= */
const departmentsTableBody = document.getElementById("departmentsTableBody");
const deptFormCard = document.getElementById("deptFormCard");
const deptForm = document.getElementById("deptForm");
const deptNameInput = document.getElementById("deptName");
const deptDescInput = document.getElementById("deptDesc");

let editingDeptIndex = null;

function renderDepartmentsTable() {
    if (!departmentsTableBody) return;
    if (window.db.departments.length === 0) {
        departmentsTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No departments found.</td></tr>`;
        return;
    }

    departmentsTableBody.innerHTML = window.db.departments
        .map((dept, index) => `
        <tr>
            <td>${dept.name}</td>
            <td>${dept.description}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editDepartment(${index})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteDepartment(${index})">Delete</button>
            </td>
        </tr>`).join("");
}

document.getElementById("addDeptBtn")?.addEventListener("click", () => {
    deptForm.reset();
    editingDeptIndex = null;
    deptFormCard.classList.remove("d-none");
});

document.getElementById("cancelDeptBtn")?.addEventListener("click", () => {
    deptFormCard.classList.add("d-none");
});

deptForm?.addEventListener("submit", e => {
    e.preventDefault();
    const name = deptNameInput.value.trim();
    const description = deptDescInput.value.trim();
    if (!name || !description) return;

    if (editingDeptIndex === null) {
        window.db.departments.push({ name, description });
    } else {
        window.db.departments[editingDeptIndex] = { name, description };
    }

    saveToStorage();
    renderDepartmentsTable();
    deptFormCard.classList.add("d-none");
});

window.editDepartment = index => {
    const dept = window.db.departments[index];
    deptNameInput.value = dept.name;
    deptDescInput.value = dept.description;
    editingDeptIndex = index;
    deptFormCard.classList.remove("d-none");
};

window.deleteDepartment = index => {
    if (confirm("Delete this department?")) {
        window.db.departments.splice(index, 1);
        saveToStorage();
        renderDepartmentsTable();
    }
};

/* =========================
   ACCOUNTS (ADMIN)
========================= */
const accountsTableBody = document.getElementById("accountsTableBody");
const accountFormWrapper = document.getElementById("accountFormCard");

function renderAccountsTable() {
    if (!accountsTableBody) return;
    if (window.db.accounts.length === 0) {
        accountsTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No accounts found.</td></tr>`;
        return;
    }

    accountsTableBody.innerHTML = window.db.accounts.map((acc, index) => `
        <tr>
            <td>${acc.first} ${acc.last}</td>
            <td>${acc.email}</td>
            <td>${acc.role.charAt(0).toUpperCase() + acc.role.slice(1)}</td>
            <td>${acc.verified ? "✅" : "❌"}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editAccount(${index})">Edit</button>
                <button class="btn btn-sm btn-warning me-1" onclick="resetPassword(${index})">Reset PW</button>
                <button class="btn btn-sm btn-danger" onclick="deleteAccount(${index})">Delete</button>
            </td>
        </tr>`).join("");
}

document.getElementById("addAccountBtn")?.addEventListener("click", () => {
    accountFormWrapper.classList.remove("d-none");
    document.getElementById("accountForm").reset();
    editingAccountIndex = null;
});

document.getElementById("cancelAccountBtn")?.addEventListener("click", () => {
    accountFormWrapper.classList.add("d-none");
});

document.getElementById("accountForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const accountData = {
        first: document.getElementById("accFirst").value.trim(),
        last: document.getElementById("accLast").value.trim(),
        email: document.getElementById("accEmail").value.trim(),
        password: document.getElementById("accPassword").value,
        role: document.getElementById("accRole").value,
        verified: document.getElementById("accVerified").checked
    };

    if (editingAccountIndex === null) {
        if (window.db.accounts.some(a => a.email === accountData.email)) return alert("Email exists.");
        window.db.accounts.push(accountData);
    } else {
        window.db.accounts[editingAccountIndex] = accountData;
    }

    saveToStorage();
    renderAccountsTable();
    accountFormWrapper.classList.add("d-none");
});

window.editAccount = index => {
    const acc = window.db.accounts[index];
    document.getElementById("accFirst").value = acc.first;
    document.getElementById("accLast").value = acc.last;
    document.getElementById("accEmail").value = acc.email;
    document.getElementById("accPassword").value = acc.password;
    document.getElementById("accRole").value = acc.role;
    document.getElementById("accVerified").checked = acc.verified;
    editingAccountIndex = index;
    accountFormWrapper.classList.remove("d-none");
};

window.deleteAccount = index => {
    if (confirm("Delete account?")) {
        window.db.accounts.splice(index, 1);
        saveToStorage();
        renderAccountsTable();
    }
};

window.resetPassword = index => {
    const newPass = prompt("Enter new password:");
    if (!newPass) return;
    window.db.accounts[index].password = newPass;
    saveToStorage();
    alert("Password reset success.");
};

/* =========================
   REQUESTS (USER & ADMIN)
========================= */
window.addNewItemField = function() {
    const container = document.getElementById('dynamicItemsContainer');
    const div = document.createElement('div');
    div.className = "input-group mb-2";
    div.innerHTML = `
        <input type="text" class="form-control" placeholder="Item name">
        <input type="number" class="form-control" value="1" style="max-width: 80px;">
        <button class="btn btn-outline-danger" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
};

window.submitRequest = function() {
    if (!currentUser) return alert("Please log in first");

    const type = document.getElementById('reqType').value;
    const itemRows = document.querySelectorAll('#dynamicItemsContainer .input-group');
    const items = [];

    itemRows.forEach(row => {
        const name = row.querySelector('input[type="text"]').value.trim();
        const qty = row.querySelector('input[type="number"]').value;
        if (name) items.push(`${name} (x${qty})`);
    });

    if (items.length === 0) return alert("Please add at least one item");

    window.db.requests.push({
        userEmail: currentUser.email,
        userName: `${currentUser.first} ${currentUser.last}`,
        type: type,
        items: items.join(', '),
        date: new Date().toLocaleDateString(),
        status: 'Pending'
    });

    saveToStorage();
    bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();

    document.getElementById('dynamicItemsContainer').innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control" placeholder="Item name">
            <input type="number" class="form-control" value="1" style="max-width: 80px;">
            <button class="btn btn-outline-secondary" onclick="addNewItemField()">+</button>
        </div>
    `;
    renderRequests();
};

function renderRequests() {
    const list = document.getElementById('requestsList');
    const emptyMsg = document.getElementById('emptyRequests');
    const table = document.getElementById('requestsTable');
    if (!list) return;

    const isAdmin = currentUser.role === 'admin';
    const visibleRequests = isAdmin ? window.db.requests : window.db.requests.filter(r => r.userEmail === currentUser.email);

    emptyMsg.classList.toggle('d-none', visibleRequests.length > 0);
    table.classList.toggle('d-none', visibleRequests.length === 0);

    list.innerHTML = visibleRequests.map((req) => {
        // Find actual index in window.db.requests for Admin actions
        const masterIndex = window.db.requests.indexOf(req);
        
        return `
        <tr>
            <td>${req.type} ${isAdmin ? `<br><small class="text-muted">(${req.userName})</small>` : ''}</td>
            <td>${req.items}</td>
            <td>${req.date}</td>
            <td><span class="badge ${getStatusClass(req.status)}">${req.status}</span></td>
            <td class="${isAdmin ? '' : 'd-none'}">
                <button class="btn btn-sm btn-success" onclick="updateStatus(${masterIndex}, 'Approved')">✓</button>
                <button class="btn btn-sm btn-danger" onclick="updateStatus(${masterIndex}, 'Rejected')">✕</button>
            </td>
        </tr>`;
    }).join('');
}

function getStatusClass(status) {
    if (status === 'Approved') return 'bg-success';
    if (status === 'Rejected') return 'bg-danger';
    return 'bg-warning text-dark';
}

window.updateStatus = function(index, newStatus) {
    window.db.requests[index].status = newStatus;
    saveToStorage();
    renderRequests();
};

/* =======================
   INIT
======================= */
loadFromStorage();
handleRouting();
window.addEventListener("hashchange", handleRouting);