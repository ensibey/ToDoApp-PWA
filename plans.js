const urlParams = new URLSearchParams(window.location.search);
const selectedDate = urlParams.get('date');

// DOM Elements
const selectedDateElement = document.getElementById('selectedDate');
const selectedWeekdayElement = document.getElementById('selectedWeekday');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const totalTasksElement = document.getElementById('totalTasks');
const completedTasksElement = document.getElementById('completedTasks');
const pendingTasksElement = document.getElementById('pendingTasks');
const filterButtons = document.querySelectorAll('.filter-btn');

// Constants
const PLANS_KEY = 'plannerDatePlans';
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (!selectedDate) {
    showNotification('Geçersiz tarih!', 'warning');
    return;
  }
  
  updateDateDisplay();
  loadPlans();
  setupEventListeners();
});

// Update date display
function updateDateDisplay() {
  const date = new Date(selectedDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  let dateText = '';
  if (date.toDateString() === today.toDateString()) {
    dateText = 'Bugün';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    dateText = 'Yarın';
  } else {
    dateText = date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  selectedDateElement.innerHTML = `<i class="fas fa-calendar-check"></i> ${dateText}`;
  selectedWeekdayElement.textContent = date.toLocaleDateString('tr-TR', { weekday: 'long' });
}

// Setup event listeners
function setupEventListeners() {
  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');
      setFilter(filter);
    });
  });
}

// Add new task
function addTask() {
  const taskText = taskInput.value.trim();
  if (!taskText) {
    showNotification('Lütfen bir görev yazın!', 'warning');
    taskInput.focus();
    return;
  }
  
  const allPlans = getAllPlans();
  if (!allPlans[selectedDate]) allPlans[selectedDate] = [];
  
  const newTask = {
    id: Date.now().toString(),
    text: taskText,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  allPlans[selectedDate].push(newTask);
  savePlans(allPlans);
  
  taskInput.value = '';
  taskInput.focus();
  loadPlans();
  
  showNotification('Görev başarıyla eklendi!', 'success');
}

// Load and display plans
function loadPlans() {
  const allPlans = getAllPlans();
  const tasks = allPlans[selectedDate] || [];
  
  // Update stats
  updateStats(tasks);
  
  // Filter tasks
  const filteredTasks = filterTasks(tasks, currentFilter);
  
  // Show/hide empty state
  if (filteredTasks.length === 0) {
    emptyState.style.display = 'block';
    taskList.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    taskList.style.display = 'block';
  }
  
  // Render tasks
  taskList.innerHTML = filteredTasks.map(task => `
    <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-checkbox">
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')">
        <span class="checkmark"></span>
      </div>
      <div class="task-text">${task.text}</div>
      <div class="task-actions">
        <button class="task-action-btn edit-btn" onclick="editTask('${task.id}')">
          <i class="fas fa-edit"></i>
        </button>
        <button class="task-action-btn delete-btn" onclick="deleteTask('${task.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </li>
  `).join('');
}

// Update task statistics
function updateStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  
  totalTasksElement.textContent = total;
  completedTasksElement.textContent = completed;
  pendingTasksElement.textContent = pending;
}

// Filter tasks based on current filter
function filterTasks(tasks, filter) {
  switch(filter) {
    case 'active':
      return tasks.filter(task => !task.completed);
    case 'completed':
      return tasks.filter(task => task.completed);
    default:
      return tasks;
  }
}

// Set current filter
function setFilter(filter) {
  currentFilter = filter;
  
  // Update active button
  filterButtons.forEach(button => {
    if (button.getAttribute('data-filter') === filter) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  loadPlans();
}

// Toggle task completion
function toggleTask(taskId) {
  const allPlans = getAllPlans();
  const taskIndex = allPlans[selectedDate].findIndex(task => task.id === taskId);
  
  if (taskIndex !== -1) {
    allPlans[selectedDate][taskIndex].completed = !allPlans[selectedDate][taskIndex].completed;
    savePlans(allPlans);
    loadPlans();
  }
}

// Edit task
function editTask(taskId) {
  const allPlans = getAllPlans();
  const taskIndex = allPlans[selectedDate].findIndex(task => task.id === taskId);
  
  if (taskIndex !== -1) {
    const currentText = allPlans[selectedDate][taskIndex].text;
    const newText = prompt('Görevi düzenleyin:', currentText);
    
    if (newText !== null && newText.trim() !== '') {
      allPlans[selectedDate][taskIndex].text = newText.trim();
      savePlans(allPlans);
      loadPlans();
      showNotification('Görev başarıyla güncellendi!', 'success');
    }
  }
}

// Delete task
function deleteTask(taskId) {
  if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) return;
  
  const allPlans = getAllPlans();
  allPlans[selectedDate] = allPlans[selectedDate].filter(task => task.id !== taskId);
  savePlans(allPlans);
  loadPlans();
  
  showNotification('Görev başarıyla silindi!', 'info');
}

// Helper functions
function getAllPlans() {
  return JSON.parse(localStorage.getItem(PLANS_KEY) || '{}');
}

function savePlans(plans) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${getNotificationIcon(type)}"></i>
      <span>${message}</span>
    </div>
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Show with animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function getNotificationIcon(type) {
  switch(type) {
    case 'success': return 'check-circle';
    case 'warning': return 'exclamation-triangle';
    case 'error': return 'times-circle';
    default: return 'info-circle';
  }
}