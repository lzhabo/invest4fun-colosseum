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
    card.style.pointerEvents = depth === 0 ? "auto" : "none";
  });
  dots?.replaceChildren(
    ...items.map((_, index) => {
      const dot = document.createElement("i");
      if (index === items.length - 1) dot.className = "active";
      return dot;
    }),
  );
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
  if (distance >= 24 || event.target instanceof Element) showNextCard();
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

document
  .querySelector<HTMLSelectElement>("[data-currency-picker]")
  ?.addEventListener("change", (event) => {
    const picker = event.currentTarget as HTMLSelectElement;
    const selected = currencyData[picker.value];
    if (!selected) return;
    const currencyCode = document.querySelector("[data-currency-code]");
    const localValue = document.querySelector("[data-local-value]");
    if (currencyCode) currencyCode.textContent = `${picker.value} cash`;
    if (localValue) localValue.textContent = selected.value;
    document
      .querySelector<SVGPolylineElement>("[data-local-line]")
      ?.setAttribute("points", selected.points);
  });

document
  .querySelectorAll<HTMLButtonElement>("[data-money-methods] .money-method")
  .forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll("[data-money-methods] .money-method")
        .forEach((item) => {
          item.classList.remove("is-active");
        });
      button.classList.add("is-active");
    });
  });

const aiExamples = [
  {
    prompt: "Bet on China’s tech comeback",
    title: "China tech comeback",
    assets: [
      ["Tencent", "TCENTx", "30%"],
      ["Xiaomi", "XIAOx", "25%"],
      ["BYD", "BYDCOx", "25%"],
      ["Meituan", "MEITx", "20%"],
    ],
  },
  {
    prompt: "Find AI infrastructure companies",
    title: "AI infrastructure",
    assets: [
      ["NBIS", "NBIS", "35%"],
      ["DRAM", "DRAM", "25%"],
      ["CRWV", "CRWV", "20%"],
      ["FCEL", "FCEL", "10%"],
    ],
  },
  {
    prompt: "Build a portfolio for rising geopolitical tensions",
    title: "War economy",
    assets: [
      ["RTX", "RTX", "30%"],
      ["Lockheed Martin", "LMT", "30%"],
      ["Northrop Grumman", "NOC", "20%"],
      ["Palantir", "PLTR", "20%"],
    ],
  },
];
let aiIndex = 0;
function renderAi() {
  const example = aiExamples[aiIndex];
  if (!example) return;
  const prompt = document.querySelector<HTMLElement>("[data-ai-prompt]");
  const title = document.querySelector<HTMLElement>("[data-ai-title]");
  const assets = document.querySelector<HTMLElement>("[data-ai-assets]");
  if (!prompt || !title || !assets) return;
  prompt.textContent = example.prompt;
  title.textContent = example.title;
  assets.replaceChildren(
    ...example.assets.map(([name, symbol, allocation]) => {
      const item = document.createElement("li");
      item.innerHTML = `<span class="ai-asset-mark">${(symbol ?? "").slice(0, 2)}</span><span class="ai-asset-copy"><strong>${name}</strong><small>${symbol}</small></span><b>${allocation}</b>`;
      return item;
    }),
  );
}
renderAi();
document
  .querySelector<HTMLButtonElement>("[data-ai-next]")
  ?.addEventListener("click", () => {
    aiIndex = (aiIndex + 1) % aiExamples.length;
    renderAi();
  });
window.setInterval(() => {
  aiIndex = (aiIndex + 1) % aiExamples.length;
  renderAi();
}, 5200);

const faqs = [
  [
    "What is invest4.fun?",
    "invest4.fun is a non-custodial, AI-guided investing app for crypto and tokenized stocks. Build an editable basket, review every asset, and approve the final transaction yourself.",
  ],
  [
    "How does the AI work?",
    "AI ranks assets that have already passed invest4.fun's eligibility checks, explains its reasoning, and helps shape an editable basket. It cannot sign or trade for you.",
  ],
  [
    "Do I need a crypto wallet or crypto to start investing?",
    "No. Sign in and we create an Invest4Fun smart account for you. You can fund it using available bank card, bank transfer, or supported stablecoin options.",
  ],
  [
    "Do you have access to my funds?",
    "No. invest4.fun is non-custodial. You stay in control of your account and assets, and every transaction requires your authorization.",
  ],
  [
    "Can I withdraw?",
    "Yes. You can sell supported positions to stablecoins, then withdraw to a linked bank account or eligible wallet. Availability and fees may vary.",
  ],
];
const faqList = document.querySelector<HTMLElement>("[data-faq-list]");
faqs.forEach(([question, answer], index) => {
  const item = document.createElement("article");
  item.className = `faq-item${index === 3 ? " is-open" : ""}`;
  item.innerHTML = `<h3><button type="button" aria-expanded="${index === 3}"><span>${question}</span><b>${index === 3 ? "−" : "+"}</b></button></h3><div class="faq-answer" ${index === 3 ? "" : "hidden"}><p>${answer}</p></div>`;
  item.querySelector("button")?.addEventListener("click", () => {
    const open = item.classList.toggle("is-open");
    item.querySelector("button")?.setAttribute("aria-expanded", String(open));
    const icon = item.querySelector("button b");
    const answer = item.querySelector<HTMLElement>(".faq-answer");
    if (icon) icon.textContent = open ? "−" : "+";
    if (answer) answer.hidden = !open;
  });
  faqList?.append(item);
});

renderStack();
