// AJAX client for the comments section.
// Submit prepends to the list, delete removes the row in place. Display always
// uses textContent (never innerHTML) so user input cannot execute as HTML.

(function() {
  const section = document.querySelector('.comments-section');
  if (!section) return;

  const locationId = section.dataset.locationId;
  const list = section.querySelector('#comments-list');
  const form = section.querySelector('#comment-form');
  const errorEl = form ? form.querySelector('.comment-error') : null;

  function showError(msg) {
    if (!errorEl) {
      window.alert(msg);
      return;
    }
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.hidden = true;
  }

  function validate(text) {
    if (typeof text !== 'string' || text.trim().length === 0) {
      return 'Comment cannot be empty';
    }
    return null;
  }

  function buildCommentRow(comment, isOwn) {
    const li = document.createElement('li');
    li.className = 'comment';
    li.dataset.commentId = comment._id;
    li.dataset.authorId = comment.userId;

    const header = document.createElement('header');
    header.className = 'comment-row-header';
    const author = document.createElement('span');
    author.className = 'comment-author';
    author.textContent = comment.authorFirstName || 'Unknown';
    header.appendChild(author);
    li.appendChild(header);

    const text = document.createElement('p');
    text.className = 'comment-text';
    text.style.whiteSpace = 'pre-line';
    text.textContent = comment.text;
    li.appendChild(text);

    if (isOwn) {
      const actions = document.createElement('div');
      actions.className = 'comment-actions';
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'comment-delete-btn';
      delBtn.textContent = 'Delete';
      actions.appendChild(delBtn);
      li.appendChild(actions);
    }

    return li;
  }

  function removeEmptyPlaceholder() {
    const empty = list.querySelector('.comments-empty');
    if (empty) empty.remove();
  }
  function maybeRestoreEmptyPlaceholder() {
    if (list.querySelectorAll('.comment').length === 0 && !list.querySelector('.comments-empty')) {
      const li = document.createElement('li');
      li.className = 'comments-empty';
      li.textContent = 'No comments yet.';
      list.appendChild(li);
    }
  }

  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      clearError();
      const text = form.elements['text'].value;
      const v = validate(text);
      if (v) return showError(v);

      try {
        const resp = await fetch('/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ locationId, text })
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          return showError(data.error || 'Could not post comment');
        }
        removeEmptyPlaceholder();
        list.prepend(buildCommentRow(data.comment, true));
        form.reset();
      } catch (err) {
        showError('Network error. Please try again.');
      }
    });
  }

  list.addEventListener('click', async function(e) {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const li = target.closest('li.comment');
    if (!li) return;
    if (!target.classList.contains('comment-delete-btn')) return;

    if (!window.confirm('Delete this comment?')) return;
    const commentId = li.dataset.commentId;
    try {
      const resp = await fetch('/comments/' + encodeURIComponent(commentId), {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        return window.alert(data.error || 'Could not delete comment');
      }
      li.remove();
      maybeRestoreEmptyPlaceholder();
    } catch (err) {
      window.alert('Network error. Please try again.');
    }
  });
})();
