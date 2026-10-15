import React from "react";
import {
  ArrowUpRight,
  Stethoscope,
  FlaskConical,
  Pill,
  Activity,
  Clock,
  CalendarDays,
  ShieldCheck,
  Truck,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Exploded } from "./Exploded";
import { Button, Empty, go } from "./UI";
import { money } from "./api";
export function DoctorCards({ doctors, book, limit }) {
  return (
    <div className="cards three">
      {doctors.slice(0, limit || doctors.length).map((d) => (
        <article className="care-card doctor-card" key={d.id}>
          <div className="card-image">
            {d.image_url ? (
              <img
                src={d.image_url}
                alt={d.name}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="doctor-placeholder">
                <Stethoscope size={48} />
                <span>{d.specialization}</span>
              </div>
            )}
          </div>
          <div className="card-content">
            <span className="eyebrow">{d.specialization}</span>
            <h3>{d.name}</h3>
            <p>{d.qualification}</p>
            <p className="muted">
              {d.department}
              {d.experience_years > 0
                ? " · " + d.experience_years + " years experience"
                : ""}
            </p>
            <div className="row-between">
              <strong>{money(d.consultation_fee_paise)}</strong>
              <Button variant="small" onClick={() => book(d.id)}>
                View times <ArrowUpRight size={16} />
              </Button>
            </div>
          </div>
        </article>
      ))}
      {!doctors.length && (
        <Empty>
          Doctor profiles and available appointment times will appear here when
          published by the clinic.
        </Empty>
      )}
    </div>
  );
}
export function TestCards({ tests, select, limit }) {
  return (
    <div className="cards three">
      {tests.slice(0, limit || tests.length).map((t) => (
        <article className="care-card" key={t.id}>
          <div className="test-art">
            <img
              src={t.image_url || "/images/sample-vial.png"}
              alt={t.image_url ? t.name : "Sample collection illustration"}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <span className="tag">{t.category}</span>
          </div>
          <div className="card-content">
            <h3>{t.name}</h3>
            <p>
              {t.sample_type} · {t.turnaround_hours}h typical turnaround
            </p>
            <p className="muted">
              {t.preparation ||
                "Check preparation instructions with the laboratory."}
            </p>
            <div className="row-between">
              <strong>{money(t.price_paise)}</strong>
              <Button variant="small" onClick={() => select(t.id)}>
                Book test <ArrowUpRight size={16} />
              </Button>
            </div>
            {t.home_collection && (
              <small className="delivery-note">
                <Truck size={14} /> Home collection available
              </small>
            )}
          </div>
        </article>
      ))}
      {!tests.length && (
        <Empty>
          Available laboratory tests will appear here once the clinic publishes
          its catalog.
        </Empty>
      )}
    </div>
  );
}
export function MedicineCards({ medicines, add, save, limit }) {
  return (
    <div className="cards four">
      {medicines.slice(0, limit || medicines.length).map((i) => (
        <article className="care-card medicine-card" key={i.id}>
          <div className="test-art">
            <img
              src={i.image_url || "/images/capsule.png"}
              alt={i.image_url ? i.name : "Medicine illustration"}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <button
              className="save-heart"
              aria-label={"Save " + i.name}
              onClick={() => save(i.id)}
            >
              ♡
            </button>
            {i.prescription_required && (
              <span className="tag">Prescription required</span>
            )}
          </div>
          <div className="card-content">
            <h3>{i.name}</h3>
            <p>{i.generic_name || i.description}</p>
            <small className="muted">
              {i.unit} ·{" "}
              {i.sellable_stock > 0 ? "In stock" : "Currently unavailable"}
            </small>
            <div className="row-between">
              <strong>{money(i.selling_price_paise)}</strong>
              <Button
                variant="small"
                disabled={i.sellable_stock <= 0}
                onClick={() => add(i.id)}
              >
                Add +
              </Button>
            </div>
            <small>
              {i.home_delivery ? "Delivery or clinic pickup" : "Clinic pickup"}
            </small>
          </div>
        </article>
      ))}
      {!medicines.length && (
        <Empty>
          Medicines and current stock are managed by the pharmacy. The catalog
          will appear here when available.
        </Empty>
      )}
    </div>
  );
}
function SectionHead({ tag, title, action, onClick }) {
  return (
    <div className="section-head">
      <div>
        <span className="eyebrow">{tag}</span>
        <h2>{title}</h2>
      </div>
      {action && (
        <button className="text-link" onClick={onClick}>
          {action}
          <ArrowUpRight size={18} />
        </button>
      )}
    </div>
  );
}
export function Home({ data, medicines, book, lab, add, save, ask }) {
  const settings = data?.settings || {},
    doctors = data?.doctors || [],
    tests = data?.tests || [],
    programs = data?.programs || [];
  return (
    <>
      <section className="hero" id="home" data-scene>
        <div className="hero-grid content">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="little-line" />
              COMPLETE CARE. ONE FAMILIAR PLACE.
            </span>
            <h1>
              Better care.
              <br />
              <em>Closer</em> to you.
            </h1>
            <p>
              From your first consultation to your next step in recovery.
              Doctors, diagnostics, pharmacy and physiotherapy, together at
              Mahaveer.
            </p>
            <div className="hero-actions">
              <Button onClick={() => book()}>
                Book your visit <ArrowUpRight size={19} />
              </Button>
              <button className="text-link" onClick={() => go("lab-tests")}>
                Explore our care <ArrowRight size={18} />
              </button>
            </div>
            <div className="hero-note">
              <ShieldCheck size={18} /> Your appointments, bills and reports in
              one place.
            </div>
          </div>
          <div className="hero-visual">
            <Exploded name="stethoscope" hero />
            <span className="art-caption">
              01 / A LITTLE CLOSER TO WELLNESS
            </span>
          </div>
        </div>
        <div className="hero-bottom content">
          <span>COMPLETE CARE. TRUSTED DIAGNOSIS. LIFELONG WELLNESS.</span>
          <span>SCROLL TO EXPLORE ↓</span>
        </div>
      </section>
      <section className="quick-services content">
        {[
          [Stethoscope, "Consult a doctor", "doctors"],
          [FlaskConical, "Book a lab test", "lab-tests"],
          [Pill, "Your pharmacy", "pharmacy"],
          [Activity, "Move better", "physio"],
        ].map(([Icon, t, p]) => (
          <button key={p} onClick={() => go(p)}>
            <Icon />
            <span>{t}</span>
            <ArrowUpRight size={18} />
          </button>
        ))}
      </section>
      <section className="intro content">
        <span className="eyebrow">CARE THAT COMES TOGETHER</span>
        <h2>
          Different needs.
          <br />
          <em>One connected clinic.</em>
        </h2>
        <p>
          A visit should feel simple. Find your clinician, choose an available
          time, and follow your daily token. Your care team works from the same
          connected records.
        </p>
      </section>
      <section className="content section-space">
        <SectionHead
          tag="MEET YOUR CARE TEAM"
          title={
            <>
              The right care.
              <br />
              <em>The right person.</em>
            </>
          }
          action="All doctors"
          onClick={() => go("doctors")}
        />
        <DoctorCards doctors={doctors} book={book} limit={3} />
      </section>
      <section className="chapter lab-chapter" data-scene>
        <div className="chapter-grid content">
          <div className="chapter-art">
            <Exploded name="microscope" />
          </div>
          <div className="chapter-copy">
            <span className="eyebrow">02 / DIAGNOSTICS</span>
            <h2>
              A clearer picture.
              <br />
              <em>A better next step.</em>
            </h2>
            <p>
              Browse current tests, see preparation details and choose clinic
              collection or an available home collection window.
            </p>
            <Button onClick={() => go("lab-tests")}>
              Explore lab tests <ArrowUpRight size={18} />
            </Button>
            <span className="chapter-footnote">
              Reports stay in your secure patient account.
            </span>
          </div>
        </div>
      </section>
      <section className="content section-space">
        <SectionHead
          tag="KNOW YOUR HEALTH"
          title={
            <>
              Tests, made <em>accessible.</em>
            </>
          }
          action="View all tests"
          onClick={() => go("lab-tests")}
        />
        <TestCards tests={tests} select={lab} limit={3} />
      </section>
      <section className="chapter pharmacy-chapter" data-scene>
        <div className="chapter-grid content">
          <div className="chapter-copy">
            <span className="eyebrow">03 / PHARMACY</span>
            <h2>
              Your everyday care.
              <br />
              <em>Within reach.</em>
            </h2>
            <p>
              Check real medicine availability. Save essentials, build your cart
              and request delivery or collection. A pharmacist reviews your
              order before billing.
            </p>
            <Button variant="light" onClick={() => go("pharmacy")}>
              Visit the pharmacy <ArrowUpRight size={18} />
            </Button>
          </div>
          <div className="chapter-art">
            <Exploded name="capsule" dark />
          </div>
        </div>
      </section>
      <section className="content section-space">
        <SectionHead
          tag="YOUR MEDICINE CABINET"
          title={
            <>
              Care, to your <em>door.</em>
            </>
          }
          action="Browse pharmacy"
          onClick={() => go("pharmacy")}
        />
        <MedicineCards medicines={medicines} add={add} save={save} limit={4} />
      </section>
      <section className="chapter physio-chapter" data-scene>
        <div className="chapter-grid content">
          <div className="chapter-art">
            <Exploded name="knee-joint" />
          </div>
          <div className="chapter-copy">
            <span className="eyebrow">04 / PHYSIOTHERAPY</span>
            <h2>
              Small movements.
              <br />
              <em>Meaningful progress.</em>
            </h2>
            <p>
              Start with an assessment. Work with a physiotherapist on a plan
              that fits your needs, then keep track of your sessions and
              progress.
            </p>
            <Button onClick={() => go("physio")}>
              Explore physiotherapy <ArrowUpRight size={18} />
            </Button>
            <span className="chapter-footnote">
              Personal care, from assessment through follow-up.
            </span>
          </div>
        </div>
      </section>
      <section className="content section-space">
        <SectionHead
          tag="STEPS TOWARD RECOVERY"
          title={
            <>
              A plan for <em>your everyday.</em>
            </>
          }
        />
        <div className="cards three">
          {programs.map((p, i) => (
            <article className="program-card" key={p.id}>
              <span className="program-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Activity />
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <button
                className="text-link"
                onClick={() => ask("program", p.name)}
              >
                Ask about this program <ArrowRight size={16} />
              </button>
            </article>
          ))}
          {!programs.length && (
            <Empty>
              Care programs will be listed as the clinic makes them available.
            </Empty>
          )}
        </div>
      </section>
      <section className="chapter preventive-chapter" data-scene>
        <div className="chapter-grid content">
          <div className="chapter-copy">
            <span className="eyebrow">05 / HOME SAMPLE COLLECTION</span>
            <h2>
              Less travel.
              <br />
              <em>More convenience.</em>
            </h2>
            <p>
              Choose an available collection window for eligible tests. Follow
              your sample from collection to review, with a notification when
              your paid report is ready.
            </p>
            <Button onClick={() => go("lab-tests")}>
              Plan a collection <ArrowUpRight size={18} />
            </Button>
          </div>
          <div className="chapter-art">
            <Exploded name="sample-vial" />
          </div>
        </div>
      </section>
      <section className="content section-space">
        <SectionHead
          tag="YOUR VISIT, SIMPLIFIED"
          title={
            <>
              A little planning.
              <br />
              <em>A smoother day.</em>
            </>
          }
        />
        <div className="steps-grid">
          {[
            [
              "01",
              "Choose your care",
              "Select a doctor, test or service from the current clinic catalog.",
            ],
            [
              "02",
              "Confirm your payment",
              "Pay at reception or submit your UPI transaction for verification.",
            ],
            [
              "03",
              "Follow your token",
              "See your daily token and queue updates in your account.",
            ],
            [
              "04",
              "Keep everything together",
              "Return to your bills, reports, prescriptions and care plans.",
            ],
          ].map(([n, t, d]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="account-band content">
        <div>
          <span className="eyebrow">YOUR PATIENT SPACE</span>
          <h2>
            Your care, <em>at a glance.</em>
          </h2>
          <p>
            A quieter way to stay up to date. Choose WhatsApp updates, track
            your appointment, and find what you need in your account.
          </p>
          <Button onClick={() => go("profile")}>
            Open your account <ArrowUpRight size={18} />
          </Button>
        </div>
        <div className="account-art">
          <img
            src="/images/stethoscope.png"
            loading="lazy"
            alt="Illustration of a stethoscope"
          />
          <span>
            <CalendarDays />
            Appointments & tokens
          </span>
          <span>
            <FlaskConical />
            Bills & reports
          </span>
          <span>
            <Pill />
            Orders & prescriptions
          </span>
        </div>
      </section>
      <section className="faq content section-space">
        <div>
          <span className="eyebrow">BEFORE YOUR VISIT</span>
          <h2>
            A few helpful <em>answers.</em>
          </h2>
        </div>
        <div>
          {[
            [
              "When will I receive my token?",
              "Your token is issued when full payment is confirmed. Online and reception visits use the same daily token counter.",
            ],
            [
              "Is a UPI reference enough to confirm payment?",
              "Reception first checks that the money has arrived. Your appointment remains pending until it is verified.",
            ],
            [
              "How accurate is the queue estimate?",
              "It is an estimate based on the patients ahead and recent consultation times. Clinical needs can change the wait.",
            ],
            [
              "Where can I find my reports?",
              "Sign in and open Reports. A report appears after review and full payment.",
            ],
            [
              "Can I book for someone else?",
              "Contact reception to register the person attending. Your online account is linked to your own verified patient profile.",
            ],
            [
              "Is this an emergency service?",
              "This website is for routine care. For an emergency, seek immediate help from local emergency services.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="contact-band">
        <div className="content">
          <span className="eyebrow">A HEALTHIER EVERYDAY STARTS HERE.</span>
          <h2>
            Let’s take care of <em>you.</em>
          </h2>
          <Button variant="light" onClick={() => book()}>
            Book your visit <ArrowUpRight size={18} />
          </Button>
        </div>
      </section>
    </>
  );
}
