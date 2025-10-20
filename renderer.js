const datePicker = document.getElementById('datePicker');
const viewPlans = document.getElementById('viewPlans');
const themeToggle = document.getElementById('themeToggle');
const quickButtons = document.querySelectorAll('.quick-btn');
const recentPlansContainer = document.getElementById('recentPlans');

// Set today's date as default
datePicker.valueAsDate = new Date();

// View plans button event
viewPlans.addEventListener('click', () => {
  const date = datePicker.value;
  if (!date) {
    showNotification('Önce bir tarih seçin!', 'warning');
    return;
  }
  window.location.href = `plans.html?date=${date}`;
});

// Quick date buttons
quickButtons.forEach(button => {
  button.addEventListener('click', () => {
    const offset = parseInt(button.getAttribute('data-offset'));
    const date = new Date();
    date.setDate(date.getDate() + offset);
    
    const formattedDate = date.toISOString().split('T')[0];
    datePicker.value = formattedDate;
    
    // Auto-navigate to plans if it's today or tomorrow
    if (offset <= 1) {
      window.location.href = `plans.html?date=${formattedDate}`;
    }
  });
});

// Theme toggle functionality
themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Update icon
  const icon = themeToggle.querySelector('i');
  icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
});

// Load saved theme
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Set correct icon
  const icon = themeToggle.querySelector('i');
  icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Load recent plans
function loadRecentPlans() {
  const PLANS_KEY = 'plannerDatePlans';
  const allPlans = JSON.parse(localStorage.getItem(PLANS_KEY) || '{}');
  
  // Get dates with plans, sorted by most recent
  const planDates = Object.keys(allPlans)
    .filter(date => allPlans[date].length > 0)
    .sort((a, b) => new Date(b) - new Date(a))
    .slice(0, 5); // Show only 5 most recent
  
  if (planDates.length === 0) {
    recentPlansContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar-plus"></i>
        <p>Henüz hiç planınız yok</p>
        <p>İlk planınızı oluşturmak için bir tarih seçin</p>
      </div>
    `;
    return;
  }
  
  recentPlansContainer.innerHTML = planDates.map(date => {
    const taskCount = allPlans[date].length;
    const formattedDate = formatDateForDisplay(date);
    
    return `
      <div class="recent-plan-item" onclick="navigateToDate('${date}')">
        <div class="recent-plan-date">${formattedDate}</div>
        <div class="recent-plan-count">${taskCount} görev</div>
      </div>
    `;
  }).join('');
}

// Format date for display
function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Bugün';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Yarın';
  } else {
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

// Navigate to selected date
function navigateToDate(date) {
  window.location.href = `plans.html?date=${date}`;
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadRecentPlans();
});