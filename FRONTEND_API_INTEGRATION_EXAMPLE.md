// ==================== EXAMPLE: Updated Login Component with API Call ====================
// Path: components/Auth/Login.tsx

// Replace the handleSubmit function with this:

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    // Call backend login API
    const response = await loginUser({
      email: formData.email,
      password: formData.password,
    });

    // Save user to localStorage
    saveUserToStorage(response.user);

    // Call parent callback
    onLogin(response.user);

    // Reset form
    setFormData({ email: '', password: '' });
  } catch (err: any) {
    setError(err.message || 'Login failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

// ==================== EXAMPLE: Updated Signup Component with API Call ====================
// Path: components/Auth/Signup.tsx

// Replace the handleSignup function with this:

const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setGeneralError('');

  try {
    // 1. Validate Password Match
    if (formData.password !== formData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // 2. Validate Password Length
    if (formData.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // 3. Validate Email Format
    if (!validateEmail(formData.email)) {
      throw new Error('Please enter a valid email address');
    }

    // 4. Call backend signup API
    const response = await signupUser({
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    // Show success message
    alert('Registration successful! Your account has been created.');

    // Reset form
    setFormData({
      fullName: '',
      mobile: '',
      email: '',
      workType: 'Helper',
      age: '',
      aadharNumber: '',
      password: '',
      confirmPassword: ''
    });

    // Switch to login
    onSwitchToLogin();
  } catch (err: any) {
    setGeneralError(err.message || 'Signup failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

// ==================== IMPORTS NEEDED ====================
// Add these imports to your Login.tsx:
// import { loginUser, saveUserToStorage } from '../../services/authService';

// Add these imports to your Signup.tsx:
// import { signupUser } from '../../services/authService';
