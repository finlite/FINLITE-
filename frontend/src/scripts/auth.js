import { API_URL } from './config.js';

// Helper for consistent toasts
const showToast = (message, type = 'info') => {
    let backgroundColor;
    switch (type) {
        case 'success':
            backgroundColor = "linear-gradient(to right, #00b09b, #96c93d)";
            break;
        case 'error':
            backgroundColor = "linear-gradient(to right, #ff5f6d, #ffc371)";
            break;
        default:
            backgroundColor = "linear-gradient(to right, #00b09b, #96c93d)";
    }

    Toastify({
        text: message,
        duration: 3000,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background: backgroundColor,
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
        },
    }).showToast();
};

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

// Password Visibility Toggle Logic
function setupPasswordToggle(toggleId, inputId) {
    const toggleElement = document.getElementById(toggleId);
    const inputElement = document.getElementById(inputId);

    if (toggleElement && inputElement) {
        toggleElement.addEventListener('click', () => {
            const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
            inputElement.setAttribute('type', type);

            // Toggle icon class
            // Check current class to toggle correctly
            if (toggleElement.classList.contains('ph-eye')) {
                toggleElement.classList.remove('ph-eye');
                toggleElement.classList.add('ph-eye-slash');
            } else {
                toggleElement.classList.remove('ph-eye-slash');
                toggleElement.classList.add('ph-eye');
            }
        });
    }
}

// Initialize toggles
setupPasswordToggle('toggle-login-password', 'login-password');
setupPasswordToggle('toggle-signup-password', 'signup-password');
setupPasswordToggle('toggle-confirm-password', 'confirm-password');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('login-password').value;
        const submitButton = loginForm.querySelector('button[type="submit"]');

        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        try {
            // Show loading state
            const originalButtonText = submitButton.innerText;
            submitButton.innerText = 'Logging in...';
            submitButton.disabled = true;

            const response = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showToast('Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'sales.html';
                }, 1000); // Wait a second for the toast
            } else {
                showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            submitButton.innerText = 'Log In';
            submitButton.disabled = false;
        }
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const submitButton = signupForm.querySelector('button[type="submit"]');

        if (!fullName || !email || !password || !confirmPassword) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        try {
            // Show loading state
            const originalButtonText = submitButton.innerText;
            submitButton.innerText = 'Signing Up...';
            submitButton.disabled = true;

            const response = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ full_name: fullName, email, phone, password })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Registration successful! Please login.', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                showToast(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Error registering:', error);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            submitButton.innerText = 'Sign Up';
            submitButton.disabled = false;
        }
    });
}
