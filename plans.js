/**
 * Planner Pro - Planlar Sayfası JavaScript
 * Bu dosya planlar sayfasının işlevselliğini yönetir
 */

// DOM Elementleri
const pageDate = document.getElementById('pageDate');
const pageDescription = document.getElementById('pageDescription');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const emptyTasks = document.getElementById('emptyTasks');
const filterButtons = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('themeToggle');

// İstatistik Elementleri
const totalTasks = document.getElementById('totalTasks');
const completedTasks = document.getElementById('completedTasks');
const pendingTasks = document.getElementById('pendingTasks');
const completionRate = document.getElementById('completionRate');
const tasksCount = document.getElementById('tasksCount');

// Uygulama durumu
let currentDate = '';
let currentFilter = 'all';
let tasks = [];

// Uygulama başlatma
document.addEventListener('DOMContentLoaded', () => {
  console.log('Planlar sayfası başlatılıyor...');
  
  // URL parametrelerini al
  const urlParams = new URLSearchParams(window.location.search);
  currentDate = urlParams.get('date');
  
  if (!currentDate || !isValidDate(currentDate)) {
    showNotification('Geçersiz tarih! Ana sayfaya yönlendiriliyorsunuz.', 'error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return;
  }
  
  // Tema yükle
  loadTheme();
  
  // Sayfayı başlat
  initializePage();
  
  // Olay dinleyicilerini ayarla
  setupEventListeners();

  // Service Worker'ı kaydet
  registerServiceWorker();
  
  console.log('Planlar sayfası başarıyla başlatıldı:', currentDate);
});

/**
 * Sayfayı başlatır
 */
function initializePage() {
  // Tarih bilgisini güncelle
  updateDateDisplay();
  
  // Görevleri yükle
  loadTasks();
  
  // İstatistikleri güncelle
  updateStatistics();
  
  // Görev listesini render et
  renderTaskList();
}

/**
 * Tüm olay dinleyicilerini ayarlar
 */
function setupEventListeners() {
  // Görev ekleme
  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Form gönderimini engelle
        addTask();
    }
  });
  
  // Tema değiştirme
  themeToggle.addEventListener('click', toggleTheme);
  
  // Filtre butonları
  filterButtons.forEach(button => {
    button.addEventListener('click', handleFilterChange);
  });
  
  // Input sınır kontrolü
  taskInput.addEventListener('input', () => {
    const maxLength = 200;
    const currentLength = taskInput.value.length;
    
    if (currentLength > maxLength * 0.9) {
      taskInput.style.borderColor = 'var(--warning-color)';
    } else {
      taskInput.style.borderColor = ''; // Varsayılan renge dön
    }
  });
}

/**
 * Tarih görüntüsünü günceller
 */
function updateDateDisplay() {
  const dateObj = new Date(currentDate);
  const formattedDate = formatDetailedDate(dateObj);
  
  pageDate.textContent = formattedDate;
  pageDescription.textContent = `${formattedDate} tarihi için planlarınız`;
  
  document.title = `Planner Pro | ${formattedDate}`;
}

/**
 * Tarihi detaylı biçimde formatlar
 */
function formatDetailedDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  
  const dayDiff = Math.floor((dateObj - today) / (1000 * 60 * 60 * 24));
  
  let dayInfo = '';
  if (dayDiff === 0) dayInfo = ' (Bugün)';
  else if (dayDiff === 1) dayInfo = ' (Yarın)';
  else if (dayDiff === -1) dayInfo = ' (Dün)';
  else if (dayDiff > 1) dayInfo = ` (${dayDiff} gün sonra)`;
  else if (dayDiff < -1) dayInfo = ` (${Math.abs(dayDiff)} gün önce)`;
  
  return dateObj.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) + dayInfo;
}

/**
 * Görevleri localStorage'dan yükler
 */
function loadTasks() {
  const PLANS_KEY = 'plannerDatePlans';
  let allPlans = {};
  try {
      allPlans = JSON.parse(localStorage.getItem(PLANS_KEY) || '{}');
  } catch(e) {
      console.error("localStorage okunurken hata oluştu:", e);
      showNotification("Görevler yüklenirken bir hata oluştu.", "error");
      allPlans = {};
  }
  tasks = allPlans[currentDate] || [];
  console.log(`${tasks.length} görev yüklendi`);
}

/**
 * Görevleri localStorage'a kaydeder
 */
function saveTasks() {
  const PLANS_KEY = 'plannerDatePlans';
  let allPlans = {};
  try {
      allPlans = JSON.parse(localStorage.getItem(PLANS_KEY) || '{}');
  } catch(e) {
      console.error("localStorage okunurken hata oluştu:", e);
      allPlans = {}; // Veriyi sıfırla
  }
  
  if (tasks.length > 0) {
    allPlans[currentDate] = tasks;
  } else {
    delete allPlans[currentDate]; // Boşsa tarihi sil
  }
  
  try {
    localStorage.setItem(PLANS_KEY, JSON.stringify(allPlans));
    console.log('Görevler kaydedildi');
  } catch (e) {
    console.error("localStorage'a yazılırken hata oluştu:", e);
    showNotification("Görevler kaydedilemedi!", "error");
  }
}

/**
 * Yeni görev ekler
 */
function addTask() {
  const taskText = taskInput.value.trim();
  
  if (!taskText) {
    showNotification('Lütfen bir görev yazın!', 'warning');
    taskInput.focus();
    return;
  }
  
  if (taskText.length > 200) {
    showNotification('Görev çok uzun! Maksimum 200 karakter.', 'warning');
    return;
  }
  
  // Yeni görev oluştur
  const newTask = {
    id: Date.now().toString(),
    text: taskText,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  
  // Görevleri güncelle
  tasks.unshift(newTask); // Yeni görevler başa eklenir
  saveTasks();
  
  // UI'ı güncelle
  if (currentFilter !== 'completed') {
      renderTaskList(); // Sadece mevcut filtre "tamamlananlar" değilse listeyi güncelle
  } else {
      // Eğer filtre "tamamlananlar" ise, sadece sayacı güncelle
      // ve kullanıcıyı bilgilendir
      showNotification('Yeni görev eklendi (Bekleyenler filtresinde görebilirsiniz)', 'info');
  }
  updateStatistics();
  
  // Input'u temizle
  taskInput.value = '';
  taskInput.focus();
  
  showNotification('Görev başarıyla eklendi!', 'success');
  console.log('Yeni görev eklendi:', newTask);
}

/**
 * Görev durumunu değiştirir
 */
function toggleTaskCompletion(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  
  task.completed = !task.completed;
  task.completedAt = task.completed ? new Date().toISOString() : null;
  
  // Görevi listenin sonuna/başına taşı (opsiyonel ama daha iyi UX)
  tasks = tasks.filter(t => t.id !== taskId);
  if (task.completed) {
      tasks.push(task); // Tamamlananları sona ata
  } else {
      tasks.unshift(task); // Tamamlanmayanları başa al
  }

  saveTasks();
  renderTaskList();
  updateStatistics();
  
  const action = task.completed ? 'tamamlandı' : 'beklemeye alındı';
  showNotification(`Görev ${action}!`, 'info');
  console.log(`Görev durumu değiştirildi: ${taskId} -> ${task.completed}`);
}

/**
 * Görevi düzenler
 */
function editTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  
  const newText = prompt('Görevi düzenleyin:', task.text);
  
  if (newText === null) {
      return; // Kullanıcı iptal etti
  }

  const trimmedText = newText.trim();
  
  if (trimmedText === '') {
      showNotification('Görev boş olamaz!', 'warning');
      return;
  }
  
  if (trimmedText === task.text) {
      return; // Değişiklik yok
  }

  if (trimmedText.length > 200) {
    showNotification('Görev çok uzun! Maksimum 200 karakter.', 'warning');
    return;
  }
  
  task.text = trimmedText;
  saveTasks();
  renderTaskList();
  
  showNotification('Görev başarıyla güncellendi!', 'success');
  console.log('Görev düzenlendi:', taskId);
}

/**
 * Görevi siler
 */
function deleteTask(taskId) {
  if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
    return;
  }
  
  tasks = tasks.filter(t => t.id !== taskId);
  saveTasks();
  renderTaskList();
  updateStatistics();
  
  showNotification('Görev başarıyla silindi!', 'success');
  console.log('Görev silindi:', taskId);
}

/**
 * Görev listesini render eder
 */
function renderTaskList() {
  // Filtrelenmiş görevleri al
  const filteredTasks = getFilteredTasks();
  
  // Boş durum kontrolü
  if (filteredTasks.length === 0) {
    taskList.innerHTML = ''; // Listeyi temizle
    taskList.style.display = 'none';
    emptyTasks.style.display = 'block';
    
    if (tasks.length > 0) {
        // Görev var ama filtrede yok
        emptyTasks.querySelector('p').textContent = 'Bu filtrede gösterilecek görev yok.';
        emptyTasks.querySelectorAll('p')[1].textContent = 'Filtrenizi değiştirmeyi deneyin.';
    } else {
        // Hiç görev yok
        emptyTasks.querySelector('p').textContent = 'Bu tarih için henüz hiç görev eklenmemiş.';
        emptyTasks.querySelectorAll('p')[1].textContent = 'Hemen bir görev ekleyerek planlamaya başlayın!';
    }
    
    tasksCount.textContent = '0 görev bulundu';
    return;
  }
  
  taskList.style.display = 'block';
  emptyTasks.style.display = 'none';
  tasksCount.textContent = `${filteredTasks.length} görev bulundu`;
  
  // Görev listesini oluştur
  taskList.innerHTML = '';
  
  filteredTasks.forEach(task => {
    const taskItem = createTaskItem(task);
    taskList.appendChild(taskItem);
  });
}

/**
 * Filtrelenmiş görevleri döndürür
 */
function getFilteredTasks() {
  switch (currentFilter) {
    case 'completed':
      return tasks.filter(task => task.completed);
    case 'pending':
      return tasks.filter(task => !task.completed);
    case 'all':
    default:
      return [...tasks]; // Kopyasını döndür
  }
}

/**
 * Görev öğesi oluşturur
 */
function createTaskItem(task) {
  const taskItem = document.createElement('li');
  taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
  taskItem.setAttribute('data-task-id', task.id);
  
  // Fade-in animasyonu için kısa bir gecikme
  setTimeout(() => taskItem.classList.add('fade-in'), 10);
  
  taskItem.innerHTML = `
    <label class="task-checkbox">
      <input type="checkbox" ${task.completed ? 'checked' : ''}>
      <span class="checkmark"></span>
    </label>
    <span class="task-text">${escapeHtml(task.text)}</span>
    <div class="task-actions">
      <button class="task-action-btn edit-btn" title="Görevi düzenle">
        <i class="fas fa-edit"></i>
      </button>
      <button class="task-action-btn delete-btn" title="Görevi sil">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  
  // Olay dinleyicilerini ekle
  const checkbox = taskItem.querySelector('input[type="checkbox"]');
  const editBtn = taskItem.querySelector('.edit-btn');
  const deleteBtn = taskItem.querySelector('.delete-btn');
  
  checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
  editBtn.addEventListener('click', () => editTask(task.id));
  deleteBtn.addEventListener('click', () => deleteTask(task.id));
  
  return taskItem;
}

/**
 * İstatistikleri günceller
 */
function updateStatistics() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  totalTasks.textContent = total;
  completedTasks.textContent = completed;
  pendingTasks.textContent = pending;
  completionRate.textContent = `${rate}%`;
  
  console.log(`İstatistikler güncellendi: ${completed}/${total} (%${rate})`);
}

/**
 * Filtre değişikliğini işler
 */
function handleFilterChange(event) {
  const button = event.currentTarget;
  const filter = button.getAttribute('data-filter');
  
  if (filter === currentFilter) return; // Zaten aktif

  // Aktif butonu güncelle
  filterButtons.forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
  
  // Filtreyi güncelle
  currentFilter = filter;
  
  // Listeyi yeniden render et
  renderTaskList();
  
  console.log(`Filtre değiştirildi: ${filter}`);
}

/**
 * Tema değiştirme işlevi
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  const icon = themeToggle.querySelector('i');
  icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  
  console.log('Tema değiştirildi:', newTheme);
}

/**
 * Kayıtlı temayı yükler
 */
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const icon = themeToggle.querySelector('i');
  icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  
  console.log('Tema yüklendi:', savedTheme);
}

/**
 * HTML escape fonksiyonu (XSS önlemi)
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Tarih doğrulama
 */
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Bildirim gösterir
 */
function showNotification(message, type = 'info') {
  // Önceki bildirimi kaldır
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
  
  // Animasyonu başlat
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Bildirimi kaldır
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300); // CSS transition süresiyle eşleşmeli
  }, 3000);
}

/**
 * Service Worker Kaydı
 */
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

// Global hata yakalama
window.addEventListener('error', (event) => {
  console.error('Planlar sayfası hatası:', event.error);
  showNotification('Beklenmedik bir hata oluştu. Lütfen sayfayı yenileyin.', 'error');
});