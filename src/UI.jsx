import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Eye,
  EyeOff,
  LoaderCircle,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
export function Button({ children, busy, variant = "", ...props }) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className={"button " + variant + " " + (props.className || "")}
    >
      {busy && <LoaderCircle size={17} className="spin" />}
      {children}
    </button>
  );
}
export function Field({ label, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />}
    </label>
  );
}
export function Password({ label = "Password", ...props }) {
  const [show, set] = useState(false);
  return (
    <Field label={label}>
      <div className="password-input">
        <input {...props} type={show ? "text" : "password"} />
        <button
          type="button"
          onClick={() => set(!show)}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </Field>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    ref.current.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      onCancel={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <header className="dialog-head no-print">
        <div>
          <span className="eyebrow">MAHAVEER POLYCLINIC</span>
          <h2>{title}</h2>
        </div>
        <button className="icon-btn" aria-label="Close" onClick={onClose}>
          <X />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function ErrorBox({ error }) {
  return error ? (
    <p className="error" role="alert">
      {error}
    </p>
  ) : null;
}
export function Empty({ children = "No records yet." }) {
  return (
    <div className="empty-state">
      <span className="empty-orbit">+</span>
      <p>{children}</p>
    </div>
  );
}
export function CopyButton({ value }) {
  const [done, set] = useState(false);
  return (
    <button
      className="copy-btn no-print"
      aria-label="Copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(String(value));
          set(true);
          setTimeout(() => set(false), 2000);
        } catch {
          set(false);
        }
      }}
    >
      {done ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}
export function PageTitle({ tag = "YOUR CARE, CONNECTED", title, children }) {
  return (
    <div className="page-title">
      <span className="eyebrow">{tag}</span>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
export const go = (page) => {
  location.hash = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

export function printRecord(id) {
  const source = document.getElementById(id);
  if (!source) return;
  document.getElementById("print-document")?.remove();
  const sheet = document.createElement("div");
  sheet.id = "print-document";
  sheet.append(source.cloneNode(true));
  document.body.append(sheet);
  document.body.classList.add("printing");
  const cleanup = () => {
    sheet.remove();
    document.body.classList.remove("printing");
  };
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
}
