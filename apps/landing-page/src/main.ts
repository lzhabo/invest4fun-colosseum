import "@fontsource/archivo-black/latin-400.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "./styles.css";

const stack = document.querySelector<HTMLElement>("[data-preview-stack]");
const hint = document.querySelector<HTMLElement>("[data-swipe-hint]");
const dots = document.querySelector<HTMLElement>("[data-stack-dots]");

function cards() {
  return stack
    ? Array.from(stack.querySelectorAll<HTMLElement>("[data-preview-card]"))
    : [];
}

function renderStack() {
  const items = cards();
  items.forEach((card, index) => {
    const depth = items.length - 1 - index;
    card.style.setProperty("--depth", String(depth));
    card.style.zIndex = String(index + 1);
    card.tabIndex = depth === 0 ? 0 : -1;
    card.setAttribute("aria-hidden", depth === 0 ? "false" : "true");
    if (depth === 0) {
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "Show the next product preview");
    } else {
      card.removeAttribute("role");
      card.removeAttribute("aria-label");
    }
  });

  if (dots) {
    dots.replaceChildren(
      ...items.map((_, index) => {
        const dot = document.createElement("i");
        if (index === items.length - 1) dot.className = "active";
        return dot;
      }),
    );
  }
}

function showNextCard() {
  const items = cards();
  const top = items.at(-1);
  if (!stack || !top) return;
  stack.prepend(top);
  hint?.remove();
  renderStack();
}

let pointerStart: { x: number; y: number } | undefined;
stack?.addEventListener("pointerdown", (event) => {
  pointerStart = { x: event.clientX, y: event.clientY };
});
stack?.addEventListener("pointerup", (event) => {
  if (!pointerStart) return;
  const distance = Math.hypot(
    event.clientX - pointerStart.x,
    event.clientY - pointerStart.y,
  );
  pointerStart = undefined;
  if (distance >= 36 || event.target instanceof Element) showNextCard();
});
stack?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    showNextCard();
  }
});

const currencyData: Record<string, { value: string; points: string }> = {
  RUB: {
    value: "$4,980",
    points: "70,216 190,248 310,273 430,311 550,329 670,356 790,382 960,414",
  },
  TRY: {
    value: "$6,240",
    points: "70,216 190,235 310,258 430,286 550,312 670,338 790,367 960,394",
  },
  BRL: {
    value: "$8,120",
    points: "70,216 190,228 310,243 430,251 550,270 670,282 790,300 960,322",
  },
  INR: {
    value: "$8,870",
    points: "70,216 190,224 310,232 430,244 550,252 670,263 790,275 960,288",
  },
  IDR: {
    value: "$8,430",
    points: "70,216 190,226 310,237 430,248 550,263 670,274 790,290 960,306",
  },
  ZAR: {
    value: "$7,760",
    points: "70,216 190,231 310,247 430,264 550,281 670,296 790,318 960,342",
  },
  SGD: {
    value: "$9,620",
    points: "70,216 190,219 310,222 430,225 550,231 670,235 790,241 960,248",
  },
};

const picker = document.querySelector<HTMLSelectElement>(
  "[data-currency-picker]",
);
picker?.addEventListener("change", () => {
  const selected = currencyData[picker.value];
  if (!selected) return;
  const code = document.querySelector<HTMLElement>("[data-currency-code]");
  const value = document.querySelector<HTMLElement>("[data-local-value]");
  const line = document.querySelector<SVGPolylineElement>("[data-local-line]");
  if (code) code.textContent = `${picker.value} cash`;
  if (value) value.textContent = selected.value;
  line?.setAttribute("points", selected.points);
});

renderStack();
