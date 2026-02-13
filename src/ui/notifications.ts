export function showSuccessMessage(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'toast success';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function showErrorMessage(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'toast error';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

export function showLoading(): void {
  const main = document.querySelector('main');
  if (main) {
    main.innerHTML = '<div class="loading">Loading bookmarks...</div>';
  }
}
