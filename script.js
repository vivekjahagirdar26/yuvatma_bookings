(() => {
  const C = window.YUV, $ = s => document.querySelector(s), KEY = "yuv26";
  let S = { i: 0, n: 0, p: {}, m: [{}, {}, {}], pay: {}, q: "" }, file = null;
  try { S = Object.assign(S, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const inr = n => "₹" + n.toLocaleString("en-IN");
  const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const get = k => k.split(".").reduce((o, x) => o && o[x], S) ?? "";
  const set = (k, v) => { const a = k.split("."), l = a.pop(); a.reduce((o, x) => o[x], S)[l] = v; };
  const total = () => S.n * C.PRICE;
  const steps = () => S.n > 1 ? ["g", "y", "m", "p"] : ["g", "y", "p"];
  const NAMES = { g: "Group", y: "You", m: "Members", p: "Payment" };
  const NUM = 'inputmode="numeric" maxlength="10"';

  const fld = (k, label, type = "text", extra = "", hint = "") =>
    `<label>${label}<input data-k="${k}" type="${type}" value="${esc(get(k))}" ${extra}></label>${hint ? `<p class="hint">${hint}</p>` : ""}`;

  const contact = () => {
    const a = +S.p.age;
    if (!a) return `<p class="hint">Enter your age and we'll show which contact we need.</p>`;
    return a < 25
      ? fld("p.parent", "Parent's / guardian's mobile number", "tel", NUM)
      : fld("p.ecName", "Emergency contact person's name") +
        fld("p.ecNum", "Emergency contact's mobile number", "tel", NUM, "A family member or friend, not another number of yours.");
  };

  const V = {
    g: () => `<h3>How many people are coming?</h3><p class="hint">Tap to continue. Total updates as you choose.</p>
      <div class="sizes">${[1, 2, 3, 4].map(n => `<button type="button" class="size ${S.n == n ? "on" : ""}" data-n="${n}"><b>${n == 1 ? "Just me" : n + " people"}</b><span>${inr(n * C.PRICE)}</span></button>`).join("")}</div>`,
    y: () => `<h3>Your details</h3>
      ${fld("p.name", "Full name", "text", 'autocomplete="name"')}
      ${fld("p.age", "Age", "number", 'min="1" max="99" inputmode="numeric"')}
      ${fld("p.mobile", "Mobile number (linked with WhatsApp)", "tel", NUM)}
      ${fld("p.email", "Email address", "email", 'autocomplete="email"')}
      <label>Home address<textarea data-k="p.addr" rows="2">${esc(get("p.addr"))}</textarea></label>
      ${fld("p.gotra", "Gotra (optional)")}
      <div id="ct">${contact()}</div>`,
    m: () => `<h3>Who's coming with you?</h3>${[...Array(S.n - 1)].map((_, i) =>
      `<fieldset><legend>Person ${i + 2}</legend>${fld(`m.${i}.name`, "Full name")}${fld(`m.${i}.age`, "Age", "number", 'min="1" max="99" inputmode="numeric"')}${fld(`m.${i}.mobile`, "Mobile number (optional)", "tel", NUM)}</fieldset>`).join("")}`,
    p: () => {
      const up = `upi://pay?pa=${C.UPI_ID}&pn=${encodeURIComponent(C.UPI_NAME)}&am=${total()}&cu=INR`;
      return `<h3>Pay ${inr(total())}</h3>
      <div class="pay"><img src="assets/upi-qr.png" alt="UPI QR code" onerror="this.remove()">
        <div><p>UPI ID: <b>${esc(C.UPI_ID)}</b></p><a class="btn ghost" href="${up}">Open UPI app</a>
        <p class="hint">Contribution is tentative and subject to confirmation.</p></div></div>
      ${fld("pay.txn", "Transaction ID / UTR")}
      <label>Payment screenshot<input type="file" id="shot" accept="image/*"></label>
      <p class="hint" id="shotn"></p>
      <label>Anything you'd like to ask us? (optional)<textarea data-k="q" rows="2">${esc(S.q)}</textarea></label>`;
    }
  };

  const err = m => { $("#err").textContent = m || ""; };
  function render() {
    const st = steps(); if (!S.n || S.i >= st.length) S.i = 0;
    const cur = st[S.i];
    $("#steps").innerHTML = st.map((s, i) => `<li class="${i == S.i ? "on" : i < S.i ? "done" : ""}">${NAMES[s]}</li>`).join("");
    $("#stage").innerHTML = V[cur]();
    $("#total").textContent = S.n && cur != "g" ? `Total: ${inr(total())} for ${S.n} ${S.n > 1 ? "people" : "person"}` : "";
    $("#back").hidden = S.i == 0;
    $("#next").hidden = cur == "g";
    $("#next").textContent = cur == "p" ? "Confirm booking" : "Continue";
    err(); save();
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
      if (+p.age < 25) { if (!P(p.parent)) return "Enter your parent's or guardian's 10-digit mobile number."; }
      else {
        if (!T(p.ecName)) return "Enter your emergency contact's name.";
        if (!P(p.ecNum)) return "Enter your emergency contact's 10-digit mobile number.";
        if (p.ecNum == p.mobile) return "Emergency contact must be someone other than you.";
      }
    }
    if (c == "m") for (let i = 0; i < S.n - 1; i++) {
      const m = S.m[i];
      if (!T(m.name) || !A(m.age) || (m.mobile && !P(m.mobile))) return `Complete person ${i + 2}: name, age, and a 10-digit mobile if you add one.`;
    }
    if (c == "p") {
      if (!T(S.pay.txn)) return "Enter the transaction ID from your payment app.";
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
      URL.revokeObjectURL(u); res(c.toDataURL("image/jpeg", .8).split(",")[1]);
    };
    img.onerror = () => rej(new Error("Could not read that image. Try a different screenshot."));
    img.src = u;
  });

  document.addEventListener("input", e => {
    const k = e.target.dataset.k; if (!k) return;
    if (e.target.type == "tel") e.target.value = e.target.value.replace(/\D/g, "");
    set(k, e.target.value); save();
    if (k == "p.age") $("#ct").innerHTML = contact();
  });
  document.addEventListener("change", e => {
    if (e.target.id != "shot") return;
    file = e.target.files[0] || null;
    $("#shotn").textContent = file ? "Attached: " + file.name : "";
  });
  document.addEventListener("click", e => {
    const b = e.target.closest(".size"); if (!b) return;
    S.n = +b.dataset.n; S.i = 1; render(); jump();
  });
  $("#back").onclick = () => { S.i--; render(); jump(); };
  const jump = () => $("#book").scrollIntoView();

  $("#f").addEventListener("submit", async e => {
    e.preventDefault();
    const cur = steps()[S.i]; if (cur == "g") return;
    const m = check(cur); if (m) return err(m);
    if (cur != "p") { S.i++; render(); return jump(); }
    const btn = $("#next"); btn.disabled = true; btn.textContent = "Sending…"; err();
    try {
      const body = { action: "book", hp: $("#hp").value, n: S.n, p: S.p, members: S.m.slice(0, S.n - 1), txn: S.pay.txn.trim(), q: S.q, shot: await shrink(file) };
      const j = await (await fetch(C.API_URL, { method: "POST", body: JSON.stringify(body) })).json();
      if (!j.ok) throw new Error(j.error);
      done(j.id);
    } catch (x) {
      err(x.message && x.message != "Failed to fetch" ? x.message : "Could not send. Check your connection and try again. Your details are saved.");
      btn.disabled = false; btn.textContent = "Confirm booking";
    }
  });

  function done(id) {
    const mail = esc(S.p.email);
    try { localStorage.removeItem(KEY); } catch (e) {}
    $("#card").innerHTML = `<div class="ok"><h3>Booking received</h3><p class="bid">${esc(id)}</p>
      <p>We've emailed a confirmation to ${mail}. Keep this booking ID for check-in.</p>
      <p>We'll verify your payment and share the venue and final details soon.</p></div>`;
    jump();
  }

  $("#wa").href = "https://wa.me/" + C.WHATSAPP;
  render();
})();
