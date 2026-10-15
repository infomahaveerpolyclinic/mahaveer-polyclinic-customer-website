import React, { useEffect, useRef } from "react";
const cuts = {
  stethoscope: [34, 64.3],
  microscope: [27, 70.6],
  capsule: [37.3, 62],
  "knee-joint": [61.55],
  "sample-vial": [23, 73.7],
};
export function Exploded({ name, hero = false, dark = false }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current,
      section = el.closest("[data-scene]");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let current = 0.4,
      target = 0.4,
      frame = 0,
      visible = true;
    const update = () => {
      const r = section.getBoundingClientRect();
      target = Math.max(
        0,
        Math.min(1, (innerHeight - r.top) / (innerHeight + r.height)),
      );
      if (!frame && !motion.matches && visible)
        frame = requestAnimationFrame(tick);
    };
    const tick = () => {
      current += (target - current) * 0.075;
      el.style.setProperty("--p", current.toFixed(4));
      if (Math.abs(target - current) > 0.0005)
        frame = requestAnimationFrame(tick);
      else frame = 0;
    };
    const obs = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) update();
      },
      { rootMargin: "150px" },
    );
    obs.observe(section);
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
    return () => {
      obs.disconnect();
      cancelAnimationFrame(frame);
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  }, []);
  const bounds = [0, ...cuts[name], 100];
  return (
    <div
      className={
        "exploded " + (hero ? "hero-art " : "") + (dark ? "dark-art" : "")
      }
      ref={ref}
      role="img"
      aria-label={`Exploded decorative 3D ${name.replace("-", " ")} sculpture`}
    >
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="art-glow" />
      <div className="art-layers">
        {bounds.slice(0, -1).map((top, i) => (
          <img
            key={i}
            src={`/images/${name}.png`}
            alt=""
            aria-hidden="true"
            loading={hero ? "eager" : "lazy"}
            decoding="async"
            width="1254"
            height="1254"
            style={{
              clipPath: `inset(${top}% 0 ${100 - bounds[i + 1]}% 0)`,
              "--layer": i,
              "--shift": i - (bounds.length - 2) / 2,
            }}
          />
        ))}
      </div>
      <span className="orbit-point point-a" />
      <span className="orbit-point point-b" />
    </div>
  );
}
