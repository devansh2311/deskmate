import api from '../utils/api';

class AuthService {
  login(username, password) {
    return api.post('/auth/login', {
      username,
      password
    })
    .then(response => {
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        // Dispatch a custom event to notify components about the authentication change
        window.dispatchEvent(new Event('auth-change'));
      }
      return response.data;
    });
  }

  logout() {
    localStorage.removeItem('user');
    // Dispatch a custom event to notify components about the authentication change
    window.dispatchEvent(new Event('auth-change'));
    // Force a refresh of the page to ensure all components update
    window.location.href = '/login';
  }

  register(username, email, password, name, department, designation, contact) {
    return api.post('/auth/register', {
      username,
      email,
      password,
      name,
      department,
      designation,
      contact
    });
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  }

  isAuthenticated() {
    const user = this.getCurrentUser();
    return !!user;
  }
}

export default new AuthService();
