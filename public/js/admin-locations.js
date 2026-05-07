(function() {
  const table = document.querySelector('.admin-pending-locations table');
  if (!table) return;

  function refreshEmptyMessage() {
    if (table.querySelectorAll('tbody tr').length > 0) return;
    const section = table.closest('.admin-pending-locations');
    table.remove();
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'No pending locations.';
    section.appendChild(empty);
  }

  async function postAction(id, action, confirmMsg, errVerb) {
    if (!window.confirm(confirmMsg)) return false;
    try {
      const resp = await fetch('/explore/admin/' + encodeURIComponent(id) + '/' + action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        window.alert(data.error || 'Could not ' + errVerb);
        return false;
      }
      return true;
    } catch (err) {
      window.alert('Network error. Please try again.');
      return false;
    }
  }

  table.addEventListener('click', async function(e) {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const tr = target.closest('tr[data-location-id]');
    if (!tr) return;

    let outcome = false;
    if (target.classList.contains('admin-approve-btn')) {
      outcome = await postAction(tr.dataset.locationId, 'approve', 'Approve this location?', 'approve');
    } else if (target.classList.contains('admin-reject-btn')) {
      outcome = await postAction(tr.dataset.locationId, 'reject', 'Reject and delete this location?', 'reject');
    } else {
      return;
    }

    if (outcome) {
      tr.remove();
      refreshEmptyMessage();
    }
  });
})();
