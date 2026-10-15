import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  ArrowUpRight,
  Printer,
  Trash2,
  Plus,
  Minus,
  CalendarDays,
  Clock,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import {
  api,
  setCSRF,
  money,
  today,
  time,
  dateOnly,
  paise,
  API,
  label,
} from "./api";
import {
  Button,
  Field,
  Password,
  Modal,
  ErrorBox,
  Empty,
  CopyButton,
  printRecord,
  PageTitle,
  go,
} from "./UI";
export async function uploadFile(file, purpose) {
  if (!file || file.size > 5 * 1024 * 1024)
    throw new Error("Choose a PDF, JPEG or PNG file up to 5 MB.");
  const data = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  return api("/documents", {
    method: "POST",
    body: { purpose, filename: file.name, data },
  });
}
export function Auth({ onClose, onLogin }) {
  const [mode, setMode] = useState("login"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [challenge, setChallenge] = useState(""),
    [mobile, setMobile] = useState(""),
    [sent, setSent] = useState(false);
  async function otp() {
    setError("");
    setBusy(true);
    try {
      const r = await api("/patient/auth/otp", {
        method: "POST",
        body: { phone: mobile, consent: true },
      });
      setChallenge(r.challenge_id);
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError("");
    setBusy(true);
    try {
      const body = { email: f.get("email"), password: f.get("password") };
      if (mode !== "login")
        Object.assign(body, {
          phone: mobile,
          challenge_id: challenge,
          code: f.get("code"),
        });
      if (mode === "register")
        Object.assign(body, {
          name: f.get("name"),
          date_of_birth: f.get("date_of_birth"),
          gender: f.get("gender"),
          consent: f.get("consent") === "on",
          whatsapp_consent: f.get("whatsapp") === "on",
          utm: JSON.parse(sessionStorage.getItem("mpc_utm") || "{}"),
        });
      const r = await api(
        "/patient/auth/" + (mode === "reset" ? "reset" : mode),
        { method: "POST", body },
      );
      if (mode === "reset") {
        setMode("login");
        setSent(false);
        setError("Password updated. You can now sign in.");
      } else {
        setCSRF(r.csrfToken);
        await onLogin();
        onClose();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        mode === "login"
          ? "Welcome back."
          : mode === "reset"
            ? "Reset your password."
            : "Your care starts here."
      }
      onClose={onClose}
    >
      <div className="tabs no-print">
        {[
          ["login", "Sign in"],
          ["register", "Register"],
          ["reset", "Reset password"],
        ].map(([key, title]) => (
          <button
            key={key}
            className={mode === key ? "active" : ""}
            onClick={() => {
              setMode(key);
              setError("");
            }}
          >
            {title}
          </button>
        ))}
      </div>
      <form onSubmit={submit}>
        <div className="form-grid">
          {mode === "register" && (
            <>
              <Field
                label="Full name"
                name="name"
                autoComplete="name"
                required
                maxLength={200}
              />
              <Field
                label="Date of birth"
                name="date_of_birth"
                type="date"
                max={today()}
                min="1900-01-01"
                required
              />
              <Field label="Gender">
                <select name="gender">
                  <option value="unspecified">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </>
          )}
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <Password
            name="password"
            label={
              mode === "reset" ? "New password (12+ characters)" : "Password"
            }
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            minLength={mode === "login" ? 1 : 12}
            required
          />
          {mode !== "login" && (
            <>
              <Field
                label="WhatsApp number"
                type="tel"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  setChallenge("");
                  setSent(false);
                }}
                placeholder="91 followed by your number"
                required
              />
              <div className="otp-action">
                <Button
                  type="button"
                  variant="outline small"
                  busy={busy}
                  disabled={!mobile}
                  onClick={otp}
                >
                  {sent ? "Resend verification code" : "Send verification code"}
                </Button>
              </div>
              <Field
                label="6-digit WhatsApp code"
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
            </>
          )}
        </div>
        {mode !== "login" && (
          <p className="fine">
            By requesting a code, you agree to receive this verification message
            on WhatsApp. The code expires in 5 minutes.
          </p>
        )}
        {mode === "register" && (
          <>
            <label className="checkbox">
              <input name="consent" type="checkbox" required />I agree to the
              clinic using these details to arrange my care.
            </label>
            <label className="checkbox">
              <input name="whatsapp" type="checkbox" />
              Send appointment, payment, order and report updates to my WhatsApp
              number.
            </label>
          </>
        )}
        <ErrorBox error={error} />
        <Button busy={busy} disabled={mode !== "login" && !challenge}>
          {mode === "login"
            ? "Sign in"
            : mode === "reset"
              ? "Update password"
              : "Create my account"}
          <ArrowUpRight size={17} />
        </Button>
      </form>
    </Modal>
  );
}
export function Booking({ doctors, initial, onClose, notify }) {
  const [doctor, setDoctor] = useState(String(initial || doctors[0]?.id || "")),
    [day, setDay] = useState(today()),
    [slots, setSlots] = useState([]),
    [slot, setSlot] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setSlot("");
    setSlots([]);
    if (!doctor) return;
    setLoading(true);
    api(`/public/slots?doctor_id=${doctor}&date=${day}`)
      .then((r) => alive && setSlots(r))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [doctor, day]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await api("/patient/appointments", {
        method: "POST",
        body: {
          slot_id: Number(slot),
          reason: f.get("reason"),
          referral_note: f.get("referral_note"),
        },
      });
      notify(
        "Appointment reserved for 30 minutes. Confirm payment to receive your token.",
      );
      go("appointments");
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Make time for your health." onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Clinician">
            <select
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              required
            >
              <option value="">Choose your clinician</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.specialization}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Visit date"
            type="date"
            min={today()}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            required
          />
        </div>
        <div className="slot-grid">
          {slots.map((s) => (
            <button
              type="button"
              key={s.id}
              className={String(s.id) === slot ? "selected" : ""}
              onClick={() => setSlot(String(s.id))}
            >
              {time(s.starts_at)}
            </button>
          ))}
        </div>
        {loading ? (
          <p role="status">Checking availability…</p>
        ) : (
          !slots.length && (
            <p className="muted">
              No open times on this date. Choose another date or doctor.
            </p>
          )
        )}
        <Field
          label="Purpose of visit"
          name="reason"
          required
          maxLength={200}
        />
        <Field
          label="Who referred you? (optional)"
          name="referral_note"
          maxLength={500}
        />
        <div className="info-box">
          Consultation fee:{" "}
          <strong>
            {money(
              doctors.find((d) => String(d.id) === doctor)
                ?.consultation_fee_paise,
            )}
          </strong>
          <p>Your token is issued after full payment is confirmed.</p>
        </div>
        <ErrorBox error={error} />
        <Button busy={busy} disabled={!slot}>
          Reserve appointment <ArrowUpRight size={17} />
        </Button>
      </form>
    </Modal>
  );
}
export function LabBooking({ tests, initial, onClose, notify }) {
  const [selected, setSelected] = useState(initial ? [Number(initial)] : []),
    [mode, setMode] = useState("clinic"),
    [slots, setSlots] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    api("/public/collection-slots")
      .then(setSlots)
      .catch((e) => setError(e.message));
  }, []);
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api("/patient/lab-orders", {
        method: "POST",
        body: {
          test_ids: selected,
          collection_mode: mode,
          collection_address: f.get("address") || "",
          collection_slot_id: mode === "home" ? Number(f.get("slot")) : null,
          external_doctor: f.get("referrer") || "",
        },
      });
      notify("Your laboratory booking and bill are ready.");
      go("reports");
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Book your laboratory tests." onClose={onClose}>
      <form onSubmit={submit}>
        <div className="test-options">
          {tests.map((t) => (
            <label className="checkbox test-option" key={t.id}>
              <input
                type="checkbox"
                checked={selected.includes(Number(t.id))}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? [...selected, Number(t.id)]
                      : selected.filter((x) => x !== Number(t.id)),
                  )
                }
              />
              <span>
                <strong>{t.name}</strong>
                <small>
                  {t.preparation || "Ask the lab about preparation."}
                </small>
              </span>
              <b>{money(t.price_paise)}</b>
            </label>
          ))}
        </div>
        <Field label="Sample collection">
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="clinic">At the clinic</option>
            <option value="home">At home (eligible tests only)</option>
          </select>
        </Field>
        {mode === "home" && (
          <>
            <Field label="Available collection window">
              <select name="slot" required>
                <option value="">Choose a time</option>
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {dateOnly(s.starts_at)} · {time(s.starts_at)}–
                    {time(s.ends_at)} · {s.remaining} available
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Complete collection address">
              <textarea
                name="address"
                required
                minLength={10}
                maxLength={1500}
              />
            </Field>
          </>
        )}
        <Field
          label="Referring doctor (optional)"
          name="referrer"
          maxLength={200}
        />
        <p className="price">
          Total:{" "}
          {money(
            tests
              .filter((t) => selected.includes(Number(t.id)))
              .reduce((a, t) => a + Number(t.price_paise), 0),
          )}
        </p>
        <ErrorBox error={error} />
        <Button busy={busy} disabled={!selected.length}>
          Book tests
        </Button>
      </form>
    </Modal>
  );
}
function useData(path, version = 0, poll = false) {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const load = () =>
      api(path)
        .then((d) => {
          if (alive) {
            setData(d);
            setError("");
          }
        })
        .catch((e) => alive && setError(e.message));
    load();
    const timer = poll
      ? setInterval(() => !document.hidden && load(), 15000)
      : null;
    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [path, version, poll]);
  return { data, error };
}
export function Bill({ id, settings, onClose, notify }) {
  const { data, error } = useData("/patient/bills/" + id),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState(""),
    [qr, setQR] = useState("");
  useEffect(() => {
    if (!data || !settings.upi_id) return;
    const query = new URLSearchParams({
      pa: settings.upi_id,
      pn: settings.upi_payee || settings.name || "Mahaveer Polyclinic",
      am: (Number(data.invoice.balance_paise) / 100).toFixed(2),
      cu: "INR",
      tn: data.invoice.invoice_no,
    });
    QRCode.toDataURL("upi://pay?" + query.toString(), {
      width: 224,
      margin: 2,
    }).then(setQR);
  }, [data, settings]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const f = new FormData(e.currentTarget);
    try {
      await api("/patient/bills/" + id + "/submit-payment", {
        method: "POST",
        body: {
          reference: f.get("reference"),
          amount_paise: paise(f.get("amount")),
        },
      });
      notify(
        "Payment reference submitted. Reception will confirm settlement before issuing a token.",
      );
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function onlinePay() {
    setBusy(true);
    setErr("");
    try {
      const o = await api("/patient/bills/" + id + "/razorpay-order", {
        method: "POST",
      });
      if (!window.Razorpay)
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = resolve;
          s.onerror = () =>
            reject(new Error("Payment checkout could not load."));
          document.body.append(s);
        });
      new window.Razorpay({
        key: o.key,
        amount: o.amount,
        currency: o.currency,
        order_id: o.order_id,
        name: settings.name || "Mahaveer Polyclinic",
        handler: () =>
          notify(
            "Payment submitted. Confirmation will appear after provider verification.",
          ),
        theme: { color: "#103d56" },
      }).open();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Your bill & payment." onClose={onClose}>
      <ErrorBox error={error || err} />
      {data && (
        <>
          <div className="print-sheet" id="print-bill">
            <img
              className="bill-logo"
              src="/logo.svg"
              alt="Mahaveer Polyclinic"
            />
            <p>
              {data.invoice.voided_at && "VOID · " + data.invoice.void_reason}
            </p>
            <h3>
              {data.invoice.invoice_no}
              <CopyButton value={data.invoice.invoice_no} />
            </h3>
            <p>
              {dateOnly(data.invoice.created_at)} · {label(data.invoice.kind)}
            </p>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.description}</td>
                    <td>{i.quantity}</td>
                    <td>{money(i.line_total_paise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="invoice-total">
              <p>
                Subtotal <strong>{money(data.invoice.subtotal_paise)}</strong>
              </p>
              <p>
                Discount <strong>{money(data.invoice.discount_paise)}</strong>
              </p>
              <p>
                Tax <strong>{money(data.invoice.tax_paise)}</strong>
              </p>
              <p>
                Total <strong>{money(data.invoice.total_paise)}</strong>
              </p>
              <p>
                Paid <strong>{money(data.invoice.paid_paise)}</strong>
              </p>
              <p>
                Balance <strong>{money(data.invoice.balance_paise)}</strong>
              </p>
            </div>
            {data.payments.map((p, i) => (
              <p key={i}>
                {label(p.kind)} · {money(p.amount_paise)} · {p.method} ·{" "}
                {p.reference} · {dateOnly(p.created_at)}
              </p>
            ))}
            <p>
              {settings.name} · {settings.address} · {settings.phone}
            </p>
          </div>
          <Button
            variant="outline small no-print"
            onClick={() => printRecord("print-bill")}
          >
            <Printer size={16} />
            Print / Save PDF
          </Button>
          {!data.invoice.voided_at &&
            Number(data.invoice.balance_paise) > 0 && (
              <div className="payment-section no-print">
                {settings.upi_id ? (
                  <>
                    <h3>Pay with UPI</h3>
                    <p>
                      Scan using your payment app, then enter the transaction
                      reference.
                    </p>
                    {qr && (
                      <img
                        src={qr}
                        width="224"
                        height="224"
                        alt="UPI payment QR code"
                      />
                    )}
                    <p>
                      {settings.upi_id}
                      <CopyButton value={settings.upi_id} />
                    </p>
                  </>
                ) : (
                  <p>
                    You can pay at reception. If the clinic supplied a payment
                    QR, enter the settled transaction reference below.
                  </p>
                )}
                <form onSubmit={submit}>
                  <div className="form-grid">
                    <Field
                      label="Amount paid (₹)"
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={Number(data.invoice.balance_paise) / 100}
                      defaultValue={Number(data.invoice.balance_paise) / 100}
                      required
                    />
                    <Field
                      label="UPI / bank transaction reference"
                      name="reference"
                      pattern="[A-Za-z0-9_-]{6,100}"
                      required
                    />
                  </div>
                  <p className="fine">
                    Submission does not confirm payment. Reception will verify
                    it.
                  </p>
                  <Button busy={busy}>Submit for verification</Button>
                </form>
                {settings.razorpay_enabled && (
                  <Button variant="outline" busy={busy} onClick={onlinePay}>
                    Pay securely online
                  </Button>
                )}
              </div>
            )}
        </>
      )}
    </Modal>
  );
}
export function PatientArea({
  page,
  user,
  settings,
  notify,
  signOut,
  requireAuth,
  add,
  save,
  refreshKey = 0,
}) {
  const [version, setVersion] = useState(0),
    [bill, setBill] = useState(null),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState(""),
    [confirm, setConfirm] = useState(null);
  const routes = {
    appointments: "appointments",
    bills: "bills",
    reports: "reports",
    orders: "orders",
    cart: "cart",
    wishlist: "wishlist",
    prescriptions: "prescriptions",
    "my-care": "rehab",
    profile: "me",
    notifications: "notifications",
  };
  const path = "/patient/" + (routes[page] || "me");
  const { data, error } = useData(
    path,
    version + refreshKey,
    page === "appointments" || page === "orders",
  );
  async function run(fn) {
    setBusy(true);
    setErr("");
    try {
      await fn();
      setVersion((v) => v + 1);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function checkout(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    run(async () => {
      let doc = null;
      const file = f.get("prescription");
      if (file?.size) doc = await uploadFile(file, "prescription");
      await api("/patient/orders", {
        method: "POST",
        body: {
          delivery_mode: f.get("mode"),
          delivery_address: f.get("address") || "",
          referral_note: f.get("referral") || "",
          prescription_document_id: doc?.id || null,
          request_key: crypto.randomUUID(),
        },
      });
      notify(
        "Order received. A pharmacist will review it and prepare your bill.",
      );
      go("orders");
    });
  }
  const nav = [
    ["profile", "Profile"],
    ["appointments", "Appointments"],
    ["reports", "Lab reports"],
    ["bills", "Bills"],
    ["orders", "Orders"],
    ["prescriptions", "Prescriptions"],
    ["my-care", "Physio plans"],
    ["wishlist", "Wishlist"],
    ["cart", "Cart"],
    ["notifications", "Updates"],
  ];
  return (
    <div className="content portal-wrap">
      <PageTitle title={nav.find((n) => n[0] === page)?.[1] || "Your account"}>
        Welcome, {user.patient?.name || user.user?.name}. Your care, connected.
      </PageTitle>
      <div className="portal-nav">
        {nav.map(([key, name]) => (
          <button
            key={key}
            onClick={() => go(key)}
            className={page === key ? "active" : ""}
          >
            {name}
          </button>
        ))}
        <button onClick={signOut}>
          <LogOut size={15} />
          Sign out
        </button>
      </div>
      <ErrorBox error={error || err} />
      {!data && !error && (
        <div className="skeleton-list" role="status">
          Loading your records…
        </div>
      )}
      {page === "profile" && data && (
        <form
          className="profile-panel"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            run(async () => {
              await api("/patient/profile", {
                method: "PATCH",
                body: {
                  address: f.get("address"),
                  emergency_contact: f.get("emergency_contact"),
                  whatsapp_consent: f.get("whatsapp") === "on",
                },
              });
              notify("Your preferences have been updated.");
            });
          }}
        >
          <div className="profile-heading">
            <div className="profile-initial">{data.patient.name[0]}</div>
            <div>
              <h2>{data.patient.name}</h2>
              <p>
                {data.patient.patient_no}
                <CopyButton value={data.patient.patient_no} />
              </p>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Verified phone" value={data.patient.phone} readOnly />
            <Field label="Email" value={data.patient.email} readOnly />
            <Field
              label="Date of birth"
              value={data.patient.date_of_birth}
              readOnly
            />
            <Field
              label="Emergency contact"
              name="emergency_contact"
              defaultValue={data.patient.emergency_contact}
              maxLength={100}
            />
          </div>
          <Field label="Address">
            <textarea
              name="address"
              defaultValue={data.patient.address}
              maxLength={1500}
            />
          </Field>
          <label className="checkbox">
            <input
              name="whatsapp"
              type="checkbox"
              defaultChecked={data.patient.whatsapp_consent}
            />
            Receive care updates on WhatsApp
          </label>
          <p className="fine">
            Last sign-in:{" "}
            {data.user.last_login_at
              ? new Date(data.user.last_login_at).toLocaleString("en-IN")
              : "This session"}
            . Contact reception to correct identity details.
          </p>
          <Button busy={busy}>Save preferences</Button>
        </form>
      )}
      {page === "appointments" && data && (
        <div className="record-grid">
          {data.map((a) => (
            <article className="record-card" key={a.id}>
              <div className="row-between">
                <span className="tag">{label(a.status)}</span>
                <span className="muted">{a.appointment_no}</span>
              </div>
              <h3>{a.doctor_name}</h3>
              <p>
                {a.specialization} · {label(a.service)}
              </p>
              <p>
                <CalendarDays size={16} /> {dateOnly(a.starts_at)} ·{" "}
                {time(a.starts_at)}
              </p>
              <div className="token-display">
                <span>YOUR TOKEN</span>
                <strong>
                  {a.token_number
                    ? String(a.token_number).padStart(2, "0")
                    : "—"}
                </strong>
                <p>
                  {a.token_number
                    ? `${a.tokens_ahead} ahead · ${label(a.token_status)}`
                    : "Awaiting confirmed payment"}
                </p>
              </div>
              <p className="fine">
                Tokens are unique per date. Queue timing may change.
              </p>
              <div className="row-between">
                {a.invoice_id && (
                  <Button variant="small" onClick={() => setBill(a.invoice_id)}>
                    {Number(a.balance_paise) > 0
                      ? "Pay " + money(a.balance_paise)
                      : "View bill"}
                  </Button>
                )}
                {a.status === "requested" && (
                  <button
                    className="text-link"
                    onClick={() =>
                      setConfirm({
                        title: "Cancel this unpaid appointment?",
                        action: () =>
                          api("/patient/appointments/" + a.id + "/cancel", {
                            method: "POST",
                          }),
                      })
                    }
                  >
                    Cancel
                  </button>
                )}
              </div>
            </article>
          ))}
          {!data.length && (
            <Empty>
              No appointments yet. Choose a doctor and an available time to get
              started.
            </Empty>
          )}
        </div>
      )}
      {page === "bills" && data && (
        <div className="records-table">
          {data.map((i) => (
            <article className="list-record" key={i.id}>
              <div>
                <h3>{i.invoice_no}</h3>
                <p>
                  {label(i.kind)} · {dateOnly(i.created_at)}
                </p>
              </div>
              <div>
                <strong>{money(i.total_paise)}</strong>
                <p className="muted">
                  {i.voided_at
                    ? "Void"
                    : Number(i.balance_paise) > 0
                      ? money(i.balance_paise) + " due"
                      : "Paid"}
                </p>
              </div>
              <Button variant="small outline" onClick={() => setBill(i.id)}>
                View bill <ArrowUpRight size={16} />
              </Button>
            </article>
          ))}
          {!data.length && <Empty>No bills yet.</Empty>}
        </div>
      )}
      {page === "reports" && data && (
        <div className="record-grid">
          {data.map((l) => (
            <article
              className="record-card print-sheet"
              key={l.id}
              id={"report-" + l.id}
            >
              <div className="row-between">
                <span className="tag">{label(l.status)}</span>
                <CopyButton value={l.sample_code} />
              </div>
              <h3>{l.sample_code}</h3>
              <p>
                {label(l.collection_mode)} collection{" "}
                {l.collection_at &&
                  "· " +
                    dateOnly(l.collection_at) +
                    " " +
                    time(l.collection_at)}
              </p>
              {l.items.map((t, i) => (
                <div className="report-result" key={i}>
                  <strong>{t.name}</strong>
                  {t.result !== undefined ? (
                    <>
                      <p>
                        {t.result} {t.units}{" "}
                        <span className={"result-" + t.flag}>
                          {label(t.flag)}
                        </span>
                      </p>
                      <small>Reference: {t.reference_range}</small>
                    </>
                  ) : (
                    <p className="muted">
                      Available after review and full payment.
                    </p>
                  )}
                </div>
              ))}
              <div className="row-between no-print">
                <Button
                  variant="small outline"
                  onClick={() => setBill(l.invoice_id)}
                >
                  View bill
                </Button>
                {l.report_document_id && (
                  <a
                    className="text-link"
                    href={API + "/documents/" + l.report_document_id}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download report
                  </a>
                )}
                {l.status === "released" && Number(l.balance_paise) === 0 && (
                  <button
                    className="text-link"
                    onClick={() => printRecord("report-" + l.id)}
                  >
                    <Printer size={16} />
                    Print report
                  </button>
                )}
              </div>
            </article>
          ))}
          {!data.length && (
            <Empty>
              Your lab bookings and reviewed reports will appear here.
            </Empty>
          )}
        </div>
      )}
      {page === "orders" && data && (
        <div className="record-grid">
          {data.map((o) => (
            <article className="record-card" key={o.id}>
              <span className="tag">{label(o.status)}</span>
              <h3>Order #{o.id}</h3>
              <p>
                {label(o.delivery_mode)} · {dateOnly(o.created_at)}
              </p>
              {o.items.map((i, n) => (
                <p key={n}>
                  {i.name} × {i.quantity}
                </p>
              ))}
              {o.review_note && <p className="info-box">{o.review_note}</p>}
              {o.tracking_reference && (
                <p>
                  Tracking: {o.tracking_reference}
                  <CopyButton value={o.tracking_reference} />
                </p>
              )}
              {o.invoice_id ? (
                <Button variant="small" onClick={() => setBill(o.invoice_id)}>
                  {Number(o.balance_paise) > 0
                    ? "View & pay bill"
                    : "View receipt"}
                </Button>
              ) : (
                <p className="fine">
                  A pharmacist will check stock, pricing and any prescription
                  before creating a bill.
                </p>
              )}
            </article>
          ))}
          {!data.length && (
            <Empty>Your pharmacy orders will appear here.</Empty>
          )}
        </div>
      )}
      {page === "cart" && data && (
        <>
          <div className="records-table">
            {data.map((i) => (
              <article className="list-record" key={i.id}>
                <img
                  className="mini-product"
                  src={i.image_url || "/images/capsule.png"}
                  alt=""
                />
                <div>
                  <h3>{i.name}</h3>
                  <p>{money(i.selling_price_paise)} / unit</p>
                  {i.prescription_required && (
                    <small>Prescription required</small>
                  )}
                </div>
                <Field
                  label="Quantity"
                  type="number"
                  min={1}
                  max={100}
                  value={i.quantity}
                  onChange={(e) =>
                    run(() =>
                      api("/patient/cart/" + i.id, {
                        method: "PUT",
                        body: { quantity: Number(e.target.value) },
                      }),
                    )
                  }
                />
                <strong>
                  {money(Number(i.selling_price_paise) * i.quantity)}
                </strong>
                <button
                  aria-label={"Remove " + i.name}
                  className="icon-btn"
                  onClick={() =>
                    run(() =>
                      api("/patient/cart/" + i.id, {
                        method: "PUT",
                        body: { quantity: 0 },
                      }),
                    )
                  }
                >
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
          </div>
          {!data.length ? (
            <Empty>
              Your cart is empty. Browse the pharmacy to add medicines.
            </Empty>
          ) : (
            <form className="checkout-panel" onSubmit={checkout}>
              <h2>Request your order.</h2>
              <p className="price">
                Items subtotal:{" "}
                {money(
                  data.reduce(
                    (s, i) => s + Number(i.selling_price_paise) * i.quantity,
                    0,
                  ),
                )}
              </p>
              <p className="fine">
                Final batch pricing, any tax, and availability are confirmed by
                the pharmacist before billing. Stock is allocated on acceptance.
              </p>
              <div className="form-grid">
                <Field label="How would you like to receive it?">
                  <select name="mode">
                    <option value="pickup">Collect at the clinic</option>
                    <option value="delivery">
                      Door delivery (eligible items)
                    </option>
                  </select>
                </Field>
                <Field
                  label="Referring doctor or person (optional)"
                  name="referral"
                />
              </div>
              <Field label="Delivery address">
                <textarea name="address" maxLength={1500} />
              </Field>
              <Field label="Upload prescription (PDF, JPEG or PNG, up to 5 MB)">
                <input
                  name="prescription"
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  required={data.some((i) => i.prescription_required)}
                />
              </Field>
              <Button busy={busy}>Request pharmacist review</Button>
            </form>
          )}
        </>
      )}
      {page === "wishlist" && data && (
        <div className="record-grid">
          {data.map((i) => (
            <article className="record-card" key={i.id}>
              <img
                className="mini-product"
                src={i.image_url || "/images/capsule.png"}
                alt=""
              />
              <h3>{i.name}</h3>
              <p>{money(i.selling_price_paise)}</p>
              <div className="row-between">
                <Button
                  variant="small"
                  disabled={!Number(i.sellable_stock)}
                  onClick={() => add(i.id)}
                >
                  Add to cart
                </Button>
                <button
                  className="text-link"
                  onClick={() =>
                    run(() =>
                      api("/patient/wishlist/" + i.id, {
                        method: "PUT",
                        body: { saved: false },
                      }),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
          {!data.length && (
            <Empty>Save medicines to return to them later.</Empty>
          )}
        </div>
      )}
      {page === "prescriptions" && data && (
        <div className="record-grid">
          {data.map((r) => (
            <article
              className="record-card print-sheet"
              key={r.id}
              id={"prescription-" + r.id}
            >
              <h3>Prescription #{r.id}</h3>
              <p>
                {r.doctor_name} · {dateOnly(r.created_at)}
              </p>
              {r.items.map((i, n) => (
                <div className="report-result" key={n}>
                  <strong>{i.name}</strong>
                  <p>
                    {i.dosage} · {i.frequency} · {i.duration}
                  </p>
                  <p>{i.instructions}</p>
                </div>
              ))}
              <p>{r.notes}</p>
              <Button
                variant="outline small no-print"
                onClick={() => printRecord("prescription-" + r.id)}
              >
                <Printer size={16} />
                Print
              </Button>
            </article>
          ))}
          {!data.length && (
            <Empty>No prescriptions have been recorded yet.</Empty>
          )}
        </div>
      )}
      {page === "my-care" && data && (
        <div className="record-grid">
          {data.map((p) => (
            <article className="record-card" key={p.id}>
              <span className="tag">{label(p.status)}</span>
              <h3>{p.title}</h3>
              <p>{p.doctor_name}</p>
              <p>{p.goals}</p>
              <progress value={p.sessions.length} max={p.planned_sessions} />
              <p>
                {p.sessions.length} of {p.planned_sessions} sessions
              </p>
              {p.sessions.map((s, i) => (
                <div className="report-result" key={i}>
                  <strong>{dateOnly(s.session_date)}</strong>
                  <p>{s.notes}</p>
                  <small>Recorded pain score: {s.pain_score}/10</small>
                </div>
              ))}
            </article>
          ))}
          {!data.length && (
            <Empty>
              Your physiotherapist’s plan will appear here after your
              assessment.
            </Empty>
          )}
        </div>
      )}
      {page === "notifications" && data && (
        <div className="records-table">
          {data.map((n) => (
            <article className="list-record" key={n.id}>
              <div>
                <h3>{label(n.event)}</h3>
                <p>{dateOnly(n.created_at)}</p>
              </div>
              <span className="tag">{label(n.status)}</span>
            </article>
          ))}
          {!data.length && (
            <Empty>
              No WhatsApp updates have been queued for your account.
            </Empty>
          )}
        </div>
      )}
      {bill && (
        <Bill
          id={bill}
          settings={settings}
          onClose={() => {
            setBill(null);
            setVersion((v) => v + 1);
          }}
          notify={notify}
        />
      )}{" "}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p>This will release the appointment time.</p>
          <div className="row-between">
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Keep appointment
            </Button>
            <Button
              busy={busy}
              onClick={() =>
                run(async () => {
                  await confirm.action();
                  setConfirm(null);
                  notify("Appointment cancelled.");
                })
              }
            >
              Confirm cancellation
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
