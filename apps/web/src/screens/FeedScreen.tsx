import type { FeedItem, Idea } from "@invest4fun/contracts";
import { Check, Plus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getFeed, getIdeas } from "../services/api";

type BasketSelection = { id: string; title: string; kind: "asset" | "idea" };

export function FeedScreen() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selected, setSelected] = useState<BasketSelection[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getFeed(controller.signal), getIdeas(controller.signal)])
      .then(([feedResponse, ideasResponse]) => {
        setFeed(feedResponse.items);
        setIdeas(ideasResponse.items);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setError(true);
      });
    return () => controller.abort();
  }, []);

  const toggle = (selection: BasketSelection) => {
    setSelected((current) =>
      current.some((item) => item.id === selection.id)
        ? current.filter((item) => item.id !== selection.id)
        : [...current, selection],
    );
  };
  const selectedIds = useMemo(
    () => new Set(selected.map((item) => item.id)),
    [selected],
  );

  return (
    <div className="screen feed-screen">
      <div className="screen-heading">
        <p className="eyebrow">Investment workspace</p>
        <h1>Build your next investment</h1>
        <p>
          Explore individual assets in Feed or choose a prepared Idea. Your
          selections stay in a draft basket until you review and confirm.
        </p>
      </div>
      {error ? (
        <div className="inline-alert" role="alert">
          The catalog is temporarily unavailable. Check that the API is running.
        </div>
      ) : null}

      <CatalogSection
        label="Individual assets"
        title="Feed"
        count={`${selected.length} selected`}
      >
        {feed.map((item) => (
          <AssetCard
            key={item.id}
            item={item}
            selected={selectedIds.has(item.id)}
            onToggle={() =>
              toggle({ id: item.id, title: item.name, kind: "asset" })
            }
          />
        ))}
      </CatalogSection>

      <CatalogSection label="Prepared bundles" title="Ideas">
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            selected={selectedIds.has(idea.id)}
            onToggle={() =>
              toggle({ id: idea.id, title: idea.title, kind: "idea" })
            }
          />
        ))}
      </CatalogSection>

      <aside className="basket-dock" aria-live="polite">
        <div>
          <span className="section-label">Draft basket</span>
          <strong>
            {selected.length
              ? `${selected.length} selections ready`
              : "Nothing selected yet"}
          </strong>
        </div>
        <button
          type="button"
          className="primary-button"
          disabled={!selected.length}
        >
          Review basket <Check aria-hidden="true" />
        </button>
      </aside>
    </div>
  );
}

function CatalogSection({
  label,
  title,
  count,
  children,
}: {
  label: string;
  title: string;
  count?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="catalog-section"
      aria-labelledby={`${title.toLowerCase()}-title`}
    >
      <div className="section-heading-row">
        <div>
          <span className="section-label">{label}</span>
          <h2 id={`${title.toLowerCase()}-title`}>{title}</h2>
        </div>
        {count ? <span className="selection-count">{count}</span> : null}
      </div>
      <div className="catalog-grid">{children}</div>
    </section>
  );
}

function AssetCard({
  item,
  selected,
  onToggle,
}: {
  item: FeedItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="catalog-card">
      <div className="card-topline">
        <span className="asset-symbol">{item.symbol}</span>
        <span className={`risk-label ${item.riskLabel}`}>
          {item.riskLabel} risk
        </span>
      </div>
      <h3>{item.name}</h3>
      <p>{item.rationale}</p>
      <span className="source-note">Source: {item.sourceLabel}</span>
      <SelectButton
        selected={selected}
        label={selected ? "Added" : "Add to basket"}
        onClick={onToggle}
      />
    </article>
  );
}

function IdeaCard({
  idea,
  selected,
  onToggle,
}: {
  idea: Idea;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="catalog-card idea-card">
      <div className="card-topline">
        <Sparkles aria-hidden="true" />
        <span className={`risk-label ${idea.riskLabel}`}>
          {idea.riskLabel} risk
        </span>
      </div>
      <h3>{idea.title}</h3>
      <p>{idea.description}</p>
      <span className="source-note">
        {idea.positions.map((position) => position.symbol).join(" + ")}
      </span>
      <SelectButton
        selected={selected}
        label={selected ? "Added" : "Add idea"}
        onClick={onToggle}
      />
    </article>
  );
}

function SelectButton({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={selected ? "select-button selected" : "select-button"}
      onClick={onClick}
    >
      {selected ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
      {label}
    </button>
  );
}
