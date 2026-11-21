/* TaskMatrix — client-side project demo.
   Data is stored in localStorage for this Internet Programming project.
   This is not production-grade authentication or secure cloud storage. */
// ============================== DOM & APP STATE ==============================
// $() is a shortcut for finding an HTML element by its id.
const $ = (id) => document.getElementById(id);
const STORAGE_USERS = "taskmatrix_users_v1";
const SESSION_KEY = "taskmatrix_session_v1";
let currentUser = null;
let authMode = "login";
let toastTimer;
// ============================== STORAGE HELPERS ==============================
// These helpers read and write account/task data in the browser.
function readUsers() { try {
    return JSON.parse(localStorage.getItem(STORAGE_USERS)) || {};
}
catch {
    return {};
} }
function writeUsers(users) { localStorage.setItem(STORAGE_USERS, JSON.stringify(users)); }
function userTasks() { return currentUser?.tasks || []; }
function saveTasks() { const users = readUsers(); if (!users[currentUser.email])
    return; users[currentUser.email].tasks = currentUser.tasks; writeUsers(users); }
// ============================== DATE & UI HELPERS ==============================
// Formatting and safety helpers used while displaying user-entered task data.
function escapeHTML(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function todayISO() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
function prettyDate(date) { if (!date)
    return "No date"; return new Date(date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
function showToast(message) { const t = $("toast"); t.textContent = message; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600); }
// ============================== LOGIN & SIGN-UP ==============================
// Switches the form between login and registration and handles authentication.
function setAuthMode(mode) { authMode = mode; $("authTitle").textContent = mode === "login" ? "Welcome back" : "Create your account"; $("authSubtitle").textContent = mode === "login" ? "Sign in to continue to your workspace." : "Start organizing your work with TaskMatrix."; $("nameField").classList.toggle("hidden", mode === "login"); $("authName").required = mode === "signup"; $("authPassword").autocomplete = mode === "login" ? "current-password" : "new-password"; $("authSubmit").innerHTML = mode === "login" ? 'Sign in <span>→</span>' : 'Create account <span>→</span>'; $("switchText").textContent = mode === "login" ? "New to TaskMatrix?" : "Already have an account?"; $("switchAuth").textContent = mode === "login" ? "Create an account" : "Sign in"; $("authError").textContent = ""; }
$("switchAuth").addEventListener("click", () => setAuthMode(authMode === "login" ? "signup" : "login"));
$("authForm").addEventListener("submit", e => {
    e.preventDefault();
    const email = $("authEmail").value.trim().toLowerCase(), password = $("authPassword").value, name = $("authName").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return $("authError").textContent = "Please enter a valid email address.";
    if (password.length < 6)
        return $("authError").textContent = "Password must contain at least 6 characters.";
    const users = readUsers();
    if (authMode === "signup") {
        if (!name)
            return $("authError").textContent = "Please enter your name.";
        if (users[email])
            return $("authError").textContent = "An account with this email already exists.";
        users[email] = { name, password, tasks: [] };
        writeUsers(users);
        loginUser(email, users[email]);
        showToast("Your account has been created.");
    }
    else {
        if (!users[email] || users[email].password !== password)
            return $("authError").textContent = "Incorrect email or password.";
        loginUser(email, users[email]);
    }
});
// Shows the dashboard after successful login and loads the user tasks.
function loginUser(email, data) { currentUser = { email, name: data.name, tasks: Array.isArray(data.tasks) ? data.tasks : [] }; sessionStorage.setItem(SESSION_KEY, email); $("authView").classList.add("hidden"); $("appView").classList.remove("hidden"); $("userName").textContent = currentUser.name; $("userEmail").textContent = email; $("userAvatar").textContent = (currentUser.name[0] || "U").toUpperCase(); setDateLabels(); renderAll(); checkReminders(); }
// Ends the current browser session and returns to the login screen.
function logout() { sessionStorage.removeItem(SESSION_KEY); currentUser = null; $("appView").classList.add("hidden"); $("authView").classList.remove("hidden"); $("authForm").reset(); setAuthMode("login"); }
$("logoutBtn").addEventListener("click", logout);
// Updates the dashboard date and time-based greeting.
function setDateLabels() { const now = new Date(); $("todayLabel").textContent = now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }); $("longDate").textContent = now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }); const h = now.getHours(); $("greeting").textContent = (h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening") + ", " + currentUser.name.split(" ")[0]; }
// ============================== NAVIGATION ==============================
// Switches between Overview, Priority Matrix, and All Tasks pages.
function switchView(view) { document.querySelectorAll(".page-view").forEach(el => el.classList.add("hidden")); $(view + "View").classList.remove("hidden"); document.querySelectorAll(".nav-link").forEach(b => b.classList.toggle("active", b.dataset.view === view)); $("pageCrumb").textContent = view === "overview" ? "Overview" : view === "matrix" ? "Priority matrix" : "All tasks"; $("sidebar").classList.remove("open"); if (view === "tasks")
    renderTable(); }
document.querySelectorAll(".nav-link").forEach(b => b.addEventListener("click", () => switchView(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => switchView(b.dataset.goto)));
$("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));
$("topAddBtn").addEventListener("click", () => openTaskModal());
$("matrixAddBtn").addEventListener("click", () => openTaskModal());
$("tasksAddBtn").addEventListener("click", () => openTaskModal());
$("emptyAddBtn").addEventListener("click", () => openTaskModal());
// ============================== TASK PRIORITY LOGIC ==============================
// Uses urgency and importance to place a task in one of four matrix sections.
function quadrant(task) { if (task.urgent && task.important)
    return "do"; if (!task.urgent && task.important)
    return "schedule"; if (task.urgent && !task.important)
    return "delegate"; return "eliminate"; }
function priorityRank(p) { return p === "High" ? 3 : p === "Medium" ? 2 : 1; }
// ============================== DASHBOARD RENDERING ==============================
// Refreshes the dashboard sections so they reflect the latest task data.
function renderAll() { renderStats(); renderSnapshot(); renderUpcoming(); renderMatrix(); renderTable(); $("navTaskCount").textContent = userTasks().length; }
// Calculates counts and completion percentage for dashboard statistics.
function renderStats() { const tasks = userTasks(), done = tasks.filter(t => t.status === "completed").length, active = tasks.filter(t => t.status === "in-progress").length, pending = tasks.filter(t => t.status === "pending").length, overdue = tasks.filter(t => t.status !== "completed" && t.due < todayISO()).length, total = tasks.length, pct = total ? Math.round(done / total * 100) : 0; $("statTotal").textContent = total; $("statProgress").textContent = active; $("statCompleted").textContent = done; $("statOverdue").textContent = overdue; $("progressPercent").textContent = pct + "%"; $("progressDonut").style.background = `conic-gradient(var(--purple) ${pct}%, #eeeef4 ${pct}%)`; $("legendDone").textContent = done; $("legendActive").textContent = active; $("legendPending").textContent = pending; }
// Shows a short list of urgent AND important tasks.
function renderSnapshot() { const items = userTasks().filter(t => t.status !== "completed" && quadrant(t) === "do").sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4); $("prioritySnapshot").innerHTML = items.length ? items.map(t => `<div class="snapshot-item"><i class="snapshot-dot"></i><div><strong>${escapeHTML(t.title)}</strong><small>Due ${prettyDate(t.due)}</small></div><button data-edit="${t.id}">Open</button></div>`).join("") : '<div class="empty-quad">No urgent and important tasks. Nice work!</div>'; bindEditButtons(); }
// Shows the next few incomplete tasks ordered by due date.
function renderUpcoming() { const items = userTasks().filter(t => t.status !== "completed").sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4); $("upcomingList").innerHTML = items.length ? items.map(t => `<div class="task-row"><span class="task-name">${escapeHTML(t.title)}</span><span class="task-meta">${escapeHTML(t.category)}</span><span><span class="priority-pill priority-${t.priority.toLowerCase()}">${t.priority}</span></span><span class="task-meta">${prettyDate(t.due)}</span></div>`).join("") : '<div class="empty-quad">No upcoming tasks. Add a task to get started.</div>'; }
// Draws tasks into the four priority quadrants and handles completion checkboxes.
function renderMatrix() { ["do", "schedule", "delegate", "eliminate"].forEach(q => { const items = userTasks().filter(t => quadrant(t) === q && t.status !== "completed"); const node = $("quad-" + q); node.innerHTML = items.length ? items.map(t => `<div class="matrix-task"><input class="task-check" type="checkbox" data-complete="${t.id}" title="Mark completed"><div class="matrix-task-info"><strong>${escapeHTML(t.title)}</strong><small>${escapeHTML(t.category)} · ${prettyDate(t.due)}</small></div><button data-edit="${t.id}" title="Edit task">⋯</button></div>`).join("") : '<div class="empty-quad">Nothing here yet</div>'; }); document.querySelectorAll("[data-complete]").forEach(el => el.addEventListener("change", () => { const task = userTasks().find(t => t.id === el.dataset.complete); if (task) {
    task.status = "completed";
    saveTasks();
    renderAll();
    showToast("Task marked as completed.");
} })); bindEditButtons(); }
// Builds the task list, applying search, filters, and sorting.
function renderTable() { const query = ($("searchInput")?.value || "").trim().toLowerCase(), status = $("statusFilter")?.value || "all", priority = $("priorityFilter")?.value || "all", sort = $("sortSelect")?.value || "date"; let tasks = userTasks().filter(t => (t.title + " " + t.description + " " + t.category).toLowerCase().includes(query) && (status === "all" || t.status === status) && (priority === "all" || t.priority === priority)); tasks.sort((a, b) => sort === "priority" ? priorityRank(b.priority) - priorityRank(a.priority) : sort === "created" ? b.created - a.created : sort === "title" ? a.title.localeCompare(b.title) : a.due.localeCompare(b.due)); $("taskTableBody").innerHTML = tasks.map(t => `<tr><td>${escapeHTML(t.title)}</td><td><span class="category-tag">${escapeHTML(t.category)}</span></td><td><span class="priority-pill priority-${t.priority.toLowerCase()}">${t.priority}</span></td><td>${prettyDate(t.due)}${t.status !== "completed" && t.due < todayISO() ? ' <span style="color:#d46c5c;font-size:9px">Overdue</span>' : ''}</td><td><span class="status-pill status-${t.status}">${t.status === "in-progress" ? "In progress" : t.status[0].toUpperCase() + t.status.slice(1)}</span></td><td><div class="table-actions"><button data-edit="${t.id}" title="Edit">✎</button><button data-delete="${t.id}" title="Delete">⌫</button></div></td></tr>`).join(""); $("emptyTasks").classList.toggle("hidden", tasks.length !== 0); $("tableCount").textContent = `Showing ${tasks.length} of ${userTasks().length} tasks`; $("navTaskCount").textContent = userTasks().length; bindEditButtons(); document.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => deleteTask(b.dataset.delete))); }
["searchInput", "statusFilter", "priorityFilter", "sortSelect"].forEach(id => $(id).addEventListener(id === "searchInput" ? "input" : "change", renderTable));
// Connects each Edit/Open button to the task editor, only once per button.
function bindEditButtons() { document.querySelectorAll("[data-edit]").forEach(b => { if (b.dataset.bound)
    return; b.dataset.bound = "1"; b.addEventListener("click", () => openTaskModal(b.dataset.edit)); }); }
// ============================== TASK FORM & CRUD ==============================
// Opens the task form. If an id is supplied, it fills the form with that task.
function openTaskModal(id = null) { $("taskForm").reset(); $("taskError").textContent = ""; $("taskId").value = ""; $("taskDue").min = ""; $("modalTitle").textContent = id ? "Edit task" : "Create a task"; if (id) {
    const t = userTasks().find(x => x.id === id);
    if (!t)
        return;
    $("taskId").value = t.id;
    $("taskTitle").value = t.title;
    $("taskDescription").value = t.description || "";
    $("taskCategory").value = t.category;
    $("taskPriority").value = t.priority;
    $("taskDue").value = t.due;
    $("taskStatus").value = t.status;
    $("taskUrgent").checked = t.urgent;
    $("taskImportant").checked = t.important;
    $("taskReminder").checked = t.reminder;
}
else {
    $("taskDue").value = todayISO();
    $("taskImportant").checked = true;
    $("taskReminder").checked = true;
} $("taskModal").classList.remove("hidden"); $("taskTitle").focus(); }
// Hides the task form popup.
function closeTaskModal() { $("taskModal").classList.add("hidden"); }
$("closeModal").addEventListener("click", closeTaskModal);
$("cancelModal").addEventListener("click", closeTaskModal);
$("taskModal").addEventListener("click", e => { if (e.target === $("taskModal"))
    closeTaskModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape")
    closeTaskModal(); });
$("taskForm").addEventListener("submit", e => { e.preventDefault(); const title = $("taskTitle").value.trim(), due = $("taskDue").value; if (!title)
    return $("taskError").textContent = "Task title is required."; if (!due)
    return $("taskError").textContent = "Please select a due date."; if (title.length < 2)
    return $("taskError").textContent = "Task title must contain at least 2 characters."; const id = $("taskId").value; const old = userTasks().find(t => t.id === id); const task = { id: id || ("task_" + Date.now() + "_" + Math.random().toString(16).slice(2, 7)), title, description: $("taskDescription").value.trim(), category: $("taskCategory").value, priority: $("taskPriority").value, due, status: $("taskStatus").value, urgent: $("taskUrgent").checked, important: $("taskImportant").checked, reminder: $("taskReminder").checked, created: old?.created || Date.now(), remindedOn: old?.remindedOn || "" }; if (id) {
    currentUser.tasks = currentUser.tasks.map(t => t.id === id ? task : t);
    showToast("Task updated successfully.");
}
else {
    currentUser.tasks.push(task);
    showToast("Task created successfully.");
} saveTasks(); closeTaskModal(); renderAll(); });
// Removes a task after the user confirms the deletion.
function deleteTask(id) { const t = userTasks().find(x => x.id === id); if (!t)
    return; if (!confirm(`Delete "${t.title}"? This action cannot be undone.`))
    return; currentUser.tasks = currentUser.tasks.filter(x => x.id !== id); saveTasks(); renderAll(); showToast("Task deleted."); }
// Displays due/overdue reminders once per task per day.
function checkReminders() { const today = todayISO(); let changed = false; userTasks().forEach(t => { if (t.reminder && t.status !== "completed" && t.due <= today && t.remindedOn !== today) {
    showToast(t.due < today ? `Reminder: "${t.title}" is overdue.` : `Reminder: "${t.title}" is due today.`);
    t.remindedOn = today;
    changed = true;
} }); if (changed)
    saveTasks(); }
// ============================== SESSION RESTORE ==============================
// If a session exists after refresh, restore the signed-in user automatically.
if (sessionStorage.getItem(SESSION_KEY)) {
    const email = sessionStorage.getItem(SESSION_KEY), data = readUsers()[email];
    if (data)
        loginUser(email, data);
    else
        sessionStorage.removeItem(SESSION_KEY);
}
