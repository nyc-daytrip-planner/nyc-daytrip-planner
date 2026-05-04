// AJAX client for the reviews section.

(function() {
  const section = document.querySelector('.reviews-section');
  if (!section) return;

  const locationId = section.dataset.locationId;
  const list = section.querySelector('#reviews-list');
  const form = section.querySelector('#review-form');
  const errorEl = form ? form.querySelector('.review-error') : null;
  const avgEl = section.querySelector('.reviews-avg');
  const countEl = section.querySelector('.reviews-count');

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

  function validate(rating, reviewText) {
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return 'Rating must be a whole number between 1 and 5';
    }
    if (typeof reviewText !== 'string' || reviewText.trim().length === 0) {
      return 'Review text cannot be empty';
    }
    return null;
  }

  function buildReviewRow(review, isOwn) {
    const li = document.createElement('li');
    li.className = 'review';
    li.dataset.reviewId = review._id;
    li.dataset.authorId = review.userId;
    li.dataset.rating = String(review.rating);

    const header = document.createElement('header');
    header.className = 'review-row-header';

    const author = document.createElement('span');
    author.className = 'review-author';
    author.textContent = review.authorFirstName || 'Unknown';

    const rating = document.createElement('span');
    rating.className = 'review-rating-static';
    rating.textContent = review.rating + ' / 5';

    header.appendChild(author);
    header.appendChild(rating);
    li.appendChild(header);

    const text = document.createElement('p');
    text.className = 'review-text';
    text.style.whiteSpace = 'pre-line';
    text.textContent = review.reviewText;
    li.appendChild(text);

    if (isOwn) {
      const actions = document.createElement('div');
      actions.className = 'review-actions';
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'review-edit-btn';
      editBtn.textContent = 'Edit';
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'review-delete-btn';
      delBtn.textContent = 'Delete';
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      li.appendChild(actions);
    }

    return li;
  }

  function updateAggregateDisplay(aggregates) {
    if (!aggregates) return;
    if (avgEl) {
      avgEl.textContent = aggregates.averageRating != null
        ? aggregates.averageRating + ' / 5'
        : 'No rating yet';
    }
    if (countEl) {
      const n = aggregates.totalReviews || 0;
      countEl.textContent = '(' + n + ' review' + (n === 1 ? '' : 's') + ')';
    }
  }

  function removeEmptyPlaceholder() {
    const empty = list.querySelector('.reviews-empty');
    if (empty) empty.remove();
  }

  function maybeRestoreEmptyPlaceholder() {
    if (list.querySelectorAll('.review').length === 0 && !list.querySelector('.reviews-empty')) {
      const li = document.createElement('li');
      li.className = 'reviews-empty';
      li.textContent = 'Be the first to review this place.';
      list.appendChild(li);
    }
  }

  // Submit a new review.
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      clearError();
      const rating = form.elements['rating'].value;
      const reviewText = form.elements['reviewText'].value;
      const validationError = validate(rating, reviewText);
      if (validationError) return showError(validationError);

      try {
        const resp = await fetch('/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ locationId, rating, reviewText })
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          return showError(data.error || 'Could not submit review');
        }
        removeEmptyPlaceholder();
        list.prepend(buildReviewRow(data.review, true));
        updateAggregateDisplay(data.aggregates);
        form.reset();
        // Hide form after submission since one-per-user rule kicks in.
        form.hidden = true;
      } catch (err) {
        showError('Network error. Please try again.');
      }
    });
  }

  // Delegated handlers for edit / delete on existing reviews.
  list.addEventListener('click', async function(e) {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const li = target.closest('li.review');
    if (!li) return;

    if (target.classList.contains('review-delete-btn')) {
      if (!window.confirm('Delete this review?')) return;
      const reviewId = li.dataset.reviewId;
      try {
        const resp = await fetch('/reviews/' + encodeURIComponent(reviewId), {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          return window.alert(data.error || 'Could not delete review');
        }
        li.remove();
        updateAggregateDisplay(data.aggregates);
        maybeRestoreEmptyPlaceholder();
        // If this was the user's own review, re-show the submission form.
        if (form) form.hidden = false;
      } catch (err) {
        window.alert('Network error. Please try again.');
      }
      return;
    }

    if (target.classList.contains('review-edit-btn')) {
      const ratingEl = li.querySelector('.review-rating-static');
      const textEl = li.querySelector('.review-text');
      const currentRating = li.dataset.rating;
      const currentText = textEl ? textEl.textContent : '';

      // Replace row with inline edit form.
      const editForm = document.createElement('form');
      editForm.className = 'review-edit-form';
      editForm.innerHTML =
        '<div class="form-row"><label>Rating ' +
        '<select name="rating" required>' +
        ['', 5, 4, 3, 2, 1].map((v) => '<option value="' + v + '">' + (v === '' ? 'Select...' : v) + '</option>').join('') +
        '</select></label></div>' +
        '<div class="form-row"><label>Your review <textarea name="reviewText" rows="3" required></textarea></label></div>' +
        '<button type="submit">Save</button> ' +
        '<button type="button" class="review-cancel-btn">Cancel</button>' +
        '<p class="review-error" role="alert" hidden></p>';
      editForm.elements['rating'].value = String(currentRating);
      editForm.elements['reviewText'].value = currentText;

      Array.from(li.children).forEach((c) => { c.hidden = true; });
      li.appendChild(editForm);
      const inlineErr = editForm.querySelector('.review-error');

      editForm.querySelector('.review-cancel-btn').addEventListener('click', function() {
        editForm.remove();
        Array.from(li.children).forEach((c) => { c.hidden = false; });
      });

      editForm.addEventListener('submit', async function(ev) {
        ev.preventDefault();
        inlineErr.hidden = true;
        const newRating = editForm.elements['rating'].value;
        const newText = editForm.elements['reviewText'].value;
        const v = validate(newRating, newText);
        if (v) {
          inlineErr.textContent = v;
          inlineErr.hidden = false;
          return;
        }
        try {
          const reviewId = li.dataset.reviewId;
          const resp = await fetch('/reviews/' + encodeURIComponent(reviewId), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ rating: newRating, reviewText: newText })
          });
          const data = await resp.json();
          if (!resp.ok || !data.ok) {
            inlineErr.textContent = data.error || 'Could not update review';
            inlineErr.hidden = false;
            return;
          }
          // Replace whole row with a freshly built one.
          const newRow = buildReviewRow(data.review, true);
          li.replaceWith(newRow);
          updateAggregateDisplay(data.aggregates);
        } catch (err) {
          inlineErr.textContent = 'Network error. Please try again.';
          inlineErr.hidden = false;
        }
      });
    }
  });
})();
