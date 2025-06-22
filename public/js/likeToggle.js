document.addEventListener("DOMContentLoaded", () => {
  const likedListings = JSON.parse(localStorage.getItem("likedListings") || "[]");

  document.querySelectorAll(".love-btn").forEach(button => {
    const card = button.closest(".card");
    const listingId = card.dataset.listingId;
    const icon = button.querySelector("i");

    // Set initial heart state from localStorage
    if (likedListings.includes(listingId)) {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
    }

    button.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        const res = await fetch(`/listings/${listingId}/like`, {
          method: "POST",
          headers: {
            "X-Requested-With": "XMLHttpRequest"
          }
        });

        const data = await res.json();

        if (data.liked) {
          icon.classList.remove("fa-regular");
          icon.classList.add("fa-solid");
          if (!likedListings.includes(listingId)) likedListings.push(listingId);
        } else {
          icon.classList.remove("fa-solid");
          icon.classList.add("fa-regular");
          const idx = likedListings.indexOf(listingId);
          if (idx !== -1) likedListings.splice(idx, 1);
        }

        localStorage.setItem("likedListings", JSON.stringify(likedListings));
      } catch (err) {
        alert("⚠️ Please log in to like listings.");
        console.error("❤️ Error toggling favorite:", err);
      }
    });
  });
});

