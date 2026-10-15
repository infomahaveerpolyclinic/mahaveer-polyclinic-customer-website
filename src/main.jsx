import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Sun,
  Moon,
  Menu,
  X,
  Search,
  ArrowUp,
  ArrowUpRight,
  ShoppingBag,
  UserRound,
  Phone,
  Mail,
  MapPin,
  Heart,
  Activity,
  Stethoscope,
} from "lucide-react";
import { api, setCSRF } from "./api";
import { Home, DoctorCards, TestCards, MedicineCards } from "./Home";
import { Auth, Booking, LabBooking, PatientArea } from "./Portal";
import { Button, Field, Modal, ErrorBox, Empty, PageTitle, go } from "./UI";
import "./style.css";
import "./connected.css";
function Logo() {
  return (
    <a
      className="logo vector-logo"
      href="#home"
      aria-label="Mahaveer Polyclinic home"
    >
      <img
        src="/logo.svg"
        alt="Mahaveer Polyclinic — Complete Care. Trusted Diagnosis. Lifelong Wellness."
        width="1080"
        height="197"
      />
    </a>
  );
}
const accountPages = [
  "profile",
  "appointments",
  "reports",
  "bills",
  "orders",
  "cart",
  "wishlist",
  "prescriptions",
  "my-care",
  "notifications",
];
function App() {
  const [page, setPage] = useState(location.hash.slice(1) || "home"),
    [data, setData] = useState(null),
    [medicines, setMedicines] = useState([]),
    [user, setUser] = useState(null),
    [checking, setChecking] = useState(true),
    [error, setError] = useState(""),
    [menu, setMenu] = useState(false),
    [search, setSearch] = useState(""),
    [auth, setAuth] = useState(false),
    [pending, setPending] = useState(null),
    [booking, setBooking] = useState(null),
    [lab, setLab] = useState(null),
    [request, setRequest] = useState(null),
    [privacy, setPrivacy] = useState(false),
    [toast, setToast] = useState(""),
    [theme, setTheme] = useState(localStorage.getItem("mpc_theme") || "light"),
    [cookie, setCookie] = useState(localStorage.getItem("mpc_cookies") || ""),
    [progress, setProgress] = useState(0),
    [refreshKey, setRefreshKey] = useState(0);
  const notify = (s) => setToast(s);
  const settings = data?.settings || {};
  async function load() {
    try {
      const [d, m] = await Promise.all([
        api("/public/catalog"),
        api("/public/medicines"),
      ]);
      setData(d);
      setMedicines(m);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  async function loadUser() {
    try {
      const r = await api("/patient/me");
      setCSRF(r.csrfToken);
      setUser(r);
      return r;
    } catch {
      setUser(null);
      return null;
    } finally {
      setChecking(false);
    }
  }
  useEffect(() => {
    load();
    loadUser();
    const t = setInterval(() => {
      if (!document.hidden) load();
    }, 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const f = () => {
      setPage(location.hash.slice(1) || "home");
      setMenu(false);
      setSearch("");
    };
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("mpc_theme", theme);
  }, [theme]);
  useEffect(() => {
    const f = () =>
      setProgress(
        (scrollY /
          Math.max(1, document.documentElement.scrollHeight - innerHeight)) *
          100,
      );
    addEventListener("scroll", f, { passive: true });
    f();
    return () => removeEventListener("scroll", f);
  }, [page]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 6500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (cookie === "all") {
      const p = new URLSearchParams(location.search),
        u = {};
      for (const k of [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
      ])
        if (p.has(k)) u[k] = p.get(k).slice(0, 120);
      if (Object.keys(u).length)
        sessionStorage.setItem("mpc_utm", JSON.stringify(u));
    }
  }, [cookie]);
  function requireAuth(fn) {
    if (user) fn();
    else {
      setPending(() => fn);
      setAuth(true);
    }
  }
  const book = (id) => requireAuth(() => setBooking(id || 0));
  const chooseLab = (id) => requireAuth(() => setLab(id || 0));
  async function add(id) {
    requireAuth(async () => {
      try {
        const cart = await api("/patient/cart");
        const old = cart.find((i) => Number(i.id) === Number(id));
        await api("/patient/cart/" + id, {
          method: "PUT",
          body: { quantity: Math.min(100, (old?.quantity || 0) + 1) },
        });
        setRefreshKey((v) => v + 1);
        notify("Added to your cart.");
      } catch (e) {
        notify(e.message);
      }
    });
  }
  async function save(id) {
    requireAuth(async () => {
      try {
        await api("/patient/wishlist/" + id, {
          method: "PUT",
          body: { saved: true },
        });
        setRefreshKey((v) => v + 1);
        notify("Saved to your wishlist.");
      } catch (e) {
        notify(e.message);
      }
    });
  }
  async function signOut() {
    try {
      await api("/patient/logout", { method: "POST" });
      setCSRF("");
      setUser(null);
      go("home");
    } catch (e) {
      notify(e.message);
    }
  }
  const ask = (service, initial = "") => setRequest({ service, initial });
  const filtered = (list, keys) =>
    list.filter((i) =>
      keys.some((k) =>
        String(i[k] || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    );
  const doctors = data?.doctors || [],
    tests = data?.tests || [];
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="scroll-progress" style={{ width: progress + "%" }} />
      <header className="nav-shell">
        <nav className="nav">
          <Logo />
          <div className={"nav-links " + (menu ? "open" : "")}>
            {[
              ["home", "Home"],
              ["lab-tests", "Lab tests"],
              ["pharmacy", "Pharmacy"],
              ["doctors", "Doctors"],
              ["about", "About us"],
              ["contact", "Contact us"],
            ].map(([key, t]) => (
              <a
                key={key}
                href={"#" + key}
                aria-current={page === key ? "page" : undefined}
              >
                {t}
              </a>
            ))}
          </div>
          <div className="nav-actions">
            <button
              className="icon-btn"
              aria-label="Search site"
              onClick={() => go("search")}
            >
              <Search size={19} />
            </button>
            <button
              className="icon-btn"
              aria-label="Your cart"
              onClick={() => go("cart")}
            >
              <ShoppingBag size={19} />
            </button>
            <button
              className="icon-btn"
              aria-label="Patient account"
              onClick={() => go("profile")}
            >
              <UserRound size={19} />
            </button>
            <button
              className="icon-btn"
              aria-label={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              className="icon-btn mobile-menu"
              aria-label="Toggle menu"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <div className="content">
          <ErrorBox error={error} />
          {error && (
            <Button variant="outline small" onClick={load}>
              Reconnect
            </Button>
          )}
        </div>
        {!data && !error && (
          <div className="loading-line" role="status">
            Connecting to your clinic…
          </div>
        )}
        {page === "home" && (
          <Home
            data={data}
            medicines={medicines}
            book={book}
            lab={chooseLab}
            add={add}
            save={save}
            ask={ask}
          />
        )}
        {["doctors", "lab-tests", "pharmacy", "physio", "search"].includes(
          page,
        ) && (
          <div className="content listing-page">
            <PageTitle
              tag={
                page === "physio"
                  ? "MOVEMENT. STRENGTH. EVERYDAY LIFE."
                  : "FIND YOUR CARE"
              }
              title={
                {
                  doctors: "Meet your care team.",
                  "lab-tests": "A clearer picture of your health.",
                  pharmacy: "Your everyday pharmacy.",
                  physio: "Move toward a better everyday.",
                  search: "What can we help you find?",
                }[page]
              }
            >
              {page === "physio"
                ? "Assessment, a personal plan and progress you can follow. Book an available physiotherapist below."
                : "Browse current services, prices and availability from the clinic."}
            </PageTitle>
            <div className="search-field">
              <Search size={19} />
              <input
                aria-label="Search doctors, tests or medicines"
                placeholder="Search doctors, tests, medicines…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {page === "physio" && (
              <div className="physio-intro">
                <img
                  src="/images/knee-joint.png"
                  alt="Decorative joint illustration"
                />
                <div>
                  <span className="eyebrow">START WITH AN ASSESSMENT</span>
                  <h2>
                    Care for how
                    <br />
                    you <em>want to move.</em>
                  </h2>
                  <p>
                    Discuss movement, mobility and recovery goals with your
                    physiotherapist. Available programs and appointments are
                    listed by the clinic.
                  </p>
                  <div className="condition-tags">
                    {[
                      "Joint & muscle discomfort",
                      "Sports recovery",
                      "Post-operative rehabilitation",
                      "Posture & mobility",
                    ].map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <p className="fine">
                    The clinician will assess which services are appropriate and
                    available for you.
                  </p>
                </div>
              </div>
            )}
            {["doctors", "physio", "search"].includes(page) && (
              <>
                <h2 className="listing-title">
                  {page === "physio" ? "Physiotherapists" : "Doctors"}
                </h2>
                <DoctorCards
                  doctors={filtered(
                    page === "physio"
                      ? doctors.filter((d) =>
                          /physio/i.test(d.specialization + " " + d.department),
                        )
                      : doctors,
                    ["name", "specialization", "qualification"],
                  )}
                  book={book}
                />
              </>
            )}
            {["lab-tests", "search"].includes(page) && (
              <>
                <h2 className="listing-title">Laboratory tests</h2>
                <TestCards
                  tests={filtered(tests, ["name", "category", "code"])}
                  select={chooseLab}
                />
              </>
            )}
            {["pharmacy", "search"].includes(page) && (
              <>
                <h2 className="listing-title">Medicines</h2>
                <MedicineCards
                  medicines={filtered(medicines, [
                    "name",
                    "generic_name",
                    "description",
                  ])}
                  add={add}
                  save={save}
                />
              </>
            )}
          </div>
        )}
        {page === "about" && (
          <div className="content info-page">
            <PageTitle title="Care that comes together.">
              Mahaveer Polyclinic
            </PageTitle>
            <div className="about-grid">
              <img
                src="/images/stethoscope.png"
                alt="Medical care illustration"
              />
              <div>
                <span className="eyebrow">
                  COMPLETE CARE. TRUSTED DIAGNOSIS. LIFELONG WELLNESS.
                </span>
                <h2>
                  A familiar place
                  <br />
                  for your <em>everyday care.</em>
                </h2>
                <p>
                  {settings.about_text ||
                    "Mahaveer Polyclinic brings consultations, laboratory services, pharmacy and physiotherapy together in one connected care experience. Browse the services available today, arrange your visit, and keep your records close at hand."}
                </p>
                <p>
                  Our patient portal connects your booking, token, bills and
                  reports with the clinic team. Contact us to learn more about
                  current services and schedules.
                </p>
                <Button onClick={() => book()}>
                  Plan your visit <ArrowUpRight size={17} />
                </Button>
              </div>
            </div>
          </div>
        )}
        {page === "contact" && (
          <div className="content info-page">
            <PageTitle title="Let’s talk about your care.">
              For appointments, service availability and help with your account.
            </PageTitle>
            <div className="contact-grid">
              <article className="record-card">
                <MapPin />
                <h3>Visit the clinic</h3>
                <p>
                  {settings.address ||
                    "The clinic will publish its address here."}
                </p>
                <p>
                  {settings.opening_hours ||
                    "Contact reception for opening hours."}
                </p>
              </article>
              <article className="record-card">
                <Phone />
                <h3>Speak to reception</h3>
                {settings.phone ? (
                  <a href={"tel:" + settings.phone}>{settings.phone}</a>
                ) : (
                  <p>Contact details are being configured.</p>
                )}
                {settings.email && (
                  <p>
                    <a href={"mailto:" + settings.email}>{settings.email}</a>
                  </p>
                )}
                <Button variant="outline small" onClick={() => ask("callback")}>
                  Request a callback
                </Button>
              </article>
            </div>
          </div>
        )}
        {accountPages.includes(page) &&
          (checking ? (
            <div className="content page-title" role="status">
              Checking your session…
            </div>
          ) : user ? (
            <PatientArea
              page={page}
              user={user}
              settings={settings}
              notify={notify}
              signOut={signOut}
              requireAuth={requireAuth}
              add={add}
              save={save}
              refreshKey={refreshKey}
            />
          ) : (
            <div className="content info-page">
              <PageTitle title="Your care. Your space.">
                Sign in to manage appointments, daily tokens, bills, reports and
                pharmacy orders.
              </PageTitle>
              <Button onClick={() => setAuth(true)}>
                Sign in or register <ArrowUpRight size={17} />
              </Button>
              <img
                className="signin-art"
                src="/images/capsule.png"
                alt="Decorative medicine illustration"
              />
            </div>
          ))}
        {![
          "home",
          "doctors",
          "lab-tests",
          "pharmacy",
          "physio",
          "search",
          "about",
          "contact",
          ...accountPages,
        ].includes(page) && (
          <div className="content info-page">
            <PageTitle title="Let’s find your way." />
            <Button onClick={() => go("home")}>Return home</Button>
          </div>
        )}
      </main>
      <footer className="content">
        <div className="footer-main">
          <div>
            <Logo />
            <p>Complete care, connected.</p>
          </div>
          <div>
            <span className="eyebrow">EXPLORE</span>
            <a href="#doctors">Doctors</a>
            <a href="#lab-tests">Lab tests</a>
            <a href="#pharmacy">Pharmacy</a>
            <a href="#physio">Physiotherapy</a>
          </div>
          <div>
            <span className="eyebrow">VISIT & CONTACT</span>
            <p>
              {settings.address || "Clinic details will be published here."}
            </p>
            {settings.phone && (
              <a href={"tel:" + settings.phone}>
                <Phone size={15} />
                {settings.phone}
              </a>
            )}
            {settings.email && (
              <a href={"mailto:" + settings.email}>
                <Mail size={15} />
                {settings.email}
              </a>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Mahaveer Polyclinic</span>
          <button onClick={() => setPrivacy(true)}>Privacy & cookies</button>
          <a href="#profile">Patient account</a>
        </div>
      </footer>
      <button
        className="back-top icon-btn"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        <ArrowUp size={20} />
      </button>
      {!cookie && (
        <div className="cookie-banner">
          <p>
            We use essential cookies for secure sign-in. Optional preferences
            let us remember the campaign that brought you here.
          </p>
          <div>
            <Button
              variant="outline small"
              onClick={() => {
                localStorage.setItem("mpc_cookies", "necessary");
                setCookie("necessary");
              }}
            >
              Essential only
            </Button>
            <Button
              variant="small"
              onClick={() => {
                localStorage.setItem("mpc_cookies", "all");
                setCookie("all");
              }}
            >
              Allow preferences
            </Button>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            className="icon-btn"
            aria-label="Dismiss"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {auth && (
        <Auth
          onClose={() => setAuth(false)}
          onLogin={async () => {
            await loadUser();
            if (pending) {
              pending();
              setPending(null);
            }
          }}
        />
      )}{" "}
      {booking !== null && (
        <Booking
          doctors={doctors}
          initial={booking}
          onClose={() => setBooking(null)}
          notify={notify}
        />
      )}{" "}
      {lab !== null && (
        <LabBooking
          tests={tests}
          initial={lab}
          onClose={() => setLab(null)}
          notify={notify}
        />
      )}{" "}
      {request && (
        <ContactForm
          request={request}
          onClose={() => setRequest(null)}
          notify={notify}
        />
      )}{" "}
      {privacy && (
        <Modal
          title="Your information, handled with care."
          onClose={() => setPrivacy(false)}
        >
          <p>
            We use your details to arrange care, provide bills and reports, and
            respond to enquiries. Your records are available to you and
            authorized staff according to their roles.
          </p>
          <p>
            WhatsApp care updates are optional and can be disabled in your
            profile. Verification messages are sent when you request an account
            code. Medical results are accessed through your signed-in account.
          </p>
          <p>
            Essential cookies maintain your session. Local preferences remember
            your chosen theme. If you allow preferences, campaign tags from your
            visit may be attached to your registration. No advertising trackers
            are included.
          </p>
          <p>
            Contact the clinic for access, correction or retention questions.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem("mpc_cookies");
              sessionStorage.removeItem("mpc_utm");
              setCookie("");
              setPrivacy(false);
            }}
          >
            Change cookie preferences
          </Button>
        </Modal>
      )}
    </>
  );
}
function ContactForm({ request, onClose, notify }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal title="How can we help?" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          setError("");
          try {
            await api("/public/requests", {
              method: "POST",
              body: {
                name: f.get("name"),
                phone: f.get("phone"),
                service: request.service,
                message: f.get("message"),
                consent: f.get("consent") === "on",
              },
            });
            notify("Your request has been sent to reception.");
            onClose();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <Field label="Your name" name="name" required maxLength={200} />
          <Field label="Phone number" name="phone" type="tel" required />
        </div>
        <Field label="Message">
          <textarea
            name="message"
            defaultValue={request.initial}
            maxLength={4000}
          />
        </Field>
        <label className="checkbox">
          <input name="consent" type="checkbox" required />I agree to be
          contacted about this request.
        </label>
        <ErrorBox error={error} />
        <Button busy={busy}>Send request</Button>
      </form>
    </Modal>
  );
}
class ErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="content info-page">
        <h1>Something didn’t load.</h1>
        <p>Please refresh the page to reconnect.</p>
        <Button onClick={() => location.reload()}>Refresh</Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
