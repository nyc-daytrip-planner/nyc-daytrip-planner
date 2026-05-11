(function () {
  const detail = document.querySelector('.location-detail');
  if (!detail) return;
  const locationId = detail.dataset.locationId;

  // Favorite button
  const btn = document.getElementById('favorite-btn');
  if (btn) {
    btn.addEventListener('click', async function () {
      btn.disabled = true;
      try {
        const resp = await fetch('/explore/' + encodeURIComponent(locationId) + '/favorite', {
          method: 'POST',
          headers: { 'Accept': 'application/json' }
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          return window.alert(data.error || 'Could not update favorite');
        }
        btn.dataset.favorited = data.favorited ? 'true' : 'false';
        btn.textContent = data.favorited ? '★ Favorited' : '☆ Favorite';
      } catch (err) {
        window.alert('Network error. Please try again.');
      } finally {
        btn.disabled = false;
      }
    });
  }

  // Add to Plan modal
  const addPlanBtn = document.querySelector('.btn-add-plan')
  const modal = document.getElementById('add-to-plan-modal')
  const closeModal = document.getElementById('close-modal')
  const modalLocationId = document.getElementById('modal-location-id')

  if (addPlanBtn) {
    addPlanBtn.addEventListener('click', () => {
      modalLocationId.value = addPlanBtn.dataset.locationId
      modal.classList.remove('hidden')
    })

    closeModal.addEventListener('click', () => {
      modal.classList.add('hidden')
    })

    window.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden')
    })

    // Auto-open the modal if redirected back with a time conflict error
    if (modal.querySelector('.plan-error')) {
      modal.classList.remove('hidden')
    }
  }
})();