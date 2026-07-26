// Sagacity Effect LLC — minimal site JS
// Mobile nav toggle

(function () {
  var toggle = document.querySelector('.nav-toggle');
  var list = document.querySelector('.nav-list');
  if (!toggle || !list) return;

  toggle.addEventListener('click', function () {
    var isOpen = list.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close nav on link click (mobile)
  list.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      list.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();