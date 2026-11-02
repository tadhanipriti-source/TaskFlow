
const token = localStorage.getItem("token");

// Check Login
if (!token) {
    window.location.href = "login.html";
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
});


// ================= LOAD PROFILE =================
async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.status === 401) {
            logoutUser();
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Unable to load profile");
        }

        const user = data.user;

        document.getElementById("profileName").value = user.name;
        document.getElementById("profileEmail").value = user.email;

        // Load existing profile photo
        const preview = document.getElementById("profilePreview");

        if (user.profileImage) {
            preview.src = `${API_BASE_URL}/uploads/${encodeURIComponent(user.profileImage)}`;
        }

        localStorage.setItem("user", JSON.stringify({
            id: user._id,
            name: user.name,
            email: user.email
        }));

    } catch (error) {
        document.getElementById("profileMessage").textContent =
            error.message;
    }
}


// ================= LOGOUT FUNCTION =================
function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
}


// ================= UPDATE PROFILE =================
document.getElementById("profileForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = document.getElementById("profileMessage");

    const name = document.getElementById("profileName").value.trim();
    const email = document.getElementById("profileEmail").value.trim();

    message.textContent = "Updating profile...";

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            method: "PUT",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },

            body: JSON.stringify({ name, email })
        });

        const data = await response.json();

        if (response.status === 401) {
            logoutUser();
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Profile update failed");
        }

        message.textContent = "Profile updated successfully!";
        message.style.color = "green";

        localStorage.setItem("user", JSON.stringify({
            id: data.user._id,
            name: data.user.name,
            email: data.user.email
        }));

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
});


// ================= PHOTO PREVIEW =================
const profileImageInput = document.getElementById("profileImage");
const profilePreview = document.getElementById("profilePreview");
const photoMessage = document.getElementById("photoMessage");

let selectedPhoto = null;

profileImageInput.addEventListener("change", () => {

    const file = profileImageInput.files[0];

    selectedPhoto = null;

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
        photoMessage.textContent = "Only JPG and PNG images are allowed.";
        photoMessage.style.color = "red";
        profileImageInput.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        photoMessage.textContent = "Image size must be less than 2 MB.";
        photoMessage.style.color = "red";
        profileImageInput.value = "";
        return;
    }

    selectedPhoto = file;

    // Show selected image preview
    const imageURL = URL.createObjectURL(file);
    profilePreview.src = imageURL;

    photoMessage.textContent = "Photo selected successfully!";
    photoMessage.style.color = "green";
});


// ================= UPLOAD PROFILE PHOTO =================
document.getElementById("uploadPhotoBtn").addEventListener("click", async () => {

    if (!selectedPhoto) {
        photoMessage.textContent = "Please select a photo first.";
        photoMessage.style.color = "red";
        return;
    }

    const formData = new FormData();

    formData.append("profileImage", selectedPhoto);

    photoMessage.textContent = "Uploading photo...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/auth/profile/photo`,
            {
                method: "PUT",

                headers: {
                    Authorization: `Bearer ${token}`
                },

                body: formData
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            logoutUser();
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Photo upload failed");
        }

        // Display uploaded photo from backend
        profilePreview.src =
            `${API_BASE_URL}/uploads/${encodeURIComponent(data.user.profileImage)}?t=${Date.now()}`;

        photoMessage.textContent = "Profile photo uploaded successfully!";
        photoMessage.style.color = "green";

        selectedPhoto = null;
        profileImageInput.value = "";

    } catch (error) {
        photoMessage.textContent = error.message;
        photoMessage.style.color = "red";
    }
});


// ================= CHANGE PASSWORD =================
document.getElementById("passwordForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const message = document.getElementById("passwordMessage");

    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        message.textContent = "New passwords do not match!";
        message.style.color = "red";
        return;
    }

    if (newPassword.length < 6) {
        message.textContent = "Password must be at least 6 characters!";
        message.style.color = "red";
        return;
    }

    message.textContent = "Changing password...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/auth/change-password`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify({
                    oldPassword,
                    newPassword
                })
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            logoutUser();
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Password change failed");
        }

        message.textContent =
            "Password changed successfully! Please login again.";

        message.style.color = "green";

        document.getElementById("passwordForm").reset();

        setTimeout(() => {
            logoutUser();
        }, 2000);

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
});


// ================= DARK MODE =================
const themeToggle = document.getElementById("themeToggle");

const savedTheme = localStorage.getItem("taskflowTheme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
}

function updateThemeButton() {
    if (document.body.classList.contains("dark-mode")) {
        themeToggle.textContent = "☀️ Light Mode";
    } else {
        themeToggle.textContent = "🌙 Dark Mode";
    }
}

updateThemeButton();

themeToggle.addEventListener("click", () => {

    document.body.classList.toggle("dark-mode");

    const currentTheme =
        document.body.classList.contains("dark-mode")
            ? "dark"
            : "light";

    localStorage.setItem("taskflowTheme", currentTheme);

    updateThemeButton();
});


// ================= INITIAL LOAD =================
loadProfile();
