const urlParams = new URLSearchParams(window.location.search);
const selectedDate = urlParams.get('date');

document.getElementById('selectedDate').textContent = `📌 ${selectedDate || 'Tarih Seçilmedi'}`;

const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

const PLANS_KEY = 'plannerDatePlans';

// Planları yükle
function loadPlans() {
  const allPlans = JSON.parse(localStorage.getItem(PLANS_KEY) || '{}');
  const tasks = allPlans[selectedDate] || [];
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = task;
    li.onclick = () => {
      li.remove();
      allPlans[selectedDate] = allPlans[selectedDate].filter(t => t !== task);
      localStorage.setItem(PLANS_KEY, JSON.stringify(allPlans));
      loadPlans();
    };
    taskList.appendChild(li);
  });
}

// Yeni görev ekleme
addTaskBtn.addEventListener('click', () => {
  const task = taskInput.value.trim();
  if (!task) return;
  const allPlans = JSON.parse(localStorage.getItem(PLANS_KEY) || '{}');
  if (!allPlans[selectedDate]) allPlans[selectedDate] = [];
  allPlans[selectedDate].push(task);
  localStorage.setItem(PLANS_KEY, JSON.stringify(allPlans));
  taskInput.value = '';
  loadPlans();
});

loadPlans();
