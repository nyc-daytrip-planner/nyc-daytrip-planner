(function() {
  const detail = document.querySelector('.location-detail');
  if (!detail) return;
  const locationId = detail.dataset.locationId;
  const btn = document.getElementById('favorite-btn');
  if (!btn) return;

  btn.addEventListener('click', async function() {
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
})();
