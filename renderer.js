const datePicker = document.getElementById('datePicker');
const viewPlans = document.getElementById('viewPlans');

viewPlans.addEventListener('click', () => {
  const date = datePicker.value;
  if (!date) return alert('Önce bir tarih seçin!');
  // Tarihi plans.html'e query param olarak gönder
  window.location.href = `plans.html?date=${date}`;
});
