const header = document.querySelector("#header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("#nav");
const progress = document.querySelector("#progress");
const shaftLight = document.querySelector("#shaft-light");
const live = document.querySelector("#live");
const liveFoot = document.querySelector("#live-foot");
const cursor = document.querySelector("#cursor");
const hero = document.querySelector("#hero");
const heroImg = hero.querySelector("img");
const rail = document.querySelector("#walk-rail");
const caption = document.querySelector("#walk-caption");
const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = window.matchMedia("(pointer:fine)").matches && !motion;
document.body.classList.toggle("fine", fine);
if (!fine) cursor.remove();

function minutesNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour").value);
  const minute = Number(parts.find((part) => part.type === "minute").value);
  return { hour, minute, label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

function houseStatus(total) {
  const restaurant = total >= 8 * 60 || total < 60;
  const night = total >= 20 * 60 || total < 5 * 60;
  if (restaurant && night) return { text: "открыты оба этажа", closed: false, floor: "2" };
  if (restaurant) return { text: "ресторан открыт · бар и караоке с 20:00", closed: false, floor: "1" };
  if (night) return { text: "бар и караоке открыты · ресторан с 08:00", closed: false, floor: "2" };
  return { text: "сейчас закрыто · ресторан откроется в 08:00", closed: true, floor: "1" };
}

let floorChosen = false;
function paintClock() {
  const now = minutesNow();
  const state = houseStatus(now.hour * 60 + now.minute);
  const line = `${now.label} · ${state.text}`;
  live.textContent = line;
  liveFoot.textContent = line;
  live.classList.toggle("is-closed", state.closed);
  liveFoot.classList.toggle("is-closed", state.closed);
  if (!floorChosen) {
    floorChosen = true;
    setFloor(state.floor);
  }
}

function setFloor(floor) {
  document.querySelectorAll("[data-floor]").forEach((node) => {
    const on = node.dataset.floor === floor;
    node.classList.toggle("is-on", on);
    if (node.getAttribute("role") === "tab") node.setAttribute("aria-selected", on ? "true" : "false");
    if (node.getAttribute("role") === "tabpanel") node.hidden = !on;
  });
  document.querySelectorAll(".shaft [data-go]").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.go === floor ? "true" : "false");
  });
}

document.querySelectorAll("[data-floor], .shaft [data-go]").forEach((control) => {
  if (control.tagName !== "BUTTON") return;
  control.addEventListener("click", () => {
    floorChosen = true;
    setFloor(control.dataset.floor || control.dataset.go);
    if (control.dataset.go) document.querySelector("#lift").scrollIntoView({ behavior: motion ? "auto" : "smooth" });
  });
});

paintClock();
setInterval(paintClock, 30000);

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  progress.style.transform = `scaleX(${ratio})`;
  shaftLight.style.top = `${ratio * 113}px`;
  header.classList.toggle("is-solid", window.scrollY > window.innerHeight * 0.72);
  const marker = window.scrollY + 120;
  document.querySelectorAll("main section[id]").forEach((section) => {
    const link = nav.querySelector(`a[href="#${section.id}"]`);
    if (!link) return;
    const start = section.offsetTop;
    const end = start + section.offsetHeight;
    link.classList.toggle("is-here", marker >= start && marker < end);
  });
}
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

toggle.addEventListener("click", () => {
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
    toggle.setAttribute("aria-expanded", "false");
    target.scrollIntoView({ behavior: motion ? "auto" : "smooth", block: "start" });
  });
});

if (fine) {
  window.addEventListener("pointermove", (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    const hot = event.target.closest("a, button");
    cursor.classList.toggle("is-hot", Boolean(hot));
    const bounds = hero.getBoundingClientRect();
    if (event.clientY >= bounds.top && event.clientY <= bounds.bottom) {
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      heroImg.style.transform = `translate(${x * -24}px, ${y * -16}px) scale(1.08)`;
    }
  });
}

document.querySelectorAll("#menu button").forEach((item) => {
  item.addEventListener("pointerenter", () => {
    document.querySelectorAll("#menu button").forEach((button) => button.classList.remove("is-hot"));
    item.classList.add("is-hot");
  });
  item.addEventListener("focus", () => item.dispatchEvent(new Event("pointerenter")));
});

let dragging = false;
let startX = 0;
let startLeft = 0;
rail.addEventListener("pointerdown", (event) => {
  dragging = true;
  rail.classList.add("is-dragging");
  startX = event.clientX;
  startLeft = rail.scrollLeft;
  rail.setPointerCapture(event.pointerId);
});
rail.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  rail.scrollLeft = startLeft - (event.clientX - startX);
});
const stopDrag = () => {
  dragging = false;
  rail.classList.remove("is-dragging");
};
rail.addEventListener("pointerup", stopDrag);
rail.addEventListener("pointercancel", stopDrag);

const frames = [...rail.querySelectorAll("figure")];
const watchRail = () => {
  const center = rail.scrollLeft + rail.clientWidth / 2;
  let closest = frames[0];
  let best = Infinity;
  frames.forEach((frame) => {
    const mid = frame.offsetLeft + frame.offsetWidth / 2;
    const distance = Math.abs(mid - center);
    if (distance < best) {
      best = distance;
      closest = frame;
    }
  });
  caption.textContent = closest.dataset.caption;
};
rail.addEventListener("scroll", watchRail, { passive: true });
watchRail();

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
