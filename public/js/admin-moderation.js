// Delegated AJAX delete handler for the admin moderation tables.
// Each delete button carries data-resource ("reviews" or "comments") and
// data-id, so one handler covers both tables. Uses the existing
// DELETE /reviews/:id and DELETE /comments/:id endpoints (admin role is
// enforced server-side; no separate admin-only routes needed).

(function() {
  document.addEventListener('click', async function(e) {
    const btn = e.target instanceof HTMLElement
      ? e.target.closest('.admin-delete-btn')
      : null;
    if (!btn) return;

    const resource = btn.dataset.resource;
    const id = btn.dataset.id;
    if (!resource || !id) return;
    if (resource !== 'reviews' && resource !== 'comments') return;

    const label = resource === 'reviews' ? 'review' : 'comment';
    if (!window.confirm('Delete this ' + label + '?')) return;

    btn.disabled = true;
    try {
      const resp = await fetch('/' + resource + '/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        btn.disabled = false;
        window.alert(data.error || 'Could not delete');
        return;
      }
      const row = btn.closest('tr');
      if (row) row.remove();

      // Decrement counter on the section header.
      const section = document.querySelector('.admin-' + resource);
      const countEl = section ? section.querySelector('.admin-count') : null;
      if (countEl) {
        const remaining = section.querySelectorAll('tbody tr').length;
        countEl.textContent = remaining + ' total';
      }
    } catch (err) {
      btn.disabled = false;
      window.alert('Network error. Please try again.');
    }
  });
})();
