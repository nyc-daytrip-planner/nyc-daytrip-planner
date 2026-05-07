// AJAX approve/reject handlers for the pending locations admin table.
(function() {
  const table = document.querySelector('.admin-pending-locations table');
  if (!table) return;

  function refreshEmptyMessage() {
    if (table.querySelectorAll('tbody tr').length === 0) {
      const section = table.closest('.admin-pending-locations');
      table.remove();
      const empty = document.createElement('p');
      empty.className = 'admin-empty';
      empty.textContent = 'No pending locations.';
      section.appendChild(empty);
    }
  }

  table.addEventListener('click', async function(e) {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const tr = target.closest('tr[data-location-id]');
    if (!tr) return;
    const id = tr.dataset.locationId;

    if (target.classList.contains('admin-approve-btn')) {
      if (!window.confirm('Approve this location?')) return;
      try {
        const resp = await fetch('/explore/admin/' + encodeURIComponent(id) + '/approve', {
          method: 'POST',
          headers: { 'Accept': 'application/json' }
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) return window.alert(data.error || 'Could not approve');
        tr.remove();
        refreshEmptyMessage();
      } catch (err) {
        window.alert('Network error. Please try again.');
      }
      return;
    }

    if (target.classList.contains('admin-reject-btn')) {
      if (!window.confirm('Reject and delete this location?')) return;
      try {
        const resp = await fetch('/explore/admin/' + encodeURIComponent(id) + '/reject', {
          method: 'POST',
          headers: { 'Accept': 'application/json' }
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) return window.alert(data.error || 'Could not reject');
        tr.remove();
        refreshEmptyMessage();
      } catch (err) {
        window.alert('Network error. Please try again.');
      }
    }
  });
})();
