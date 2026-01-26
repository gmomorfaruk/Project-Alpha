// ===== AUTHENTICATION HELPERS =====

// Forgot Password Modal Functions
function showForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').classList.add('active');
}

function closeForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').classList.remove('active');
    // Reset the form
    document.getElementById('forgotPasswordForm').reset();
    document.getElementById('resetStep1').style.display = 'block';
    document.getElementById('resetStep2').style.display = 'none';
    document.getElementById('resetStep3').style.display = 'none';
}

// Step 1: Verify email exists
function verifyEmail() {
    const email = document.getElementById('resetEmail').value.trim();
    
    if (!email) {
        showToast('Please enter your email address', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    // Check if user exists
    const users = Storage.get('users') || [];
    const user = users.find(u => u.email === email);
    
    if (!user) {
        showToast('No account found with this email address', 'error');
        return;
    }
    
    // Store email for later use
    document.getElementById('forgotPasswordForm').dataset.email = email;
    
    // Show step 2 (phone verification)
    document.getElementById('resetStep1').style.display = 'none';
    document.getElementById('resetStep2').style.display = 'block';
    
    // Show hint about phone number
    const phoneHint = user.phone ? 
        `Enter the phone number ending with ${user.phone.slice(-4)}` : 
        'Enter your registered phone number';
    document.getElementById('phoneHint').textContent = phoneHint;
    
    showToast('Email verified! Please verify your phone number', 'success');
}

// Step 2: Verify phone number
function verifyPhone() {
    const phone = document.getElementById('resetPhone').value.trim();
    const email = document.getElementById('forgotPasswordForm').dataset.email;
    
    if (!phone) {
        showToast('Please enter your phone number', 'error');
        return;
    }
    
    // Get user
    const users = Storage.get('users') || [];
    const user = users.find(u => u.email === email);
    
    if (!user) {
        showToast('User not found', 'error');
        return;
    }
    
    // Normalize phone numbers for comparison
    const normalizePhone = (p) => p.replace(/[\s\-\+]/g, '').replace(/^880/, '0').replace(/^0/, '');
    
    if (normalizePhone(user.phone) !== normalizePhone(phone)) {
        showToast('Phone number does not match our records', 'error');
        return;
    }
    
    // Show step 3 (new password)
    document.getElementById('resetStep2').style.display = 'none';
    document.getElementById('resetStep3').style.display = 'block';
    
    showToast('Phone verified! Create your new password', 'success');
}

// Step 3: Reset password
async function resetPassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    const email = document.getElementById('forgotPasswordForm').dataset.email;
    
    // Validate password
    if (!newPassword) {
        showToast('Please enter a new password', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Check for strong password (optional enhancement)
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    
    if (!(hasUpperCase || hasLowerCase) || !hasNumbers) {
        showToast('Password should contain letters and numbers', 'warning');
        // Still allow, just warn
    }
    
    if (newPassword !== confirmNewPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    // Update password
    const users = Storage.get('users') || [];
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) {
        showToast('User not found', 'error');
        return;
    }
    
    users[userIndex].password = await Security.hashPasswordAsync(newPassword);
    Storage.set('users', users);
    
    showToast('Password reset successfully! You can now login', 'success');
    
    // Close modal and redirect to login
    setTimeout(() => {
        closeForgotPasswordModal();
    }, 1500);
}

// Go back to previous step
function goBackStep(currentStep) {
    if (currentStep === 2) {
        document.getElementById('resetStep2').style.display = 'none';
        document.getElementById('resetStep1').style.display = 'block';
    } else if (currentStep === 3) {
        document.getElementById('resetStep3').style.display = 'none';
        document.getElementById('resetStep2').style.display = 'block';
    }
}

// Password strength indicator
function checkPasswordStrength(password) {
    let strength = 0;
    const indicators = {
        length: password.length >= 6,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    strength = Object.values(indicators).filter(Boolean).length;
    
    const strengthBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (strengthBar && strengthText) {
        const percentage = (strength / 5) * 100;
        strengthBar.style.width = percentage + '%';
        
        if (strength <= 2) {
            strengthBar.style.background = '#ef4444';
            strengthText.textContent = 'Weak';
            strengthText.style.color = '#ef4444';
        } else if (strength <= 3) {
            strengthBar.style.background = '#f59e0b';
            strengthText.textContent = 'Medium';
            strengthText.style.color = '#f59e0b';
        } else {
            strengthBar.style.background = '#10b981';
            strengthText.textContent = 'Strong';
            strengthText.style.color = '#10b981';
        }
    }
    
    return indicators;
}

// Export functions globally
window.showForgotPasswordModal = showForgotPasswordModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.verifyEmail = verifyEmail;
window.verifyPhone = verifyPhone;
window.resetPassword = resetPassword;
window.goBackStep = goBackStep;
window.checkPasswordStrength = checkPasswordStrength;
