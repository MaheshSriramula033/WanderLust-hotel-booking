const stars = document.querySelectorAll('#star-rating i');
const ratingInput = document.getElementById('ratingInput');
const ratingError = document.getElementById('ratingError');
const reviewForm = document.getElementById('reviewForm');

if (stars.length > 0 && ratingInput && ratingError) {
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const rating = star.dataset.value;
      ratingInput.value = rating;

      stars.forEach(s => {
        if (s.dataset.value <= rating) {
          s.classList.remove('fa-regular');
          s.classList.add('fa-solid');
        } else {
          s.classList.remove('fa-solid');
          s.classList.add('fa-regular');
        }
      });

      ratingError.style.display = 'none';
    });
  });
}

if (reviewForm) {
  reviewForm.addEventListener('submit', e => {
    if (!ratingInput.value) {
      e.preventDefault();
      if (ratingError) ratingError.style.display = 'block';
    }
  });
}
