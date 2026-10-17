const header = document.querySelector("#header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("#nav");

const onScroll = () => header.classList.toggle("is-solid", window.scrollY > window.innerHeight * 0.72);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

toggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href");
    const target = id && id.length > 1 ? document.querySelector(id) : null;
    if (!target) return;
    event.preventDefault();
    nav.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-in");
    observer.unobserve(entry.target);
  });
}, { threshold: 0.16 });

document.querySelectorAll(".reveal").forEach((node) => {
  if (motion) node.classList.add("is-in");
  else observer.observe(node);
});
