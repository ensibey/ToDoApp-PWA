// DOM Elementleri
const datePicker = document.getElementById('datePicker');
const viewPlans = document.getElementById('viewPlans');
const themeToggle = document.getElementById('themeToggle');
const quickButtons = document.querySelectorAll('.quick-btn');
const recentPlansContainer = document.getElementById('recentPlans');

// Başlatma
document.addEventListener('DOMContentLoaded', () => {
  // Bugünün tarihini varsayılan yap
  datePicker.valueAsDate = new Date();

  // Temayı yükle
  loadTheme();

  // Son planları yükle
  loadRecentPlans();

  // Olay dinleyicilerini ayarla
  setupEventListeners();

  // Service Worker'ı kaydet
  registerServiceWorker();
});

function setupEventListeners() {
  // Planları gör butonu
  viewPlans.addEventListener('click', () => {
    const date = datePicker.value;
    if (!date) {
      showNotification('Önce bir tarih seçin!', 'warning');
      return;
    }
    window.location.href = `plans.html?date=${date}`;
  });

  // Hızlı tarih butonları
  quickButtons.forEach(button => {
    button.addEventListener('click', () => {
      const offset = parseInt(button.getAttribute('data-offset'));
      const date = new Date();
      date.setDate(date.getDate() + offset);
      
      const formattedDate = date.toISOString().split('T')[0];
      datePicker.value = formattedDate;
      
      // Bugün veya yarın ise otomatik yönlendir
      if (offset <= 1) {
        window.location.href = `plans.html?date=${formattedDate}`;
      }
    });
  });

  // Tema değiştirme
  themeToggle.addEventListener('click', toggleTheme);
}

// Kayıtlı temayı yükler
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light'; // Varsayılan light
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const icon = themeToggle.querySelector('i');
  icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Tema değiştirme işlevi
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  const icon = themeToggle.querySelector('i');
  icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Son planları yükle
function loadRecentPlans() {
  const PLANS_KEY = 'plannerDatePlans';
  let allPlans = {};
  try {
      allPlans = JSON.parse(localStorage.getItem(PLANS_KEY) || '{}');
  } catch (e) {
      console.error("localStorage okunurken hata oluştu:", e);
      // Hata durumunda boş obje ile devam et
  }

  // Planı olan tarihleri al, en yeniden eskiye sırala
  const planDates = Object.keys(allPlans)
    .filter(date => Array.isArray(allPlans[date]) && allPlans[date].length > 0)
    .sort((a, b) => new Date(b) - new Date(a))
    .slice(0, 5); // Sadece en son 5
  
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
    const tasks = allPlans[date];
    const taskCount = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const formattedDate = formatDateForDisplay(date);
    
    return `
      <div class="recent-plan-item" onclick="navigateToDate('${date}')">
        <div>
            <div class="recent-plan-date">${formattedDate}</div>
            <div style="font-size: 0.8rem; opacity: 0.7;">${completedCount} / ${taskCount} tamamlandı</div>
        </div>
        <div class="recent-plan-count">${taskCount} görev</div>
      </div>
    `;
  }).join('');
}

// Tarihi görüntülemek için formatla
function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Saat farklarını sıfırla
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  
  if (date.getTime() === today.getTime()) {
    return 'Bugün';
  } else if (date.getTime() === tomorrow.getTime()) {
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

// Seçilen tarihe git
function navigateToDate(date) {
  window.location.href = `plans.html?date=${date}`;
}

// Bildirim göster (plans.js'ten kopyalandı)
function showNotification(message, type = 'info') {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  let icon = 'fas fa-info-circle';
  if (type === 'success') icon = 'fas fa-check-circle';
  if (type === 'warning') icon = 'fas fa-exclamation-triangle';
  if (type === 'error') icon = 'fas fa-times-circle';
  
  notification.innerHTML = `
    <div class="notification-content">
      <i class="${icon}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
}

// Service Worker Kaydı
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
          console.log('ServiceWorker kaydı başarılı, scope: ', registration.scope);
        })
        .catch(error => {
          console.log('ServiceWorker kaydı başarısız: ', error);
        });
    });
  }
}