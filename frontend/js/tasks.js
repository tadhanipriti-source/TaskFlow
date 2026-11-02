
// =====================================
// TASKFLOW - TASK MANAGEMENT
// =====================================

// Check Login
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const editTaskForm = document.getElementById("editTaskForm");


// =====================================
// LOGOUT
// =====================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
    });
}


// =====================================
// HELPER FUNCTIONS
// =====================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getTaskId(task) {
    return task._id || task.id;
}


// =====================================
// LOAD PROFILE PHOTO
// =====================================

async function loadDashboardProfilePhoto() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/auth/profile`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load profile");
        }

        const image = document.getElementById("dashboardProfileImage");

        if (image && data.user.profileImage) {
            image.src =
                `${API_BASE_URL}/uploads/${encodeURIComponent(data.user.profileImage)}`;

            image.onerror = () => {
                image.src = "https://placehold.co/40x40?text=P";
            };
        }

    } catch (error) {
        console.log("Profile loading error:", error.message);
    }
}


// =====================================
// ADD TASK
// =====================================

if (taskForm) {
    taskForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const message = document.getElementById("taskMessage");
        message.textContent = "Adding task...";

        const formData = new FormData();

        formData.append("title", document.getElementById("title").value);
        formData.append("description", document.getElementById("description").value);
        formData.append("priority", document.getElementById("priority").value);
        formData.append("status", document.getElementById("status").value);

        const dueDate = document.getElementById("dueDate").value;

        if (dueDate) {
            formData.append("dueDate", dueDate);
        }

        const attachment = document.getElementById("attachment").files[0];

        if (attachment) {
            formData.append("attachment", attachment);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/tasks`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to add task");
            }

            message.textContent = "Task added successfully!";
            message.style.color = "green";

            taskForm.reset();

            await loadTasks(1);

        } catch (error) {
            message.textContent = error.message;
            message.style.color = "red";
        }
    });
}


// =====================================
// LOAD TASKS
// =====================================

let currentPage = 1;
const limit = 5;

async function loadTasks(page = currentPage) {

    currentPage = page;

    if (!taskList) return;

    taskList.innerHTML = "<p>Loading tasks...</p>";

    // Correct IDs from dashboard.html
    const search = document.getElementById("searchInput")?.value || "";
    const status = document.getElementById("statusFilter")?.value || "";
    const priority = document.getElementById("priorityFilter")?.value || "";

    const params = new URLSearchParams({
        page,
        limit,
        search,
        status,
        priority
    });

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/tasks?${params}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Unable to load tasks");
        }

        const tasks = data.tasks || [];

        displayTasks(tasks);

        updateStats(tasks, data.totalTasks ?? tasks.length);

        displayPagination(
            data.totalPages || 1,
            data.currentPage || page
        );

    } catch (error) {
        taskList.innerHTML =
            `<p>${escapeHTML(error.message)}</p>`;
    }
}


// =====================================
// DISPLAY TASKS
// =====================================

function displayTasks(tasks) {

    if (!taskList) return;

    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = "<p>No tasks found.</p>";
        return;
    }

    taskList.innerHTML = tasks.map(task => {

        const id = escapeHTML(getTaskId(task));

        const attachmentHTML = task.attachment
            ? `<p>Attachment:
                <a href="${API_BASE_URL}/uploads/${encodeURIComponent(task.attachment)}"
                   target="_blank" rel="noopener noreferrer">
                    View File
                </a>
               </p>`
            : "";

        const dueDateHTML = task.dueDate
            ? `<p>Due Date: ${escapeHTML(
                new Date(task.dueDate).toLocaleDateString()
            )}</p>`
            : "";

        return `
            <div class="task-card">

                <h3>${escapeHTML(task.title)}</h3>

                <p>${escapeHTML(task.description || "No description")}</p>

                <p>Status: ${escapeHTML(task.status)}</p>

                <p>Priority: ${escapeHTML(task.priority)}</p>

                ${dueDateHTML}

                ${attachmentHTML}

                <button
                    class="btn"
                    type="button"
                    data-action="edit"
                    data-id="${id}">
                    Edit
                </button>

                <button
                    class="btn"
                    type="button"
                    data-action="delete"
                    data-id="${id}">
                    Delete
                </button>

            </div>
        `;

    }).join("");
}


// =====================================
// UPDATE STATISTICS
// =====================================

function updateStats(tasks, totalTasks) {

    document.getElementById("totalTasks").textContent = totalTasks;

    document.getElementById("pendingTasks").textContent =
        tasks.filter(task => task.status === "Pending").length;

    // Correct HTML ID
    document.getElementById("inProgressTasks").textContent =
        tasks.filter(task => task.status === "In Progress").length;

    document.getElementById("completedTasks").textContent =
        tasks.filter(task => task.status === "Completed").length;
}


// =====================================
// DELETE TASK
// =====================================

async function deleteTask(id) {

    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/tasks/${encodeURIComponent(id)}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to delete task");
        }

        alert("Task deleted successfully!");

        await loadTasks();

    } catch (error) {
        alert(error.message);
    }
}


// =====================================
// EDIT TASK
// =====================================

async function editTask(id) {

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/tasks/${encodeURIComponent(id)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to get task");
        }

        const task = data.task || data;

        document.getElementById("editTaskId").value = getTaskId(task);
        document.getElementById("editTitle").value = task.title || "";
        document.getElementById("editDescription").value = task.description || "";
        document.getElementById("editPriority").value = task.priority || "Medium";
        document.getElementById("editStatus").value = task.status || "Pending";

        document.getElementById("editDueDate").value =
            task.dueDate
                ? new Date(task.dueDate).toISOString().split("T")[0]
                : "";

        document.getElementById("editAttachment").value = "";

        const editMessage = document.getElementById("editMessage");

        if (editMessage) {
            editMessage.textContent = "";
        }

        document.getElementById("editModal").style.display = "flex";

    } catch (error) {
        alert(error.message);
    }
}


// =====================================
// UPDATE TASK
// =====================================

if (editTaskForm) {

    editTaskForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const id = document.getElementById("editTaskId").value;

        const message = document.getElementById("editMessage");

        if (message) {
            message.textContent = "Updating task...";
        }

        const formData = new FormData();

        formData.append("title", document.getElementById("editTitle").value);
        formData.append("description", document.getElementById("editDescription").value);
        formData.append("priority", document.getElementById("editPriority").value);
        formData.append("status", document.getElementById("editStatus").value);

        const dueDate = document.getElementById("editDueDate").value;

        if (dueDate) {
            formData.append("dueDate", dueDate);
        }

        const attachment = document.getElementById("editAttachment").files[0];

        if (attachment) {
            formData.append("attachment", attachment);
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/tasks/${encodeURIComponent(id)}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to update task");
            }

            if (message) {
                message.textContent = "Task updated successfully!";
                message.style.color = "green";
            }

            document.getElementById("editModal").style.display = "none";

            await loadTasks();

        } catch (error) {

            if (message) {
                message.textContent = error.message;
                message.style.color = "red";
            } else {
                alert(error.message);
            }
        }
    });
}


// =====================================
// CLOSE EDIT MODAL
// =====================================

const closeModalBtn = document.getElementById("closeModalBtn");

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        document.getElementById("editModal").style.display = "none";
    });
}


// =====================================
// PAGINATION
// =====================================

function displayPagination(totalPages, activePage) {

    const pagination = document.getElementById("pagination");

    if (!pagination) return;

    pagination.innerHTML = "";

    if (totalPages <= 1) return;

    if (activePage > 1) {
        pagination.innerHTML += `
            <button type="button" data-page="${activePage - 1}">
                Previous
            </button>
        `;
    }

    pagination.innerHTML += `
        <span>Page ${activePage} of ${totalPages}</span>
    `;

    if (activePage < totalPages) {
        pagination.innerHTML += `
            <button type="button" data-page="${activePage + 1}">
                Next
            </button>
        `;
    }
}


// =====================================
// SEARCH AND FILTER
// =====================================

let searchTimer;

const searchInput = document.getElementById("searchInput");

if (searchInput) {
    searchInput.addEventListener("input", () => {

        clearTimeout(searchTimer);

        searchTimer = setTimeout(() => {
            loadTasks(1);
        }, 400);

    });
}

const statusFilter = document.getElementById("statusFilter");

if (statusFilter) {
    statusFilter.addEventListener("change", () => {
        loadTasks(1);
    });
}

const priorityFilter = document.getElementById("priorityFilter");

if (priorityFilter) {
    priorityFilter.addEventListener("change", () => {
        loadTasks(1);
    });
}


// =====================================
// TASK BUTTON HANDLING
// =====================================

if (taskList) {
    taskList.addEventListener("click", (e) => {

        const button = e.target.closest("button[data-action]");

        if (!button) return;

        const id = button.dataset.id;

        if (button.dataset.action === "edit") {
            editTask(id);
        }

        if (button.dataset.action === "delete") {
            deleteTask(id);
        }
    });
}


// =====================================
// PAGINATION BUTTON HANDLING
// =====================================

const pagination = document.getElementById("pagination");

if (pagination) {
    pagination.addEventListener("click", (e) => {

        const button = e.target.closest("button[data-page]");

        if (!button) return;

        loadTasks(Number(button.dataset.page));
    });
}


// =====================================
// INITIAL LOAD
// =====================================

loadDashboardProfilePhoto();
loadTasks(1);
