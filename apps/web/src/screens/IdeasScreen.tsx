import type { Idea } from "@invest4fun/contracts";
import { BaggageClaim, Check, Lightbulb, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getIdeas } from "../services/api";

export function IdeasScreen() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getIdeas(controller.signal)
      .then((response) => setIdeas(response.items))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setError(true);
      });
    return () => controller.abort();
  }, []);

  const selectedIds = useMemo(() => new Set(selected), [selected]);

  return (
    <main className="legacy-page ideas-page">
      <section className="ideas-workspace">
        <header className="page-heading">
          <span className="eyebrow">Prepared compositions</span>
          <h1>Investment ideas</h1>
          <p>Choose a prepared idea to add its allocation to your basket.</p>
        </header>

        {error ? (
          <div className="inline-alert" role="alert">
            Ideas are temporarily unavailable. Check that the API is running.
          </div>
        ) : null}

        <div className="ideas-grid">
          {ideas.map((idea) => {
            const isSelected = selectedIds.has(idea.id);
            return (
              <article className="legacy-idea-card" key={idea.id}>
                <div className="legacy-idea-icon" aria-hidden="true">
                  <Lightbulb />
                </div>
                <div className="legacy-idea-copy">
                  <div className="legacy-card-meta">
                    <span>{idea.riskLabel} risk</span>
                    <span>{idea.positions.length} assets</span>
                  </div>
                  <h2>{idea.title}</h2>
                  <p>{idea.description}</p>
                  <div className="idea-position-list">
                    {idea.positions.map((position) => (
                      <span key={position.symbol}>{position.symbol}</span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className={
                    isSelected ? "legacy-action selected" : "legacy-action"
                  }
                  onClick={() =>
                    setSelected((current) =>
                      isSelected
                        ? current.filter((id) => id !== idea.id)
                        : [...current, idea.id],
                    )
                  }
                >
                  {isSelected ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <Plus aria-hidden="true" />
                  )}
                  {isSelected ? "Added" : "Add idea"}
                </button>
              </article>
            );
          })}
        </div>

        <div className="legacy-basket-bar">
          <div>
            <span>Basket</span>
            <strong>
              {selected.length
                ? `${selected.length} ideas selected`
                : "Your basket is empty"}
            </strong>
          </div>
          <button
            type="button"
            className="legacy-primary-button"
            disabled={!selected.length}
          >
            Review basket <BaggageClaim aria-hidden="true" />
          </button>
        </div>
      </section>
    </main>
  );
}
