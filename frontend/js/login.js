document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const loginBtn = document.getElementById('login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const loader = loginBtn.querySelector('.loader');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Reset state
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';
        loginBtn.disabled = true;
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        
        try {
            const response = await fetch('/api/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            if (response.ok) {
                // Successful login
                window.location.href = 'chat.html';
            } else {
                let errorText = 'Login failed. Please check your credentials.';
                try {
                    const errorData = await response.json();
                    errorText = errorData.error || errorData.detail || errorText;
                } catch (e) {
                    // Ignore JSON parse error if response is not JSON
                }
                showError(errorText);
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please try again later.');
        } finally {
            loginBtn.disabled = false;
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    });
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
});
