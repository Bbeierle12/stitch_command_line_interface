import {
  ForwardedRef,
  KeyboardEvent as ReactKeyboardEvent,
  MutableRefObject,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { LensFacetGroup, LensFacetKey, LensFilterState, MegaNavSection } from "../types";
import { navigationService } from "../services/navigationService";

type MegaLensProps = {
  onNavigate?: (href: string) => boolean | void;
};

type TriggerRegistry = MutableRefObject<Record<string, HTMLButtonElement | null>>;

export function MegaLens({ onNavigate }: MegaLensProps) {
  const [filters, setFilters] = useState<LensFilterState>({});
  const [isOpen, setIsOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>(() => {
    const initialSection = navigationService.getSections()[0];
    return initialSection ? initialSection.id : "";
  });
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const triggersRef: TriggerRegistry = useRef({});
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstFacetRef = useRef<HTMLInputElement | null>(null);
  const lastTriggerIdRef = useRef<string | null>(null);
  const wasOpenRef = useRef(false);

  const sections = useMemo(() => navigationService.getSections(filters), [filters]);
  const facets = useMemo(() => navigationService.getFacetGroups(filters), [filters]);
  const totalMatches = useMemo(() => navigationService.getFilteredPages(filters).length, [filters]);

  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0] ?? null;

  useEffect(() => {
    if (isOpen && firstFacetRef.current) {
      firstFacetRef.current.focus();
    }
  }, [isOpen, activeSectionId, facets]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyClose = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
      }
    };

    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      const clickedTrigger = Object.values(triggersRef.current).some((button) =>
        button?.contains(target as Node)
      );
      if (clickedTrigger) return;
      closePanel();
    };

    document.addEventListener("keydown", handleKeyClose);
    document.addEventListener("mousedown", handleClickAway);
    return () => {
      document.removeEventListener("keydown", handleKeyClose);
      document.removeEventListener("mousedown", handleClickAway);
    };
  }, [isOpen]);

  useEffect(() => {
    if (wasOpenRef.current && !isOpen && lastTriggerIdRef.current) {
      const triggerToFocus = triggersRef.current[lastTriggerIdRef.current];
      triggerToFocus?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const openPanel = useCallback(
    (sectionId: string) => {
      setActiveSectionId(sectionId);
      setIsOpen(true);
      lastTriggerIdRef.current = sectionId;
    },
    [setActiveSectionId, setIsOpen]
  );

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const togglePanel = useCallback(
    (sectionId: string) => {
      if (isOpen && activeSectionId === sectionId) {
        closePanel();
      } else {
        openPanel(sectionId);
      }
    },
    [activeSectionId, closePanel, isOpen, openPanel]
  );

  const handleTriggerKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      const ids = sections.map((section) => section.id);
      if (ids.length === 0) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        const nextId = ids[(index + 1) % ids.length];
        triggersRef.current[nextId]?.focus();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const prevIndex = (index - 1 + ids.length) % ids.length;
        const prevId = ids[prevIndex];
        triggersRef.current[prevId]?.focus();
      }

      if (event.key === "Home") {
        event.preventDefault();
        const firstId = ids[0];
        triggersRef.current[firstId]?.focus();
      }

      if (event.key === "End") {
        event.preventDefault();
        const lastId = ids[ids.length - 1];
        triggersRef.current[lastId]?.focus();
      }
    },
    [sections]
  );

  const handleFacetToggle = useCallback(
    (key: LensFacetKey, value: string) => {
      setFilters((current) => {
        const facetDefinition = facets.find((facet) => facet.key === key);
        const facetType = facetDefinition?.type ?? "multi";
        const currentValues = new Set(current[key] ?? []);
        if (currentValues.has(value)) {
          currentValues.delete(value);
        } else {
          if (facetType === "single") {
            currentValues.clear();
          }
          currentValues.add(value);
        }

        const nextFilters: LensFilterState = { ...current, [key]: Array.from(currentValues) };
        if (nextFilters[key]?.length === 0) {
          delete nextFilters[key];
        }

        const nextTotal = navigationService.getFilteredPages(nextFilters).length;
        if (facetDefinition) {
          const optionLabel = facetDefinition.options.find((option) => option.value === value)?.label;
          const announcementLabel = optionLabel ?? value;
          setLiveAnnouncement(
            `${facetDefinition.title} ${announcementLabel} now ${nextTotal} result${nextTotal === 1 ? "" : "s"}.`
          );
        } else {
          setLiveAnnouncement(`Filters updated. ${nextTotal} total results.`);
        }

        return nextFilters;
      });
    },
    [facets]
  );

  const handleReset = useCallback(() => {
    setFilters({});
    setLiveAnnouncement("All filters cleared.");
  }, []);

  const handleNavigate = useCallback(
    (href: string) => {
      const handled = onNavigate?.(href);
      if (handled !== false) {
        closePanel();
      }
      return Boolean(handled);
    },
    [closePanel, onNavigate]
  );

  if (!sections.length || !activeSection) {
    return null;
  }

  return (
    <div className="border-b border-cyan/20 bg-panel" role="navigation" aria-label="Mega-Lens navigation">
      <div className="mx-auto flex items-center gap-2 px-4 py-2">
        {sections.map((section, index) => {
          const isActive = isOpen && activeSectionId === section.id;
          const itemId = `mega-trigger-${section.id}`;
          return (
            <button
              key={section.id}
              ref={(node) => {
                triggersRef.current[section.id] = node;
              }}
              id={itemId}
              type="button"
              aria-expanded={isActive}
              aria-controls="mega-lens-panel"
              className={`rounded-full border px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-cyan ${
                isActive
                  ? "border-cyan/70 bg-cyan/15 text-cyan shadow-glow"
                  : "border-transparent text-white/80 hover:border-cyan/40 hover:text-cyan"
              }`}
              onClick={() => togglePanel(section.id)}
              onKeyDown={(event) => handleTriggerKeyDown(event, index)}
            >
              <span className="font-medium">{section.label}</span>
              <span className="ml-2 text-[11px] uppercase tracking-[0.16em] text-white/50">
                {section.totalItems} items
              </span>
            </button>
          );
        })}
      </div>
      {isOpen && (
        <div
          id="mega-lens-panel"
          ref={panelRef}
          className="relative z-20 mx-auto max-w-[1200px] rounded-md border border-cyan/30 bg-ink/95 px-6 py-6 shadow-depth"
          role="dialog"
          aria-label={`${activeSection.label} mega panel`}
          aria-modal="false"
        >
          <div className="grid grid-cols-12 gap-6">
            <LensRibbon
              ref={firstFacetRef}
              facetGroups={facets}
              filters={filters}
              onToggleFacet={handleFacetToggle}
              onReset={handleReset}
              totalMatches={totalMatches}
              liveAnnouncement={liveAnnouncement}
            />
            <MegaPanelColumn section={activeSection} onNavigate={handleNavigate} />
          </div>
        </div>
      )}
    </div>
  );
}

type LensRibbonProps = {
  facetGroups: LensFacetGroup[];
  filters: LensFilterState;
  onToggleFacet: (key: LensFacetKey, value: string) => void;
  onReset: () => void;
  totalMatches: number;
  liveAnnouncement: string;
};

const LensRibbon = forwardRef<HTMLInputElement, LensRibbonProps>(
  ({ facetGroups, filters, onToggleFacet, onReset, totalMatches, liveAnnouncement }, ref) => {
    const hasFilters = Object.values(filters).some((values) => values && values.length > 0);
    let firstFocusableAssigned = false;

    return (
      <aside className="col-span-5 flex flex-col gap-4 rounded-md border border-cyan/20 bg-panel/60 p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white/80" aria-live="polite">
            {totalMatches} {totalMatches === 1 ? "result" : "results"}
          </span>
          <button
            type="button"
            onClick={onReset}
            className="rounded border border-transparent px-2 py-1 text-white/60 transition hover:border-cyan/50 hover:text-cyan focus:outline-none focus:ring-2 focus:ring-cyan disabled:opacity-50"
            disabled={!hasFilters}
          >
            Clear filters
          </button>
        </div>
        <span className="sr-only" aria-live="polite" role="status">
          {liveAnnouncement}
        </span>
        {facetGroups.map((group) => (
          <fieldset key={group.key} className="flex flex-col gap-2 border-t border-hairline pt-2">
            <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              {group.title}
            </legend>
            {group.helpText && <p className="text-[11px] text-white/45">{group.helpText}</p>}
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const optionId = `lens-${group.key}-${option.value}`;
                const isActive = Boolean(filters[group.key]?.includes(option.value));
                const isDisabled = option.count === 0 && !isActive;
                const shouldAttachRef = !firstFocusableAssigned && !isDisabled;
                if (shouldAttachRef) {
                  firstFocusableAssigned = true;
                }
                return (
                  <label
                    key={option.value}
                    htmlFor={optionId}
                    className={`group flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition focus-within:ring-2 focus-within:ring-cyan ${
                      isActive
                        ? "border-cyan/70 bg-cyan/20 text-cyan"
                        : isDisabled
                        ? "border-transparent text-white/30"
                        : "border-white/10 text-white/70 hover:border-cyan/40 hover:text-cyan"
                    }`}
                  >
                    <input
                      ref={shouldAttachRef ? (ref as ForwardedRef<HTMLInputElement>) : undefined}
                      id={optionId}
                      type="checkbox"
                      className="sr-only"
                      name={group.key}
                      checked={isActive}
                      onChange={() => onToggleFacet(group.key, option.value)}
                      aria-label={`${option.label}, ${option.count} result${option.count === 1 ? "" : "s"}`}
                      disabled={isDisabled}
                    />
                    <span>{option.label}</span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-white/45">
                      {option.count}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </aside>
    );
  }
);

LensRibbon.displayName = "LensRibbon";

type MegaPanelColumnProps = {
  section: MegaNavSection;
  onNavigate: (href: string) => boolean;
};

function MegaPanelColumn({ section, onNavigate }: MegaPanelColumnProps) {
  return (
    <section className="col-span-7 flex flex-col gap-6 overflow-hidden">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-white">{section.label}</h3>
        {section.description && <p className="text-sm text-white/60">{section.description}</p>}
      </header>
      {section.groups.length === 0 ? (
        <p className="rounded-md border border-dashed border-white/20 bg-panel/50 px-4 py-6 text-sm text-white/60">
          Nothing matches yet. Adjust a lens to widen the results.
        </p>
      ) : (
        section.groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/60">
                {group.title}
              </h4>
              <span className="text-xs text-white/45">{group.items.length} items</span>
            </div>
            <ul className="grid grid-cols-1 gap-2">
              {group.items.map((item) => (
                <li key={item.id} className="rounded border border-white/10 bg-panel/70 transition hover:border-cyan/50">
                  <a
                    href={item.href}
                    className="flex flex-col gap-2 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan"
                    onClick={(event) => {
                      const handled = onNavigate(item.href);
                      if (handled) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                      {item.badges && item.badges.length > 0 && (
                        <span className="flex gap-1">
                          {item.badges.map((badge) => (
                            <span
                              key={badge.label}
                              className={`rounded-full px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] ${
                                badge.tone === "warn"
                                  ? "bg-red-500/20 text-red-300"
                                  : badge.tone === "info"
                                  ? "bg-cyan/20 text-cyan"
                                  : "bg-white/10 text-white/70"
                              }`}
                            >
                              {badge.label}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                    {item.description && <p className="text-xs text-white/65">{item.description}</p>}
                    <p className="text-[11px] text-white/45">
                      {formatMeta(item.readMinutes, item.audience, item.updatedAt)}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
      <MegaPreview preview={section.preview} />
    </section>
  );
}

type MegaPreviewProps = {
  preview: MegaNavSection["preview"];
};

function MegaPreview({ preview }: MegaPreviewProps) {
  return (
    <aside className="rounded-md border border-cyan/25 bg-panel/70 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">{preview.heading}</h4>
        {preview.summary && <span className="text-xs text-white/45">{preview.summary}</span>}
      </div>
      {preview.items.length === 0 ? (
        <p className="mt-3 text-sm text-white/60">No highlighted items right now.</p>
      ) : (
        <ul className="mt-3 space-y-2" aria-live="polite">
          {preview.items.map((item) => (
            <li key={item.id} className="rounded border border-white/10 bg-panel/80 px-3 py-2">
              <a href={item.href} className="flex flex-col gap-1 text-white hover:text-cyan">
                <span className="text-sm font-semibold">{item.label}</span>
                {item.meta && <span className="text-[11px] text-white/50">{item.meta}</span>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function formatMeta(readMinutes: number, audience: string[], updatedAt: string) {
  const audienceLabel = audience.length ? `Audience: ${audience.join(", ")}` : null;
  const readLabel = `${readMinutes} min read`;
  const updatedLabel = `Updated ${formatRelativeUpdated(updatedAt)}`;
  return [readLabel, audienceLabel, updatedLabel].filter(Boolean).join(" | ");
}

function formatRelativeUpdated(date: string) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}
