document.addEventListener('DOMContentLoaded', function() {
  const isValidEmail = (email) => {
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.value = email;
    return emailInput.checkValidity();
  };

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      let valid = true;

      const email         = document.getElementById('email').value.trim();
      const password      = document.getElementById('password').value.trim();
      const emailError    = document.getElementById('email-error');
      const passwordError = document.getElementById('password-error');

      emailError.textContent    = '';
      passwordError.textContent = '';

      if (!email) {
        emailError.textContent = 'Email is required';
        valid = false;
      } else {
        if (!isValidEmail(email)) {
          emailError.textContent = 'Please enter a valid email';
          valid = false;
        }
      }

      if (!password) {
        passwordError.textContent = 'Password is required';
        valid = false;
      } else if (password.length < 8) {
        passwordError.textContent = 'Password must be at least 8 characters';
        valid = false;
      }

      if (!valid) e.preventDefault();
    });
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      let valid = true;

      const firstName            = document.getElementById('firstName').value.trim();
      const lastName             = document.getElementById('lastName').value.trim();
      const email                = document.getElementById('email').value.trim();
      const password             = document.getElementById('password').value.trim();
      const confirmPassword      = document.getElementById('confirmPassword').value.trim();
      const firstNameError       = document.getElementById('firstName-error');
      const lastNameError        = document.getElementById('lastName-error');
      const emailError           = document.getElementById('email-error');
      const passwordError        = document.getElementById('password-error');
      const confirmPasswordError = document.getElementById('confirmPassword-error');

      firstNameError.textContent       = '';
      lastNameError.textContent        = '';
      emailError.textContent           = '';
      passwordError.textContent        = '';
      confirmPasswordError.textContent = '';

      if (!firstName) {
        firstNameError.textContent = 'First name is required';
        valid = false;
      } else if (firstName.length < 2 || firstName.length > 20) {
        firstNameError.textContent = 'Must be between 2 and 20 characters';
        valid = false;
      } else if (!/^[a-zA-Z ]+$/.test(firstName)) {
        firstNameError.textContent = 'Must contain only letters';
        valid = false;
      }

      if (!lastName) {
        lastNameError.textContent = 'Last name is required';
        valid = false;
      } else if (lastName.length < 2 || lastName.length > 20) {
        lastNameError.textContent = 'Must be between 2 and 20 characters';
        valid = false;
      } else if (!/^[a-zA-Z ]+$/.test(lastName)) {
        lastNameError.textContent = 'Must contain only letters';
        valid = false;
      }

      if (!email) {
        emailError.textContent = 'Email is required';
        valid = false;
      } else if (!isValidEmail(email)) {
        emailError.textContent = 'Please enter a valid email';
        valid = false;
      }

      if (!password) {
        passwordError.textContent = 'Password is required';
        valid = false;
      } else if (password.length < 8) {
        passwordError.textContent = 'Must be at least 8 characters';
        valid = false;
      } else if (!/[A-Z]/.test(password)) {
        passwordError.textContent = 'Must contain at least one uppercase letter';
        valid = false;
      } else if (!/[a-z]/.test(password)) {
        passwordError.textContent = 'Must contain at least one lowercase letter';
        valid = false;
      } else if (!/[0-9]/.test(password)) {
        passwordError.textContent = 'Must contain at least one number';
        valid = false;
      } else if (!/[!@#$%^&*]/.test(password)) {
        passwordError.textContent = 'Must contain at least one special character (!@#$%^&*)';
        valid = false;
      } else if (/\s/.test(password)) {
        passwordError.textContent = 'Cannot contain spaces';
        valid = false;
      }

      if (!confirmPassword) {
        confirmPasswordError.textContent = 'Please confirm your password';
        valid = false;
      } else if (password !== confirmPassword) {
        confirmPasswordError.textContent = 'Passwords do not match';
        valid = false;
      }

      if (!valid) e.preventDefault();
    });
  }

});
