(() => {
  const C = window.YUV || {}, $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s), KEY = "yuv26";
  let S = { i: 0, n: 0, p: {}, m: [{}, {}, {}], pay: {}, q: "" }, file = null;
  let previewMode = false;

  try { S = Object.assign(S, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const inr = n => "₹" + Number(n || 0).toLocaleString("en-IN");
  const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const get = k => k.split(".").reduce((o, x) => o && o[x], S) ?? "";
  const set = (k, v) => { const a = k.split("."), l = a.pop(); a.reduce((o, x) => o[x], S)[l] = v; };
  const total = () => (S.n || 1) * (C.PRICE || 1780);
  const steps = () => S.n > 1 ? ["g", "y", "m", "p"] : ["g", "y", "p"];
  const NAMES = { g: "Group", y: "You", m: "Members", p: "Payment" };
  const NUM = 'inputmode="numeric" maxlength="10"';

  const fld = (k, label, type = "text", extra = "", hint = "") =>
    `<label>${label}<input data-k="${k}" type="${type}" value="${esc(get(k))}" ${extra}></label>${hint ? `<p class="hint">${hint}</p>` : ""}`;

  const contact = () => {
    const a = +S.p.age;
    if (!a) return `<p class="hint">Enter your age and we will show which contact we need.</p>`;
    return a < 25
      ? fld("p.parent", "Parent's / guardian's mobile number", "tel", NUM)
      : fld("p.ecName", "Emergency contact person's name") +
        fld("p.ecNum", "Emergency contact's mobile number", "tel", NUM, "A family member or friend, not another number of yours.");
  };

  // Step Views
  const V = {
    // Step 1: NO PRICES SHOWN - Clean group size selection as requested
    g: () => `<h3>How many people are coming?</h3>
      <p class="hint">Select group size to continue (one booking covers up to 4 members).</p>
      <div class="sizes">
        ${[1, 2, 3, 4].map(n => `
          <button type="button" class="size ${S.n == n ? "on" : ""}" data-n="${n}">
            <span class="size-badge">${n == 1 ? "👤 Solo" : n == 2 ? "👥 Duo" : n == 3 ? "👨‍👩‍👦 Trio" : "👨‍👩‍👧‍👦 Squad"}</span>
            <b>${n == 1 ? "Just me" : n + " people"}</b>
            <span class="size-sub">${n == 1 ? "1 Seat" : n + " Seats"}</span>
          </button>
        `).join("")}
      </div>`,

    // Step 2: Personal details
    y: () => `<h3>Your details</h3>
      ${fld("p.name", "Full name", "text", 'autocomplete="name"')}
      ${fld("p.age", "Age", "number", 'min="1" max="99" inputmode="numeric"')}
      ${fld("p.mobile", "Mobile number (linked with WhatsApp)", "tel", NUM)}
      ${fld("p.email", "Email address", "email", 'autocomplete="email"')}
      <label>Home address<textarea data-k="p.addr" rows="2">${esc(get("p.addr"))}</textarea></label>
      ${fld("p.gotra", "Gotra (optional)")}
      <div id="ct">${contact()}</div>`,

    // Step 3: Additional members
    m: () => `<h3>Who's coming with you?</h3>${[...Array(S.n - 1)].map((_, i) =>
      `<fieldset><legend>Person ${i + 2}</legend>${fld(`m.${i}.name`, "Full name")}${fld(`m.${i}.age`, "Age", "number", 'min="1" max="99" inputmode="numeric"')}${fld(`m.${i}.mobile`, "Mobile number (optional)", "tel", NUM)}</fieldset>`).join("")}`,

    // Step 4: Payment with "Show QR" button beside "Open UPI app"
    p: () => {
      const up = `upi://pay?pa=${C.UPI_ID}&pn=${encodeURIComponent(C.UPI_NAME || "YUVATMA")}&am=${total()}&cu=INR`;
      return `<h3>Pay ${inr(total())}</h3>
      <div class="pay">
        <div class="pay-info-row">
          <span class="upi-tag">UPI ID: <b>${esc(C.UPI_ID)}</b></span>
          <span class="upi-tag">Payee: <b>${esc(C.UPI_NAME || "YUVATMA")}</b></span>
        </div>
        <div class="pay-actions">
          <a class="btn ghost" href="${up}" id="open-upi-link">Open UPI app</a>
          <button type="button" class="btn" id="show-qr-trigger">📷 Show QR</button>
        </div>
        <p class="hint">Booking on a laptop? Click <b>Show QR</b> to scan and pay easily from your phone!</p>
      </div>
      ${fld("pay.txn", "Transaction ID / UTR (from your payment app)")}
      <label>Payment screenshot<input type="file" id="shot" accept="image/*"></label>
      <p class="hint" id="shotn"></p>
      <label>Anything you'd like to ask us? (optional)<textarea data-k="q" rows="2">${esc(S.q)}</textarea></label>`;
    }
  };

  const err = m => { const el = $("#err"); if (el) el.textContent = m || ""; };

  function render() {
    const st = steps();
    if (!S.n || S.i >= st.length) S.i = 0;
    const cur = st[S.i];
    $("#steps").innerHTML = st.map((s, i) => `<li class="${i == S.i ? "on" : i < S.i ? "done" : ""}">${NAMES[s]}</li>`).join("");
    $("#stage").innerHTML = V[cur]();
    $("#total").textContent = S.n && cur != "g" ? `Total Contribution: ${inr(total())} (${S.n} ${S.n > 1 ? "people" : "person"})` : "";
    $("#back").hidden = S.i == 0;
    $("#next").hidden = cur == "g";
    $("#next").textContent = cur == "p" ? "Confirm booking" : "Continue";

    // Setup Show QR trigger if present in step p
    const qrTrigger = $("#show-qr-trigger");
    if (qrTrigger) {
      qrTrigger.onclick = openQrModal;
    }

    updateProfileInfo();
    err();
    save();
  }

  const P = v => /^[6-9]\d{9}$/.test(v || ""), T = v => (v || "").trim().length > 1, A = v => +v >= 1 && +v <= 99;
  function check(c) {
    const p = S.p;
    if (c == "y") {
      if (!T(p.name)) return "Enter your full name.";
      if (!A(p.age)) return "Enter a valid age.";
      if (!P(p.mobile)) return "Enter a 10-digit mobile number.";
      if (!/^\S+@\S+\.\S+$/.test(p.email || "")) return "Enter a valid email address.";
      if (!T(p.addr)) return "Enter your home address.";
      if (+p.age < 25) {
        if (!P(p.parent)) return "Enter your parent's or guardian's 10-digit mobile number.";
      } else {
        if (!T(p.ecName)) return "Enter your emergency contact's name.";
        if (!P(p.ecNum)) return "Enter your emergency contact's 10-digit mobile number.";
        if (p.ecNum == p.mobile) return "Emergency contact must be someone other than you.";
      }
    }
    if (c == "m") {
      for (let i = 0; i < S.n - 1; i++) {
        const m = S.m[i];
        if (!T(m.name) || !A(m.age) || (m.mobile && !P(m.mobile))) {
          return `Complete person ${i + 2}: name, age, and a 10-digit mobile if provided.`;
        }
      }
    }
    if (c == "p") {
      if (!T(S.pay.txn)) return "Enter the transaction ID / UTR from your payment app.";
      if (!file) return "Attach your payment screenshot.";
    }
    return "";
  }

  const shrink = f => new Promise((res, rej) => {
    const img = new Image(), u = URL.createObjectURL(f);
    img.onload = () => {
      const r = Math.min(1, 1280 / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = img.width * r; c.height = img.height * r;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u); res(c.toDataURL("image/jpeg", 0.8).split(",")[1]);
    };
    img.onerror = () => rej(new Error("Could not read that image. Please try a different screenshot."));
    img.src = u;
  });

  // ---------- Live Seat Counter ----------
  async function fetchSeats() {
    const totalCap = C.TOTAL_SEATS || 35;
    const seatsLeftEl = $("#seats-left-num");
    const seatsBookedEl = $("#seats-booked-num");
    const progressBar = $("#seat-progress-bar");
    const noteEl = $("#seat-status-note");

    // Default initial display
    if (seatsLeftEl) seatsLeftEl.textContent = totalCap;
    if (seatsBookedEl) seatsBookedEl.textContent = "0";

    if (!C.API_URL || C.API_URL.includes("PASTE_YOUR_APPS_SCRIPT")) {
      return; // Not configured yet, keep clean defaults
    }

    try {
      // Use GET or POST to fetch seat stats
      let res;
      try {
        res = await fetch(`${C.API_URL}?action=seats`);
      } catch (e) {
        res = await fetch(C.API_URL, {
          method: "POST",
          body: JSON.stringify({ action: "seats" })
        });
      }
      const data = await res.json();
      if (data && data.ok) {
        const booked = Number(data.bookedSeats || 0);
        const left = typeof data.seatsLeft !== "undefined" ? Number(data.seatsLeft) : Math.max(0, totalCap - booked);
        const pct = Math.min(100, Math.round((booked / totalCap) * 100));

        if (seatsLeftEl) seatsLeftEl.textContent = left;
        if (seatsBookedEl) seatsBookedEl.textContent = booked;
        if (progressBar) {
          progressBar.style.width = pct + "%";
          if (left <= 5) {
            progressBar.style.background = "#b00020";
          }
        }
        if (noteEl) {
          if (left <= 0) {
            noteEl.innerHTML = "⛔ <b>Bus is full!</b> Message on WhatsApp to join waiting list.";
            noteEl.style.color = "#b00020";
          } else if (left <= 5) {
            noteEl.innerHTML = `⚡ <b>Hurry!</b> Only ${left} seats remaining before closure.`;
            noteEl.style.color = "#b00020";
          } else {
            noteEl.innerHTML = `🟢 <b>${left} seats open!</b> Reserve your spot soon.`;
          }
        }
      }
    } catch (err) {
      console.warn("Seat count sync notice:", err.message);
    }
  }

  // ---------- Sidebar Drawer Controller ----------
  const sidebar = $("#sidebar");
  const overlay = $("#sidebar-overlay");
  const menuBtn = $("#menu-btn");
  const closeBtn = $("#sidebar-close");

  function openSidebar() {
    if (sidebar) sidebar.classList.add("active");
    if (overlay) overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (menuBtn) menuBtn.onclick = openSidebar;
  if (closeBtn) closeBtn.onclick = closeSidebar;
  if (overlay) overlay.onclick = closeSidebar;

  // Close sidebar on link click
  $$(".sidebar-link").forEach(link => {
    link.addEventListener("click", closeSidebar);
  });

  // ---------- Profile Information in Sidebar ----------
  function updateProfileInfo() {
    const nameEl = $("#sidebar-user-name");
    const statusEl = $("#sidebar-user-status");
    if (!nameEl || !statusEl) return;

    if (S.p && S.p.name) {
      nameEl.textContent = S.p.name;
      statusEl.textContent = S.p.email || "Booking in progress";
    } else {
      const tok = localStorage.getItem("yuv_tok");
      if (tok) {
        nameEl.textContent = "Registered Pilgrim";
        statusEl.textContent = "Signed in • Click 'My Bookings'";
      } else {
        nameEl.textContent = "Welcome, Pilgrim";
        statusEl.textContent = "Exploring Yalagur Yatra";
      }
    }
  }

  // ---------- QR Code Modal Controller ----------
  const qrModal = $("#qr-modal");
  const qrImage = $("#qr-image");
  const qrAmountText = $("#qr-amount-text");
  const copyUpiBtn = $("#copy-upi-btn");
  const qrCloseBtn = $("#qr-modal-close");
  const qrDoneBtn = $("#qr-done-btn");

  function openQrModal() {
    const amt = total();
    const upiUrl = `upi://pay?pa=${C.UPI_ID}&pn=${encodeURIComponent(C.UPI_NAME || "YUVATMA")}&am=${amt}&cu=INR`;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiUrl)}`;

    if (qrAmountText) qrAmountText.textContent = inr(amt);
    if (qrImage) {
      qrImage.src = qrSrc;
      qrImage.alt = `UPI QR for ₹${amt}`;
    }
    const modalUpi = $("#modal-upi-id");
    if (modalUpi) modalUpi.textContent = C.UPI_ID;

    if (qrModal) qrModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeQrModal() {
    if (qrModal) qrModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (qrCloseBtn) qrCloseBtn.onclick = closeQrModal;
  if (qrDoneBtn) {
    qrDoneBtn.onclick = () => {
      closeQrModal();
      const txnInput = document.querySelector('input[data-k="pay.txn"]');
      if (txnInput) txnInput.focus();
    };
  }
  if (qrModal) {
    qrModal.onclick = e => {
      if (e.target === qrModal) closeQrModal();
    };
  }

  if (copyUpiBtn) {
    copyUpiBtn.onclick = () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(C.UPI_ID).then(() => {
          copyUpiBtn.innerHTML = `✓ Copied <b>${esc(C.UPI_ID)}</b>!`;
          setTimeout(() => {
            copyUpiBtn.innerHTML = `📋 Copy UPI ID: <b>${esc(C.UPI_ID)}</b>`;
          }, 2500);
        });
      }
    };
  }

  // Keyboard shortcut: Escape closes modals & drawer
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeSidebar();
      closeQrModal();
    }
  });

  // ---------- Marketing & Pre-Booking Mode Handling ----------
  const prebookingBanner = $("#prebooking-banner");
  const previewToggle = $("#preview-form-toggle");

  function updateBookingStatus() {
    const isOpen = Boolean(C.BOOKINGS_OPEN);
    if (prebookingBanner) {
      prebookingBanner.style.display = isOpen ? "none" : "flex";
    }
    const topBookBtn = $("#top-book-btn");
    const heroBookBtn = $("#hero-book-btn");
    if (!isOpen) {
      if (topBookBtn) topBookBtn.textContent = "Bookings 7th Nov";
      if (heroBookBtn) heroBookBtn.textContent = "Bookings Open 7th Nov";
    }
  }

  if (previewToggle) {
    previewToggle.onclick = () => {
      previewMode = !previewMode;
      previewToggle.textContent = previewMode ? "Hide Preview" : "Preview Booking Steps";
      $("#card").scrollIntoView({ behavior: "smooth" });
    };
  }

  // Event Listeners for inputs
  document.addEventListener("input", e => {
    const k = e.target.dataset.k;
    if (!k) return;
    if (e.target.type == "tel") e.target.value = e.target.value.replace(/\D/g, "");
    set(k, e.target.value);
    save();
    if (k == "p.age") $("#ct").innerHTML = contact();
  });

  document.addEventListener("change", e => {
    if (e.target.id != "shot") return;
    file = e.target.files[0] || null;
    $("#shotn").textContent = file ? "Attached: " + file.name : "";
  });

  document.addEventListener("click", e => {
    const b = e.target.closest(".size");
    if (!b) return;

    if (!C.BOOKINGS_OPEN && !previewMode) {
      err(`📢 Bookings will officially open on ${C.BOOKING_OPEN_DATE_STR || "7th November 2026"}! Tap 'Get WhatsApp Reminder' above to stay notified.`);
      return;
    }

    S.n = +b.dataset.n;
    S.i = 1;
    render();
    jump();
  });

  $("#back").onclick = () => {
    S.i--;
    render();
    jump();
  };

  const jump = () => $("#book").scrollIntoView({ behavior: "smooth" });

  $("#f").addEventListener("submit", async e => {
    e.preventDefault();
    const cur = steps()[S.i];
    if (cur == "g") return;

    const m = check(cur);
    if (m) return err(m);

    if (cur != "p") {
      S.i++;
      render();
      return jump();
    }

    if (!C.BOOKINGS_OPEN && !previewMode) {
      return err(`📢 Bookings officially open on ${C.BOOKING_OPEN_DATE_STR || "7th November 2026"}!`);
    }

    const btn = $("#next");
    btn.disabled = true;
    btn.textContent = "Sending…";
    err();

    try {
      const body = {
        action: "book",
        hp: $("#hp").value,
        n: S.n,
        p: S.p,
        members: S.m.slice(0, S.n - 1),
        txn: S.pay.txn.trim(),
        q: S.q,
        shot: await shrink(file)
      };

      const j = await (await fetch(C.API_URL, {
        method: "POST",
        body: JSON.stringify(body)
      })).json();

      if (!j.ok) throw new Error(j.error);
      done(j.id);
      fetchSeats(); // Refresh seat count immediately!
    } catch (x) {
      err(x.message && x.message != "Failed to fetch"
        ? x.message
        : "Could not send booking. Check your connection or verify that Apps Script Web App is deployed with 'Who has access: Anyone'. Your details are saved.");
      btn.disabled = false;
      btn.textContent = "Confirm booking";
    }
  });

  function done(id) {
    const mail = esc(S.p.email);
    try { localStorage.removeItem(KEY); } catch (e) {}
    $("#card").innerHTML = `
      <div class="ok">
        <span style="font-size:3rem">🎉</span>
        <h3>Booking Received!</h3>
        <p class="bid">${esc(id)}</p>
        <p>A confirmation email has been dispatched to <b>${mail}</b>.</p>
        <p>Please keep this Booking ID for reference. Our team will verify your payment and send bus pickup coordinates on WhatsApp.</p>
        <div style="margin-top:20px;">
          <a class="btn" href="my-booking.html">View in 'My Booking'</a>
        </div>
      </div>`;
    jump();
  }

  // Populate dynamic contact links
  if (C.WHATSAPP) {
    const waUrl = "https://wa.me/" + C.WHATSAPP;
    const waFooter = $("#wa");
    if (waFooter) waFooter.href = waUrl;
    const sbWa = $("#sb-wa-link");
    if (sbWa) sbWa.href = waUrl;
  }
  if (C.PHONE) {
    const sbTel = $("#sb-tel-link");
    if (sbTel) sbTel.href = "tel:" + C.PHONE.replace(/\s+/g, "");
  }
  if (C.EMAIL) {
    const sbMail = $("#sb-mail-link");
    if (sbMail) sbMail.href = "mailto:" + C.EMAIL;
  }

  // Initialize
  updateBookingStatus();
  fetchSeats();
  render();
})();
