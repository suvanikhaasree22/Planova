/**
 * PLANOVA - Vanilla JavaScript Application Logic
 * Brand: PLANOVA | Tagline: Plan less. Accomplish more.
 * 
 * Architecture:
 * - Reactive Application State
 * - API Client (Fetch with JWT)
 * - Glassmorphism Modal Controller
 * - Dynamic Task Card Renderer & Filters
 * - Toast Notification System
 */

// Application State
const state = {
  token: localStorage.getItem('planova_token') || null,
  user: JSON.parse(localStorage.getItem('planova_user') || 'null'),
  tasks: [],
  stats: { total: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0 },
  activeSection: 'overview',
  activeFilter: 'All',
  searchQuery: '',
  pendingDeleteTaskId: null,
  isEditing: false
};

// ================= API SERVICE =================
const API = {
  baseUrl: '', // Same origin as backend

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      const data = await res.json();

      // If token expired or unauthorized
      if (res.status === 401) {
        if (state.token) {
          showToast('Session expired. Please sign in again.', 'warning', 'Authentication');
          Auth.logout();
        }
        throw new Error(data.message || 'Unauthorized');
      }

      if (!res.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  },

  // Auth Endpoints
  register(payload) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  login(payload) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getMe() {
    return this.request('/api/auth/me', { method: 'GET' });
  },

  // Task Endpoints
  getTasks() {
    return this.request('/api/tasks', { method: 'GET' });
  },

  createTask(payload) {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateTask(id, payload) {
    return this.request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  deleteTask(id) {
    return this.request(`/api/tasks/${id}`, {
      method: 'DELETE'
    });
  }
};

// ================= TOAST NOTIFICATION SYSTEM =================
function showToast(message, type = 'info', title = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Select appropriate icon
  let iconSvg = '';
  let defaultTitle = 'Notification';

  if (type === 'success') {
    defaultTitle = 'Success';
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === 'error') {
    defaultTitle = 'Error';
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else if (type === 'warning') {
    defaultTitle = 'Notice';
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else {
    defaultTitle = 'PLANOVA';
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-content">
      <div class="toast-title">${title || defaultTitle}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" aria-label="Dismiss">&times;</button>
  `;

  // Close button action
  const closeBtn = toast.querySelector('.toast-close');
  const removeToast = () => {
    toast.classList.add('hiding');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  };

  closeBtn.addEventListener('click', removeToast);

  container.appendChild(toast);

  // Auto remove after 3.8 seconds
  setTimeout(removeToast, 3800);
}

// ================= AUTH CONTROLLER =================
const Auth = {
  init() {
    // Tab Switching
    const tabLogin = document.getElementById('tab-login-btn');
    const tabRegister = document.getElementById('tab-register-btn');
    const formLogin = document.getElementById('login-form');
    const formRegister = document.getElementById('register-form');

    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      tabLogin.setAttribute('aria-selected', 'true');
      tabRegister.setAttribute('aria-selected', 'false');
      formLogin.classList.remove('hidden');
      formRegister.classList.add('hidden');
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      tabRegister.setAttribute('aria-selected', 'true');
      tabLogin.setAttribute('aria-selected', 'false');
      formRegister.classList.remove('hidden');
      formLogin.classList.add('hidden');
    });

    // Toggle Password Visibility
    document.querySelectorAll('.btn-toggle-pw').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        const isPassword = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPassword ? 'text' : 'password');
        btn.classList.toggle('active', isPassword);
      });
    });

    // Quick Fill Demo User
    const quickDemoBtn = document.getElementById('btn-quick-demo');
    if (quickDemoBtn) {
      quickDemoBtn.addEventListener('click', () => {
        document.getElementById('login-email').value = 'alex@planova.app';
        document.getElementById('login-password').value = 'planova123';
        showToast('Demo credentials filled! Click Sign In.', 'info', 'Demo Helper');
      });
    }

    // Login Form Submit
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!email || !password) {
        showToast('Please enter both email and password.', 'warning');
        return;
      }

      const submitBtn = document.getElementById('login-submit-btn');
      setLoading(submitBtn, true, 'Signing in...');

      try {
        const data = await API.login({ email, password });
        this.setSession(data.token, data.user);
        showToast(`Welcome back, ${data.user.name}!`, 'success', 'Login Successful');
        App.renderApp();
      } catch (err) {
        // If demo user doesn't exist yet, offer easy creation or clear message
        if (email === 'alex@planova.app' && err.message.includes('Invalid email')) {
          showToast('Demo account not registered yet. Creating it automatically...', 'info', 'First Time Setup');
          try {
            const regData = await API.register({
              name: 'Alex Morgan',
              email: 'alex@planova.app',
              password: 'planova123'
            });
            this.setSession(regData.token, regData.user);
            showToast('Demo account created! Welcome to PLANOVA.', 'success');
            App.renderApp();
            return;
          } catch (regErr) {
            showToast(regErr.message, 'error', 'Registration Failed');
          }
        } else {
          showToast(err.message, 'error', 'Login Failed');
        }
      } finally {
        setLoading(submitBtn, false, 'Sign In to Dashboard');
      }
    });

    // Register Form Submit
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm-password').value;

      if (!name || !email || !password) {
        showToast('Please fill out all required fields.', 'warning');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters long.', 'warning');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match. Please verify.', 'warning');
        return;
      }

      const submitBtn = document.getElementById('register-submit-btn');
      setLoading(submitBtn, true, 'Creating Account...');

      try {
        const data = await API.register({ name, email, password, confirmPassword });
        this.setSession(data.token, data.user);
        showToast('Account created successfully! Welcome to PLANOVA.', 'success', 'Registration Successful');
        App.renderApp();
      } catch (err) {
        showToast(err.message, 'error', 'Registration Error');
      } finally {
        setLoading(submitBtn, false, 'Create Free Account');
      }
    });

    // Logout Action
    const logoutBtn = document.getElementById('btn-logout');
    const profileLogoutBtn = document.getElementById('btn-profile-logout');

    if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
    if (profileLogoutBtn) profileLogoutBtn.addEventListener('click', () => this.logout());
  },

  setSession(token, user) {
    state.token = token;
    state.user = user;
    localStorage.setItem('planova_token', token);
    localStorage.setItem('planova_user', JSON.stringify(user));
  },

  logout() {
    state.token = null;
    state.user = null;
    state.tasks = [];
    localStorage.removeItem('planova_token');
    localStorage.removeItem('planova_user');
    showToast('You have been signed out.', 'info', 'Signed Out');
    App.showAuthScreen();
  }
};

// ================= APPLICATION CONTROLLER =================
const App = {
  init() {
    Auth.init();
    Modal.init();
    Navigation.init();
    Tasks.init();

    // Check if token exists on load
    if (state.token && state.user) {
      this.renderApp();
    } else {
      this.showAuthScreen();
    }

    // Set dynamic date and greeting
    this.updateGreetingAndDate();
  },

  showAuthScreen() {
    document.getElementById('auth-view').classList.remove('hidden');
    document.getElementById('app-view').classList.add('hidden');
  },

  async renderApp() {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');

    this.updateUserProfileUI();
    this.updateGreetingAndDate();

    // Fetch initial task data
    await Tasks.fetchAndRender();
  },

  updateGreetingAndDate() {
    const now = new Date();
    const hours = now.getHours();
    let greeting = 'Good evening 👋';

    if (hours >= 5 && hours < 12) {
      greeting = 'Good morning ☀️';
    } else if (hours >= 12 && hours < 17) {
      greeting = 'Good afternoon 🌤️';
    }

    const greetingHeading = document.getElementById('greeting-heading');
    if (greetingHeading) {
      const firstName = state.user ? state.user.name.split(' ')[0] : '';
      greetingHeading.textContent = firstName ? `${greeting}, ${firstName}` : greeting;
    }

    // Format current date: "Wednesday, Sep 16, 2026"
    const dateOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-US', dateOptions);
    const dateText = document.getElementById('current-date-text');
    if (dateText) dateText.textContent = formattedDate;
  },

  updateUserProfileUI() {
    if (!state.user) return;

    const userInitial = (state.user.name || 'U').charAt(0).toUpperCase();

    // Sidebar Profile
    const sidebarAvatar = document.getElementById('sidebar-user-avatar');
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarEmail = document.getElementById('sidebar-user-email');

    if (sidebarAvatar) sidebarAvatar.textContent = userInitial;
    if (sidebarName) sidebarName.textContent = state.user.name;
    if (sidebarEmail) sidebarEmail.textContent = state.user.email;

    // Profile Section View
    const profileAvatar = document.getElementById('profile-avatar-large');
    const profileName = document.getElementById('profile-full-name');
    const profileEmail = document.getElementById('profile-email-address');
    const profileJoined = document.getElementById('profile-joined-date');

    if (profileAvatar) profileAvatar.textContent = userInitial;
    if (profileName) profileName.textContent = state.user.name;
    if (profileEmail) profileEmail.textContent = state.user.email;

    if (profileJoined && state.user.createdAt) {
      const joinYear = new Date(state.user.createdAt).getFullYear();
      profileJoined.textContent = `Member since ${joinYear}`;
    }
  }
};

// ================= NAVIGATION CONTROLLER =================
const Navigation = {
  init() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = {
      overview: document.getElementById('section-overview'),
      tasks: document.getElementById('section-tasks'),
      completed: document.getElementById('section-completed'),
      profile: document.getElementById('section-profile')
    };

    // Handle sidebar nav click
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const targetSection = link.getAttribute('data-section');
        this.switchSection(targetSection);
        this.closeMobileMenu();
      });
    });

    // Handle Quick Links (e.g. "View All" on overview)
    document.querySelectorAll('[data-switch-section]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const sec = btn.getAttribute('data-switch-section');
        const filter = btn.getAttribute('data-filter');
        this.switchSection(sec);
        if (filter) {
          Tasks.setFilter(filter);
        }
      });
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('btn-mobile-menu');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (mobileMenuBtn && sidebar && overlay) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('hidden');
      });

      overlay.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    }
  },

  switchSection(sectionKey) {
    state.activeSection = sectionKey;

    // Update active nav button
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.toggle('active', link.getAttribute('data-section') === sectionKey);
    });

    // Update visible section
    const allSections = ['overview', 'tasks', 'completed', 'profile'];
    allSections.forEach((key) => {
      const el = document.getElementById(`section-${key}`);
      if (el) {
        if (key === sectionKey) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Refresh display
    Tasks.renderCurrentSection();
  },

  closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.add('hidden');
  }
};

// ================= TASK CONTROLLER =================
const Tasks = {
  init() {
    // Search input listener
    const searchInput = document.getElementById('task-search-input');
    const clearSearchBtn = document.getElementById('btn-clear-search');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        if (clearSearchBtn) {
          clearSearchBtn.classList.toggle('hidden', state.searchQuery === '');
        }
        this.renderTasksGrid();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          state.searchQuery = '';
          clearSearchBtn.classList.add('hidden');
          this.renderTasksGrid();
        }
      });
    }

    // Filter pills
    document.querySelectorAll('.filter-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const filterVal = pill.getAttribute('data-filter');
        this.setFilter(filterVal);
      });
    });

    // Global Add Task Buttons
    const btnSidebarAdd = document.getElementById('btn-sidebar-add-task');
    const btnTopbarAdd = document.getElementById('btn-topbar-add-task');
    const btnEmptyAdd = document.getElementById('btn-empty-add-task');

    if (btnSidebarAdd) btnSidebarAdd.addEventListener('click', () => Modal.openAddTaskModal());
    if (btnTopbarAdd) btnTopbarAdd.addEventListener('click', () => Modal.openAddTaskModal());
    if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', () => Modal.openAddTaskModal());
  },

  setFilter(filterVal) {
    state.activeFilter = filterVal;
    document.querySelectorAll('.filter-pill').forEach((pill) => {
      pill.classList.toggle('active', pill.getAttribute('data-filter') === filterVal);
    });
    this.renderTasksGrid();
  },

  async fetchAndRender() {
    try {
      const data = await API.getTasks();
      state.tasks = data.tasks || [];
      state.stats = data.stats || { total: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0 };

      this.updateStatsUI();
      this.renderCurrentSection();
    } catch (err) {
      showToast('Could not load tasks from server.', 'error', 'Data Sync');
    }
  },

  updateStatsUI() {
    // Compute stats from state.tasks
    const total = state.tasks.length;
    const completed = state.tasks.filter((t) => t.status === 'Completed').length;
    const pending = state.tasks.filter((t) => t.status === 'Pending').length;
    const inProgress = state.tasks.filter((t) => t.status === 'In Progress').length;
    const now = new Date();

    const overdue = state.tasks.filter((t) => {
      if (!t.dueDate || t.status === 'Completed') return false;
      const due = new Date(t.dueDate);
      return due < now;
    }).length;

    // Overview Stats Cards
    const elTotal = document.getElementById('stat-total');
    const elCompleted = document.getElementById('stat-completed');
    const elPending = document.getElementById('stat-pending');
    const elOverdue = document.getElementById('stat-overdue');

    if (elTotal) elTotal.textContent = total;
    if (elCompleted) elCompleted.textContent = completed;
    if (elPending) elPending.textContent = pending + inProgress;
    if (elOverdue) elOverdue.textContent = overdue;

    // Nav Count Badges
    const badgeTaskCount = document.getElementById('badge-nav-task-count');
    const badgeCompletedCount = document.getElementById('badge-nav-completed-count');
    if (badgeTaskCount) badgeTaskCount.textContent = total;
    if (badgeCompletedCount) badgeCompletedCount.textContent = completed;

    // Completed View Header Pill
    const completedViewCount = document.getElementById('completed-view-count');
    if (completedViewCount) completedViewCount.textContent = completed;

    // Productivity Progress Calculation
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const progressFill = document.getElementById('progress-fill-bar');
    const progressPill = document.getElementById('progress-percentage');
    const progressSubtitle = document.getElementById('progress-subtitle');

    if (progressFill) progressFill.style.width = `${rate}%`;
    if (progressPill) progressPill.textContent = `${rate}%`;
    if (progressSubtitle) {
      if (rate === 100 && total > 0) {
        progressSubtitle.textContent = 'Outstanding! All tasks completed. Time to relax! 🚀';
      } else if (rate >= 50) {
        progressSubtitle.textContent = `Great progress! You have completed ${rate}% of your tasks.`;
      } else {
        progressSubtitle.textContent = `Keep going! You have completed ${rate}% of your tasks.`;
      }
    }

    // Profile Stats Box
    const pTotal = document.getElementById('profile-stat-total');
    const pCompleted = document.getElementById('profile-stat-completed');
    const pRate = document.getElementById('profile-stat-rate');

    if (pTotal) pTotal.textContent = total;
    if (pCompleted) pCompleted.textContent = completed;
    if (pRate) pRate.textContent = `${rate}%`;
  },

  renderCurrentSection() {
    if (state.activeSection === 'overview') {
      this.renderOverviewLists();
    } else if (state.activeSection === 'tasks') {
      this.renderTasksGrid();
    } else if (state.activeSection === 'completed') {
      this.renderCompletedGrid();
    }
  },

  renderOverviewLists() {
    const highPriorityContainer = document.getElementById('overview-high-priority-list');
    const pendingContainer = document.getElementById('overview-pending-list');

    if (!highPriorityContainer || !pendingContainer) return;

    // High priority active tasks
    const highPriorityTasks = state.tasks
      .filter((t) => t.priority === 'High' && t.status !== 'Completed')
      .slice(0, 4);

    if (highPriorityTasks.length === 0) {
      highPriorityContainer.innerHTML = `
        <div class="glass-card compact-task-item" style="color: var(--text-dim); justify-content: center;">
          No pending high-priority tasks
        </div>`;
    } else {
      highPriorityContainer.innerHTML = highPriorityTasks.map((t) => this.renderCompactTaskHtml(t)).join('');
    }

    // Pending & Due Soon tasks
    const pendingTasks = state.tasks
      .filter((t) => t.status !== 'Completed')
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        return 0;
      })
      .slice(0, 4);

    if (pendingTasks.length === 0) {
      pendingContainer.innerHTML = `
        <div class="glass-card compact-task-item" style="color: var(--text-dim); justify-content: center;">
          All tasks are completed!
        </div>`;
    } else {
      pendingContainer.innerHTML = pendingTasks.map((t) => this.renderCompactTaskHtml(t)).join('');
    }

    // Bind click events on compact items to toggle complete or view
    this.bindCardEvents(highPriorityContainer);
    this.bindCardEvents(pendingContainer);
  },

  renderCompactTaskHtml(task) {
    const isCompleted = task.status === 'Completed';
    const isOverdue = task.dueDate && !isCompleted && new Date(task.dueDate) < new Date();
    const formattedDate = task.dueDate ? formatShortDate(task.dueDate) : 'No date';

    return `
      <div class="glass-card compact-task-item" data-task-id="${task._id}">
        <div class="compact-task-left">
          <button class="btn-toggle-complete ${isCompleted ? 'checked' : ''}" data-action="toggle" data-id="${task._id}" aria-label="Toggle Complete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
          <div style="min-width: 0;">
            <div class="compact-task-title ${isCompleted ? 'is-completed' : ''}">${escapeHtml(task.title)}</div>
            <div class="compact-task-meta">
              <span>${escapeHtml(task.category || 'General')}</span>
              <span>•</span>
              <span class="${isOverdue ? 'task-due-date is-overdue' : ''}">${formattedDate}</span>
            </div>
          </div>
        </div>
        <div>
          <span class="badge badge-priority-${task.priority.toLowerCase()}">${task.priority}</span>
        </div>
      </div>
    `;
  },

  renderTasksGrid() {
    const container = document.getElementById('tasks-container');
    const emptyState = document.getElementById('empty-tasks-state');
    if (!container) return;

    // Filter tasks
    let filtered = [...state.tasks];

    // Filter pill logic
    if (state.activeFilter === 'Pending') {
      filtered = filtered.filter((t) => t.status === 'Pending');
    } else if (state.activeFilter === 'In Progress') {
      filtered = filtered.filter((t) => t.status === 'In Progress');
    } else if (state.activeFilter === 'Completed') {
      filtered = filtered.filter((t) => t.status === 'Completed');
    } else if (state.activeFilter === 'High Priority') {
      filtered = filtered.filter((t) => t.priority === 'High');
    }

    // Search query logic
    if (state.searchQuery) {
      filtered = filtered.filter((t) => {
        const title = (t.title || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        return title.includes(state.searchQuery) || desc.includes(state.searchQuery) || cat.includes(state.searchQuery);
      });
    }

    if (filtered.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    container.innerHTML = filtered.map((task) => this.renderTaskCardHtml(task)).join('');

    this.bindCardEvents(container);
  },

  renderCompletedGrid() {
    const container = document.getElementById('completed-tasks-container');
    const emptyState = document.getElementById('empty-completed-state');
    if (!container) return;

    const completed = state.tasks.filter((t) => t.status === 'Completed');

    if (completed.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    container.innerHTML = completed.map((task) => this.renderTaskCardHtml(task)).join('');

    this.bindCardEvents(container);
  },

  renderTaskCardHtml(task) {
    const isCompleted = task.status === 'Completed';
    const isOverdue = task.dueDate && !isCompleted && new Date(task.dueDate) < new Date();
    const formattedDate = task.dueDate ? formatShortDate(task.dueDate) : 'No due date';

    const statusBadgeClass = `badge-status-${task.status.toLowerCase().replace(/\s+/g, '-')}`;
    const priorityBadgeClass = `badge-priority-${task.priority.toLowerCase()}`;

    return `
      <article class="glass-card task-card ${isCompleted ? 'is-completed' : ''}" data-task-id="${task._id}">
        <div>
          <div class="task-card-header">
            <div class="task-card-badges">
              <span class="badge ${priorityBadgeClass}">
                <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="3"></circle></svg>
                ${task.priority}
              </span>
              <span class="badge ${statusBadgeClass}">${task.status}</span>
              <span class="badge badge-category">${escapeHtml(task.category || 'General')}</span>
            </div>

            <!-- Complete Toggle Checkbox -->
            <button class="btn-toggle-complete ${isCompleted ? 'checked' : ''}" data-action="toggle" data-id="${task._id}" title="${isCompleted ? 'Mark as incomplete' : 'Mark as completed'}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
          </div>

          <div class="task-card-body">
            <h4 class="task-title">${escapeHtml(task.title)}</h4>
            ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
          </div>
        </div>

        <div class="task-card-footer">
          <div class="task-due-date ${isOverdue ? 'is-overdue' : ''}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${isOverdue ? 'Overdue: ' : ''}${formattedDate}</span>
          </div>

          <div class="task-card-actions">
            <button class="btn-card-action" data-action="edit" data-id="${task._id}" title="Edit Task" aria-label="Edit Task">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-card-action btn-delete" data-action="delete" data-id="${task._id}" title="Delete Task" aria-label="Delete Task">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  },

  bindCardEvents(container) {
    if (!container) return;

    // Complete button toggle
    container.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.toggleComplete(id);
      });
    });

    // Edit button
    container.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        Modal.openEditTaskModal(id);
      });
    });

    // Delete button
    container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        Modal.openDeleteModal(id);
      });
    });
  },

  async toggleComplete(id) {
    const task = state.tasks.find((t) => t._id === id);
    if (!task) return;

    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';

    try {
      const data = await API.updateTask(id, { status: newStatus });
      // Update local state
      task.status = data.task.status;
      task.updatedAt = data.task.updatedAt;

      showToast(
        newStatus === 'Completed' ? 'Task marked as completed! 🎉' : 'Task marked as pending.',
        'success',
        'Task Status'
      );

      this.updateStatsUI();
      this.renderCurrentSection();
    } catch (err) {
      showToast(err.message || 'Failed to update task status.', 'error');
    }
  }
};

// ================= MODAL CONTROLLER =================
const Modal = {
  init() {
    const taskModal = document.getElementById('task-modal');
    const deleteModal = document.getElementById('delete-modal');
    const taskForm = document.getElementById('task-form');

    // Close buttons
    document.getElementById('btn-close-modal').addEventListener('click', () => this.closeTaskModal());
    document.getElementById('btn-cancel-modal').addEventListener('click', () => this.closeTaskModal());
    document.getElementById('btn-cancel-delete').addEventListener('click', () => this.closeDeleteModal());

    // Backdrop click dismissal
    [taskModal, deleteModal].forEach((m) => {
      if (m) {
        m.addEventListener('click', (e) => {
          if (e.target === m) {
            this.closeTaskModal();
            this.closeDeleteModal();
          }
        });
      }
    });

    // ESC key dismissal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTaskModal();
        this.closeDeleteModal();
      }
    });

    // Task Form Submission (Create or Edit)
    taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const taskId = document.getElementById('task-id-input').value;
      const title = document.getElementById('task-title-input').value.trim();
      const description = document.getElementById('task-desc-input').value.trim();
      const category = document.getElementById('task-category-input').value.trim() || 'General';
      const priority = document.getElementById('task-priority-select').value;
      const status = document.getElementById('task-status-select').value;
      const dueDate = document.getElementById('task-due-date-input').value || null;

      if (!title) {
        showToast('Please provide a task title.', 'warning');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-task');
      setLoading(submitBtn, true, taskId ? 'Saving Changes...' : 'Creating Task...');

      try {
        const payload = { title, description, category, priority, status, dueDate };

        if (taskId) {
          // Edit mode
          const data = await API.updateTask(taskId, payload);
          // Update in local state
          const index = state.tasks.findIndex((t) => t._id === taskId);
          if (index !== -1) state.tasks[index] = data.task;
          showToast('Task updated successfully!', 'success', 'Task Saved');
        } else {
          // Create mode
          const data = await API.createTask(payload);
          state.tasks.unshift(data.task);
          showToast('Task created successfully!', 'success', 'New Task');
        }

        this.closeTaskModal();
        Tasks.updateStatsUI();
        Tasks.renderCurrentSection();
      } catch (err) {
        showToast(err.message || 'Operation failed.', 'error');
      } finally {
        setLoading(submitBtn, false, taskId ? 'Save Changes' : 'Create Task');
      }
    });

    // Confirm Delete Action
    const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', async () => {
        if (!state.pendingDeleteTaskId) return;

        const id = state.pendingDeleteTaskId;
        try {
          await API.deleteTask(id);
          state.tasks = state.tasks.filter((t) => t._id !== id);
          showToast('Task deleted successfully!', 'info', 'Task Deleted');
          this.closeDeleteModal();
          Tasks.updateStatsUI();
          Tasks.renderCurrentSection();
        } catch (err) {
          showToast(err.message || 'Failed to delete task.', 'error');
        }
      });
    }
  },

  openAddTaskModal() {
    state.isEditing = false;
    document.getElementById('modal-title').textContent = 'Create New Task';
    document.getElementById('btn-submit-task').querySelector('.btn-text').textContent = 'Create Task';

    // Reset fields
    document.getElementById('task-id-input').value = '';
    document.getElementById('task-title-input').value = '';
    document.getElementById('task-desc-input').value = '';
    document.getElementById('task-category-input').value = '';
    document.getElementById('task-priority-select').value = 'Medium';
    document.getElementById('task-status-select').value = 'Pending';
    document.getElementById('task-due-date-input').value = '';

    document.getElementById('task-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('task-title-input').focus(), 50);
  },

  openEditTaskModal(id) {
    const task = state.tasks.find((t) => t._id === id);
    if (!task) return;

    state.isEditing = true;
    document.getElementById('modal-title').textContent = 'Edit Task';
    document.getElementById('btn-submit-task').querySelector('.btn-text').textContent = 'Save Changes';

    document.getElementById('task-id-input').value = task._id;
    document.getElementById('task-title-input').value = task.title || '';
    document.getElementById('task-desc-input').value = task.description || '';
    document.getElementById('task-category-input').value = task.category || '';
    document.getElementById('task-priority-select').value = task.priority || 'Medium';
    document.getElementById('task-status-select').value = task.status || 'Pending';

    if (task.dueDate) {
      const dateStr = new Date(task.dueDate).toISOString().split('T')[0];
      document.getElementById('task-due-date-input').value = dateStr;
    } else {
      document.getElementById('task-due-date-input').value = '';
    }

    document.getElementById('task-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('task-title-input').focus(), 50);
  },

  closeTaskModal() {
    document.getElementById('task-modal').classList.add('hidden');
  },

  openDeleteModal(id) {
    const task = state.tasks.find((t) => t._id === id);
    if (!task) return;

    state.pendingDeleteTaskId = id;
    const descEl = document.getElementById('delete-modal-text');
    if (descEl) {
      descEl.textContent = `Are you sure you want to permanently delete "${task.title}"? This action cannot be undone.`;
    }
    document.getElementById('delete-modal').classList.remove('hidden');
  },

  closeDeleteModal() {
    state.pendingDeleteTaskId = null;
    document.getElementById('delete-modal').classList.add('hidden');
  }
};

// ================= UTILITIES & HELPERS =================
function setLoading(button, isLoading, text = '') {
  if (!button) return;
  const spinner = button.querySelector('.btn-spinner');
  const btnText = button.querySelector('.btn-text');

  if (isLoading) {
    button.disabled = true;
    if (spinner) spinner.classList.remove('hidden');
    if (btnText && text) btnText.textContent = text;
  } else {
    button.disabled = false;
    if (spinner) spinner.classList.add('hidden');
    if (btnText && text) btnText.textContent = text;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
