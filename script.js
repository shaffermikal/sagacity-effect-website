// Sagacity Effect LLC — site JS
// Mobile nav toggle + theme toggle + vendor application form

(function () {
  // ============================================================
  // MOBILE NAV
  // ============================================================
  var toggle = document.querySelector('.nav-toggle');
  var list = document.querySelector('.nav-list');
  if (toggle && list) {
    toggle.addEventListener('click', function () {
      var isOpen = list.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    list.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        list.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ============================================================
  // THEME TOGGLE
  // ============================================================
  var themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('sagacity-theme', next); } catch (e) {}
    });
  }

  // ============================================================
  // VENDOR APPLICATION FORM
  // ============================================================
  var form = document.getElementById('vendor-form');
  if (!form) return;

  var STORAGE_KEY = 'sagacity-vendor-application';
  var TOTAL_STEPS = 5;
  var MAX_CONTRACTS = 3;
  var currentStep = 1;
  var saveTimer = null;
  var saveStatus = document.getElementById('save-status');
  var formStatus = document.getElementById('form-status');
  var prevBtn = document.getElementById('prev-step');
  var nextBtn = document.getElementById('next-step');
  var submitBtn = document.getElementById('submit-form');
  var currentStepLabel = document.getElementById('current-step');
  var contractsContainer = document.getElementById('contracts-container');
  var addContractBtn = document.getElementById('add-contract');
  var contractCountHint = document.getElementById('contract-count-hint');
  var capSummary = document.getElementById('capability_summary');
  var capCount = document.getElementById('capability_count');

  // ---------------------------------------------------------
  //  Stepper helpers
  // ---------------------------------------------------------
  function showStep(n) {
    currentStep = n;
    form.querySelectorAll('.form-step').forEach(function (fs) {
      fs.classList.toggle('active', parseInt(fs.dataset.step, 10) === n);
    });
    document.querySelectorAll('.stepper-item').forEach(function (li) {
      var s = parseInt(li.dataset.step, 10);
      li.classList.toggle('active', s === n);
      li.classList.toggle('done', s < n);
    });
    currentStepLabel.textContent = n;
    prevBtn.disabled = n === 1;
    if (n === TOTAL_STEPS) {
      nextBtn.hidden = true;
      submitBtn.hidden = false;
    } else {
      nextBtn.hidden = false;
      submitBtn.hidden = true;
    }
    // Scroll form into view (smooth)
    var top = form.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  // ---------------------------------------------------------
  //  Validation
  // ---------------------------------------------------------
  function validateStep(n) {
    var stepEl = form.querySelector('.form-step[data-step="' + n + '"]');
    if (!stepEl) return true;
    var fields = stepEl.querySelectorAll('input, select, textarea');
    var firstInvalid = null;
    var groupErrors = {};

    fields.forEach(function (f) {
      var group = f.closest('.form-group');

      // Skip disabled or non-required checkbox/radio sets that aren't filled
      // (handled below for required checkbox groups)

      if (f.type === 'checkbox') {
        // Checkbox validation: if part of a required set, we'll validate below
        f.classList.remove('invalid');
        if (group) group.classList.remove('has-error');
        return;
      }
      if (f.type === 'radio') {
        f.classList.remove('invalid');
        return;
      }
      if (f.type === 'file') {
        return; // file inputs validated separately
      }

      // Standard required field check
      var value = (f.value || '').trim();
      var isRequired = f.hasAttribute('required');
      var valid = true;

      if (isRequired && !value) {
        valid = false;
      } else if (f.pattern) {
        try {
          var re = new RegExp('^(?:' + f.pattern + ')$');
          if (value && !re.test(value)) valid = false;
        } catch (e) {}
      } else if (f.type === 'email' && value) {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }

      if (!valid) {
        f.classList.add('invalid');
        if (group) group.classList.add('has-error');
        if (!firstInvalid) firstInvalid = f;
      } else {
        f.classList.remove('invalid');
        if (group) group.classList.remove('has-error');
      }
    });

    // Required checkbox groups (Step 3 lanes, Step 5 insurance)
    if (n === 3) {
      var lanes = form.querySelectorAll('input[name="lanes"]:checked');
      if (lanes.length === 0) {
        groupErrors['lanes'] = true;
        var errEl = stepEl.querySelector('[data-error="lanes"]');
        if (errEl) errEl.style.display = 'block';
        if (!firstInvalid) firstInvalid = stepEl.querySelector('input[name="lanes"]');
      } else {
        var errEl2 = stepEl.querySelector('[data-error="lanes"]');
        if (errEl2) errEl2.style.display = 'none';
      }
    }
    if (n === 5) {
      // GL and WC are required
      var gl = form.querySelector('input[name="insurance"][value="gl"]:checked');
      var wc = form.querySelector('input[name="insurance"][value="wc"]:checked');
      if (!gl || !wc) {
        // Just mark the first insurance checkbox group as error container
        var insWrap = stepEl.querySelector('.checkbox-stack');
        if (insWrap) {
          insWrap.style.outline = '1px solid #b3502b';
          insWrap.style.outlineOffset = '4px';
          insWrap.style.borderRadius = '6px';
        }
        if (!firstInvalid) firstInvalid = stepEl.querySelector('input[name="insurance"][value="gl"]');
      } else {
        var insWrap2 = stepEl.querySelector('.checkbox-stack');
        if (insWrap2) insWrap2.style.outline = 'none';
      }
    }

    if (firstInvalid) {
      try { firstInvalid.focus({ preventScroll: true }); } catch (e) { firstInvalid.focus(); }
    }
    return !firstInvalid;
  }

  // ---------------------------------------------------------
  //  Local storage save / restore
  // ---------------------------------------------------------
  function saveForm() {
    if (saveTimer) clearTimeout(saveTimer);
    saveStatus.className = 'form-save-status saving';
    saveStatus.innerHTML = '<span class="save-dot"></span> Saving…';

    saveTimer = setTimeout(function () {
      var data = {};
      var fields = form.querySelectorAll('input, select, textarea');
      fields.forEach(function (f) {
        if (f.type === 'file') return; // can't serialize files
        if (f.type === 'checkbox') {
          if (!data[f.name]) data[f.name] = [];
          if (f.checked) data[f.name].push(f.value);
        } else if (f.type === 'radio') {
          if (f.checked) data[f.name] = f.value;
        } else {
          data[f.name] = f.value;
        }
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        saveStatus.className = 'form-save-status saved';
        saveStatus.innerHTML = '<span class="save-dot"></span> Progress saved on this device';
      } catch (e) {
        saveStatus.className = 'form-save-status';
        saveStatus.innerHTML = '<span class="save-dot"></span> Could not save (storage full)';
      }
    }, 600);
  }

  function restoreForm() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      var fields = form.querySelectorAll('input, select, textarea');
      fields.forEach(function (f) {
        if (f.type === 'file') return;
        if (f.type === 'checkbox') {
          if (Array.isArray(data[f.name]) && data[f.name].indexOf(f.value) !== -1) {
            f.checked = true;
          }
        } else if (f.type === 'radio') {
          if (data[f.name] === f.value) f.checked = true;
        } else if (data[f.name] != null) {
          f.value = data[f.name];
        }
      });
      // Update char count
      if (capSummary && capCount) {
        capCount.textContent = capSummary.value.length;
      }
      // If we restored contracts beyond the default 1, render them
      var contractKeys = Object.keys(data).filter(function (k) {
        return /^contract\d+_client$/.test(k);
      });
      var maxFound = 0;
      contractKeys.forEach(function (k) {
        var n = parseInt(k.match(/^contract(\d+)_/)[1], 10);
        if (n > maxFound) maxFound = n;
      });
      // Add additional contracts
      for (var i = 2; i <= maxFound && i <= MAX_CONTRACTS; i++) {
        addContract(false);
      }
    } catch (e) {}
  }

  // ---------------------------------------------------------
  //  File upload UI
  // ---------------------------------------------------------
  form.querySelectorAll('input[type="file"]').forEach(function (input) {
    input.addEventListener('change', function () {
      var wrap = input.closest('.file-upload');
      var status = wrap ? wrap.querySelector('.file-upload-status') : null;
      if (input.files && input.files[0]) {
        var f = input.files[0];
        var sizeKb = Math.round(f.size / 1024);
        var sizeLabel = sizeKb < 1024 ? (sizeKb + ' KB') : (Math.round(sizeKb / 1024 * 10) / 10 + ' MB');
        if (status) status.textContent = '✓ ' + f.name + ' · ' + sizeLabel;
        if (wrap) wrap.classList.add('has-file');
        if (sizeKb > 10240) {
          if (status) status.textContent = '⚠ ' + f.name + ' · too large (max 10 MB)';
          input.value = '';
          if (wrap) wrap.classList.remove('has-file');
          showFormStatus('error', '<strong>File too large.</strong> Please keep uploads under 10 MB.');
        }
      } else {
        if (status) status.textContent = 'No file chosen';
        if (wrap) wrap.classList.remove('has-file');
      }
    });
  });

  // ---------------------------------------------------------
  //  Capability summary char counter
  // ---------------------------------------------------------
  if (capSummary && capCount) {
    capSummary.addEventListener('input', function () {
      var len = capSummary.value.length;
      capCount.textContent = len;
      capCount.style.color = len > 1000 ? '#b3502b' : '';
    });
  }

  // ---------------------------------------------------------
  //  Contract array (add / remove)
  // ---------------------------------------------------------
  function addContract(save) {
    var existing = contractsContainer.querySelectorAll('.contract-block');
    if (existing.length >= MAX_CONTRACTS) return;
    var n = existing.length + 1;

    var block = document.createElement('div');
    block.className = 'contract-block';
    block.dataset.contract = n;
    block.innerHTML = [
      '<div class="contract-header">',
      '  <h3>Contract ' + n + '</h3>',
      '  <span class="contract-type">',
      '    <label class="radio-inline"><input type="radio" name="contract' + n + '_type" value="federal" checked /><span>Federal</span></label>',
      '    <label class="radio-inline"><input type="radio" name="contract' + n + '_type" value="commercial" /><span>Commercial</span></label>',
      '    <button type="button" class="remove-contract" data-remove="' + n + '">Remove</button>',
      '  </span>',
      '</div>',
      '<div class="form-row">',
      '  <div class="form-group"><label>Client / agency <span class="req">*</span></label><input type="text" name="contract' + n + '_client" required /></div>',
      '  <div class="form-group"><label>Contract / solicitation #</label><input type="text" name="contract' + n + '_number" style="font-family: var(--font-mono);" /></div>',
      '</div>',
      '<div class="form-row form-row-3">',
      '  <div class="form-group"><label>NAICS code <span class="req">*</span></label><input type="text" name="contract' + n + '_naics" required pattern="\\d{5,6}" maxlength="6" style="font-family: var(--font-mono);" /></div>',
      '  <div class="form-group"><label>Contract value ($) <span class="req">*</span></label><input type="number" name="contract' + n + '_value" required min="0" step="1000" /></div>',
      '  <div class="form-group"><label>CPARS rating</label><select name="contract' + n + '_cpars"><option value="">N/A</option><option>Exceptional</option><option>Very Good</option><option>Satisfactory</option><option>Marginal</option><option>Unsatisfactory</option></select></div>',
      '</div>',
      '<div class="form-row">',
      '  <div class="form-group"><label>Start date <span class="req">*</span></label><input type="month" name="contract' + n + '_start" required /></div>',
      '  <div class="form-group"><label>End date <span class="req">*</span></label><input type="month" name="contract' + n + '_end" required /></div>',
      '</div>',
      '<div class="form-group"><label>Work description <span class="req">*</span></label><textarea name="contract' + n + '_description" required rows="3"></textarea></div>',
      '<div class="form-group"><label>Reference contact (name, email, phone)</label><input type="text" name="contract' + n + '_reference" /></div>'
    ].join('');

    contractsContainer.appendChild(block);

    // Remove button handler
    block.querySelector('.remove-contract').addEventListener('click', function () {
      block.remove();
      renumberContracts();
      updateContractHint();
      saveForm();
    });

    // Auto-save on any input in new block
    block.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', saveForm);
      el.addEventListener('change', saveForm);
    });

    renumberContracts();
    updateContractHint();
    if (save !== false) saveForm();
  }

  function renumberContracts() {
    var blocks = contractsContainer.querySelectorAll('.contract-block');
    blocks.forEach(function (block, idx) {
      var n = idx + 1;
      block.dataset.contract = n;
      var h3 = block.querySelector('.contract-header h3');
      if (h3) h3.textContent = 'Contract ' + n;
    });
  }

  function updateContractHint() {
    var count = contractsContainer.querySelectorAll('.contract-block').length;
    contractCountHint.textContent = count + ' of up to ' + MAX_CONTRACTS + ' contracts.';
    addContractBtn.disabled = count >= MAX_CONTRACTS;
    addContractBtn.style.opacity = count >= MAX_CONTRACTS ? '0.4' : '1';
    addContractBtn.style.cursor = count >= MAX_CONTRACTS ? 'not-allowed' : 'pointer';
  }

  if (addContractBtn) {
    addContractBtn.addEventListener('click', function () { addContract(true); });
  }

  // ---------------------------------------------------------
  //  Nav buttons
  // ---------------------------------------------------------
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      if (currentStep > 1) showStep(currentStep - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      if (validateStep(currentStep)) {
        if (currentStep < TOTAL_STEPS) showStep(currentStep + 1);
      }
    });
  }

  // Allow stepper items to jump (only to visited/completed steps)
  document.querySelectorAll('.stepper-item').forEach(function (li) {
    li.addEventListener('click', function () {
      var s = parseInt(li.dataset.step, 10);
      if (s < currentStep) showStep(s);
    });
    li.style.cursor = 'pointer';
  });

  // ---------------------------------------------------------
  //  Form status display
  // ---------------------------------------------------------
  function showFormStatus(type, html) {
    formStatus.hidden = false;
    formStatus.className = 'form-status ' + type;
    formStatus.innerHTML = html;
    formStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ---------------------------------------------------------
  //  Submit
  // ---------------------------------------------------------
  if (submitBtn) {
    submitBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (!validateStep(currentStep)) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';
      showFormStatus('success', '<strong>Sending your application…</strong> Please don\'t close this tab.');

      // Build FormData
      var fd = new FormData(form);

      // Strip existing checkbox arrays (they're already in fd as separate entries)
      // Add FormSubmit meta fields
      fd.append('_subject', 'New vendor application — Sagacity Effect');
      fd.append('_template', 'table');
      fd.append('_captcha', 'false');
      fd.append('_next', window.location.origin + '/apply.html?submitted=true');
      // Honeypot (must remain empty)
      fd.append('_honey', '');

      // Submit via fetch (AJAX)
      var url = 'https://formsubmit.co/ajax/vendors@sagacityeffect.com';
      fetch(url, {
        method: 'POST',
        body: fd,
        headers: { 'Accept': 'application/json' }
      })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function () {
        // Success
        showFormStatus('success',
          '<strong>Application received — thank you.</strong><br>' +
          'We\'ll review your application within 5 business days. ' +
          'If we need anything else, we\'ll reach out to the contact you provided. ' +
          'In the meantime, you can <a href="capabilities.html">see what we bid on</a> or ' +
          '<a href="index.html">return home</a>.'
        );
        // Clear saved form
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        // Lock the form
        form.querySelectorAll('input, select, textarea, button').forEach(function (el) {
          el.disabled = true;
        });
        submitBtn.style.display = 'none';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        document.querySelector('.form-save-status').style.display = 'none';
        // Scroll to success
        formStatus.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(function (err) {
        showFormStatus('error',
          '<strong>Something went wrong sending the form.</strong><br>' +
          'Please try again, or email <a href="mailto:vendors@sagacityeffect.com">vendors@sagacityeffect.com</a> ' +
          'directly and we\'ll get you sorted. (Error: ' + (err.message || 'network') + ')'
        );
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application →';
      });
    });
  }

  // ---------------------------------------------------------
  //  Auto-save on any change
  // ---------------------------------------------------------
  form.addEventListener('input', saveForm);
  form.addEventListener('change', saveForm);

  // ---------------------------------------------------------
  //  Init
  // ---------------------------------------------------------
  restoreForm();
  updateContractHint();
  showStep(1);

  // Handle ?submitted=true redirect from non-AJAX fallback
  if (window.location.search.indexOf('submitted=true') !== -1) {
    showFormStatus('success',
      '<strong>Application received — thank you.</strong><br>' +
      'We\'ll review your application within 5 business days. ' +
      'If we need anything else, we\'ll reach out to the contact you provided.'
    );
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    form.querySelectorAll('input, select, textarea, button').forEach(function (el) {
      el.disabled = true;
    });
    submitBtn.style.display = 'none';
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    document.querySelector('.form-save-status').style.display = 'none';
  }
})();
