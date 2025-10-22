import {
  ContentPage,
  LensFacetGroup,
  LensFacetKey,
  LensFilterState,
  MegaNavGroup,
  MegaNavItem,
  MegaNavPreview,
  MegaNavSection
} from "../types";

type SectionConfig = {
  id: MegaNavSection["id"];
  label: MegaNavSection["label"];
  description?: string;
  icon?: string;
};

const SECTION_CONFIG: SectionConfig[] = [
  { id: "build", label: "Build & Deploy", description: "CI, previews, change planning" },
  { id: "secure", label: "Security & Identity", description: "Threats, policies, incident drills" },
  { id: "workspace", label: "Workspace", description: "Editor, snippets, project setup" },
  { id: "network", label: "Network & Traffic", description: "Ingress, telemetry, edge posture" },
  { id: "intel", label: "Intel & Atlas", description: "Maps, saved sets, research dossiers" }
];

const CONTENT_PAGES: ContentPage[] = [
  {
    id: "ci-resilience",
    slug: "/build/ci-resilience",
    title: "CI Resilience Playbook",
    section: "build",
    subSection: "Delivery",
    audience: ["developers", "platform"],
    topic: ["ci", "reliability"],
    format: "guide",
    readMinutes: 9,
    updatedAt: "2025-09-01T10:00:00.000Z",
    popularityScore: 0.86
  },
  {
    id: "release-trails",
    slug: "/build/release-trails",
    title: "Trailboard Template: Release in 6 Steps",
    section: "build",
    subSection: "Journeys",
    audience: ["developers", "managers"],
    topic: ["trailboard", "releases"],
    format: "template",
    readMinutes: 6,
    updatedAt: "2025-07-14T15:00:00.000Z",
    popularityScore: 0.78
  },
  {
    id: "mega-lens-beta",
    slug: "/build/mega-lens-beta",
    title: "Mega-Lens Beta Rollout Checklist",
    section: "build",
    subSection: "Experiments",
    audience: ["developers", "designers"],
    topic: ["navigation", "rollout"],
    format: "checklist",
    readMinutes: 8,
    updatedAt: "2025-09-22T09:45:00.000Z",
    popularityScore: 0.82
  },
  {
    id: "facet-prism-api",
    slug: "/build/facet-prism-api",
    title: "Facet Prism API Contract",
    section: "build",
    subSection: "Contracts",
    audience: ["developers"],
    topic: ["facets", "api"],
    format: "reference",
    readMinutes: 12,
    updatedAt: "2025-08-18T13:20:00.000Z",
    popularityScore: 0.74
  },
  {
    id: "security-runbook",
    slug: "/security/runbooks/identity-hardening",
    title: "Identity Hardening Runbook",
    section: "secure",
    subSection: "Runbooks",
    audience: ["security", "platform"],
    topic: ["identity", "hardening"],
    format: "runbook",
    readMinutes: 11,
    updatedAt: "2025-08-28T12:00:00.000Z",
    popularityScore: 0.88
  },
  {
    id: "vpn-policies",
    slug: "/security/policies/vpn",
    title: "Zero Trust VPN Policies",
    section: "secure",
    subSection: "Policies",
    audience: ["security", "managers"],
    topic: ["vpn", "zero-trust"],
    format: "policy",
    readMinutes: 7,
    updatedAt: "2025-05-05T08:30:00.000Z",
    popularityScore: 0.6
  },
  {
    id: "startup-audit",
    slug: "/security/audits/startup-services",
    title: "Startup Services Audit Trail",
    section: "secure",
    subSection: "Audits",
    audience: ["security", "operations"],
    topic: ["audits"],
    format: "report",
    readMinutes: 5,
    updatedAt: "2025-09-30T19:40:00.000Z",
    popularityScore: 0.81
  },
  {
    id: "workspace-shortcuts",
    slug: "/workspace/productivity/shortcuts",
    title: "Editor Shortcut Atlas",
    section: "workspace",
    subSection: "Productivity",
    audience: ["developers", "designers"],
    topic: ["workspace", "shortcuts"],
    format: "cheatsheet",
    readMinutes: 4,
    updatedAt: "2025-06-21T15:15:00.000Z",
    popularityScore: 0.65
  },
  {
    id: "workspace-trails",
    slug: "/workspace/trails/onboarding",
    title: "Trailboard: Onboard to the Stack",
    section: "workspace",
    subSection: "Journeys",
    audience: ["developers", "managers"],
    topic: ["trailboard", "onboarding"],
    format: "template",
    readMinutes: 10,
    updatedAt: "2025-07-03T09:00:00.000Z",
    popularityScore: 0.69
  },
  {
    id: "network-heatmap",
    slug: "/network/observability/heatmap",
    title: "Ingress Latency Heatmap",
    section: "network",
    subSection: "Observability",
    audience: ["operations", "platform"],
    topic: ["latency", "observability"],
    format: "dashboard",
    readMinutes: 6,
    updatedAt: "2025-09-12T16:05:00.000Z",
    popularityScore: 0.83
  },
  {
    id: "network-runbook",
    slug: "/network/runbooks/cache-breach",
    title: "Edge Cache Breach Drill",
    section: "network",
    subSection: "Runbooks",
    audience: ["operations", "security"],
    topic: ["incident-response"],
    format: "runbook",
    readMinutes: 14,
    updatedAt: "2025-08-02T12:50:00.000Z",
    popularityScore: 0.7
  },
  {
    id: "surface-dashboard",
    slug: "#/",
    title: "Operations Command Dashboard",
    section: "intel",
    subSection: "App surfaces",
    audience: ["developers", "operations"],
    topic: ["navigation", "observability"],
    format: "dashboard",
    readMinutes: 2,
    updatedAt: "2025-09-18T12:00:00.000Z",
    popularityScore: 0.92
  },
  {
    id: "surface-preview",
    slug: "#/preview",
    title: "Live Preview Surface",
    section: "workspace",
    subSection: "App surfaces",
    audience: ["developers", "designers"],
    topic: ["workspace", "navigation"],
    format: "dashboard",
    readMinutes: 2,
    updatedAt: "2025-09-19T12:30:00.000Z",
    popularityScore: 0.87
  },
  {
    id: "surface-editor",
    slug: "#/editor",
    title: "Editor Status Surface",
    section: "workspace",
    subSection: "App surfaces",
    audience: ["developers"],
    topic: ["workspace", "trailboard"],
    format: "dashboard",
    readMinutes: 2,
    updatedAt: "2025-09-16T11:10:00.000Z",
    popularityScore: 0.8
  },
  {
    id: "surface-ci",
    slug: "#/ci",
    title: "CI/CD Monitor Surface",
    section: "build",
    subSection: "App surfaces",
    audience: ["developers", "platform"],
    topic: ["ci", "reliability"],
    format: "dashboard",
    readMinutes: 2,
    updatedAt: "2025-09-20T09:45:00.000Z",
    popularityScore: 0.88
  },
  {
    id: "surface-security",
    slug: "#/security",
    title: "Security Console Surface",
    section: "secure",
    subSection: "App surfaces",
    audience: ["security", "operations"],
    topic: ["hardening", "audits"],
    format: "dashboard",
    readMinutes: 2,
    updatedAt: "2025-09-21T14:25:00.000Z",
    popularityScore: 0.85
  },
  {
    id: "surface-system",
    slug: "#/system",
    title: "System Health Surface",
    section: "network",
    subSection: "App surfaces",
    audience: ["operations", "platform"],
    topic: ["observability", "reliability"],
    format: "dashboard",
    readMinutes: 2,
    updatedAt: "2025-09-17T08:35:00.000Z",
    popularityScore: 0.83
  },
  {
    id: "surface-network",
    slug: "#/network",
    title: "Network Flow Surface",
    section: "network",
    subSection: "App surfaces",
    audience: ["operations", "security"],
    topic: ["latency", "incident-response"],
    format: "dashboard",
    readMinutes: 2,
    updatedAt: "2025-09-15T10:55:00.000Z",
    popularityScore: 0.82
  },
  {
    id: "surface-inbox",
    slug: "#/inbox",
    title: "Signal Inbox Surface",
    section: "intel",
    subSection: "App surfaces",
    audience: ["managers", "product"],
    topic: ["navigation", "saved-sets"],
    format: "dashboard",
    readMinutes: 2,
    updatedAt: "2025-09-11T07:50:00.000Z",
    popularityScore: 0.79
  },
  {
    id: "atlas-mapping",
    slug: "/intel/atlas/mapping",
    title: "Facet Atlas Mapping Overview",
    section: "intel",
    subSection: "Atlas",
    audience: ["developers", "designers"],
    topic: ["atlas", "facets"],
    format: "guide",
    readMinutes: 9,
    updatedAt: "2025-09-25T11:35:00.000Z",
    popularityScore: 0.9
  },
  {
    id: "saved-sets-library",
    slug: "/intel/facet-prism/library",
    title: "Saved Sets Library",
    section: "intel",
    subSection: "Facet Prism",
    audience: ["developers", "product"],
    topic: ["facets", "saved-sets"],
    format: "library",
    readMinutes: 5,
    updatedAt: "2025-08-29T07:10:00.000Z",
    popularityScore: 0.77
  },
  {
    id: "atlas-tour",
    slug: "/intel/atlas/tour",
    title: "Atlas Orientation Trail",
    section: "intel",
    subSection: "Journeys",
    audience: ["product", "designers"],
    topic: ["atlas", "trailboard"],
    format: "template",
    readMinutes: 12,
    updatedAt: "2025-10-01T17:25:00.000Z",
    popularityScore: 0.84
  }
];

const FACET_DEFINITIONS: LensFacetGroup[] = [
  {
    key: "audience",
    title: "Audience",
    type: "multi",
    helpText: "Choose who the material is written for.",
    liveRegionLabel: "Audience facet updates.",
    options: [
      { value: "developers", label: "Developers", count: 0 },
      { value: "designers", label: "Designers", count: 0 },
      { value: "platform", label: "Platform", count: 0 },
      { value: "operations", label: "Operations", count: 0 },
      { value: "security", label: "Security", count: 0 },
      { value: "managers", label: "Managers", count: 0 },
      { value: "product", label: "Product", count: 0 }
    ]
  },
  {
    key: "topic",
    title: "Topic",
    type: "multi",
    helpText: "Filter by focus area or capability.",
    liveRegionLabel: "Topic facet updates.",
    options: [
      { value: "ci", label: "CI/CD", count: 0 },
      { value: "reliability", label: "Reliability", count: 0 },
      { value: "trailboard", label: "Trailboard", count: 0 },
      { value: "navigation", label: "Navigation", count: 0 },
      { value: "api", label: "APIs", count: 0 },
      { value: "identity", label: "Identity", count: 0 },
      { value: "hardening", label: "Hardening", count: 0 },
      { value: "audits", label: "Audits", count: 0 },
      { value: "workspace", label: "Workspace", count: 0 },
      { value: "shortcuts", label: "Shortcuts", count: 0 },
      { value: "latency", label: "Latency", count: 0 },
      { value: "observability", label: "Observability", count: 0 },
      { value: "atlas", label: "Atlas", count: 0 },
      { value: "saved-sets", label: "Saved sets", count: 0 },
      { value: "incident-response", label: "Incident response", count: 0 },
      { value: "rollout", label: "Rollout", count: 0 }
    ]
  },
  {
    key: "format",
    title: "Format",
    type: "multi",
    helpText: "Pick how deep you want to go.",
    liveRegionLabel: "Format facet updates.",
    options: [
      { value: "guide", label: "Guides", count: 0 },
      { value: "template", label: "Templates", count: 0 },
      { value: "checklist", label: "Checklists", count: 0 },
      { value: "reference", label: "References", count: 0 },
      { value: "runbook", label: "Runbooks", count: 0 },
      { value: "policy", label: "Policies", count: 0 },
      { value: "cheatsheet", label: "Cheat sheets", count: 0 },
      { value: "dashboard", label: "Dashboards", count: 0 },
      { value: "library", label: "Libraries", count: 0 }
    ]
  },
  {
    key: "readTime",
    title: "Read Time",
    type: "single",
    helpText: "Approximate time to finish.",
    liveRegionLabel: "Read time facet updates.",
    options: [
      { value: "0-5", label: "0 to 5 min", count: 0 },
      { value: "5-10", label: "5 to 10 min", count: 0 },
      { value: "10-15", label: "10 to 15 min", count: 0 },
      { value: "15+", label: "15+ min", count: 0 }
    ]
  },
  {
    key: "updatedAt",
    title: "Updated",
    type: "single",
    helpText: "How fresh the material is.",
    liveRegionLabel: "Updated facet updates.",
    options: [
      { value: "7d", label: "Last 7 days", count: 0 },
      { value: "30d", label: "Last 30 days", count: 0 },
      { value: "90d", label: "Last 90 days", count: 0 },
      { value: "180d", label: "Last 180 days", count: 0 },
      { value: "archive", label: "Older than 180 days", count: 0 }
    ]
  }
];

export class NavigationService {
  private pages = CONTENT_PAGES;

  getSections(filters: LensFilterState = {}): MegaNavSection[] {
    const filteredPages = this.applyFilters(this.pages, filters);
    return SECTION_CONFIG.map((section) => {
      const pagesForSection = filteredPages.filter((page) => page.section === section.id);
      const groups = this.buildGroups(section.id, pagesForSection, filters);
      const preview = this.buildPreview(pagesForSection);
      return {
        id: section.id,
        label: section.label,
        description: section.description,
        icon: section.icon,
        totalItems: pagesForSection.length,
        groups,
        preview
      };
    });
  }

  getFacetGroups(filters: LensFilterState = {}): LensFacetGroup[] {
    return FACET_DEFINITIONS.map((facetGroup) => ({
      ...facetGroup,
      options: facetGroup.options.map((option) => {
        const count = this.countForFacet(facetGroup.key, option.value, filters);
        const isActive = Boolean(filters[facetGroup.key]?.includes(option.value));
        return { ...option, count, isActive };
      })
    }));
  }

  getFilteredPages(filters: LensFilterState = {}): ContentPage[] {
    return this.applyFilters(this.pages, filters);
  }

  private buildGroups(sectionId: string, pages: ContentPage[], filters: LensFilterState): MegaNavGroup[] {
    if (pages.length === 0) {
      return [];
    }

    const grouped = new Map<string, ContentPage[]>();
    pages.forEach((page) => {
      const key = page.subSection ?? "Highlights";
      const bucket = grouped.get(key) ?? [];
      bucket.push(page);
      grouped.set(key, bucket);
    });

    const sortedGroups = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return sortedGroups.map(([title, groupPages]) => ({
      id: `${sectionId}-${this.slugify(title)}`,
      title,
      items: this.toNavItems(groupPages)
    }));
  }

  private buildPreview(pages: ContentPage[]): MegaNavPreview {
    if (pages.length === 0) {
      return {
        heading: "No matches yet",
        summary: "Try a different section or relax a filter.",
        items: []
      };
    }

    const sorted = [...pages].sort((a, b) => {
      if (b.popularityScore === a.popularityScore) {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return b.popularityScore - a.popularityScore;
    });
    const top = sorted.slice(0, 3);

    return {
      heading: "Top picks",
      summary: `Showing ${top.length} of ${pages.length} items for this section.`,
      items: top.map((page) => ({
        id: page.id,
        label: page.title,
        href: page.slug,
        meta: `${page.readMinutes} min | Updated ${this.formatUpdatedDistance(page.updatedAt)}`
      }))
    };
  }

  private toNavItems(pages: ContentPage[]): MegaNavItem[] {
    const sorted = [...pages].sort((a, b) => b.popularityScore - a.popularityScore);
    return sorted.map((page) => ({
      id: page.id,
      label: page.title,
      description: this.summarize(page),
      href: page.slug,
      format: page.format,
      audience: page.audience,
      updatedAt: page.updatedAt,
      readMinutes: page.readMinutes,
      badges: this.buildBadges(page)
    }));
  }

  private summarize(page: ContentPage): string | undefined {
    if (page.topic.includes("trailboard")) {
      return "Trail ready blueprint with progress tracking.";
    }
    if (page.topic.includes("atlas")) {
      return "Atlas overlays and navigation guidance.";
    }
    if (page.format === "runbook") {
      return "Step-by-step drill to follow under pressure.";
    }
    if (page.format === "policy") {
      return "Policy baseline with enforcement notes.";
    }
    if (page.format === "dashboard") {
      return "Live telemetry snapshot and tuning levers.";
    }
    return undefined;
  }

  private buildBadges(page: ContentPage) {
    const badges: MegaNavItem["badges"] = [];
    if (page.popularityScore > 0.82) {
      badges.push({ tone: "info", label: "Trending" });
    }
    if (this.isFresh(page.updatedAt, 14)) {
      badges.push({ tone: "neutral", label: "New" });
    }
    if (page.format === "runbook") {
      badges.push({ tone: "warn", label: "Drill" });
    }
    return badges;
  }

  private countForFacet(key: LensFacetKey, value: string, filters: LensFilterState) {
    const nextFilters: LensFilterState = {};
    Object.entries(filters).forEach(([facetKey, facetValues]) => {
      nextFilters[facetKey as LensFacetKey] = [...(facetValues ?? [])];
    });

    const currentValues = new Set(nextFilters[key] ?? []);
    if (FACET_DEFINITIONS.find((facet) => facet.key === key)?.type === "single") {
      nextFilters[key] = [value];
    } else {
      currentValues.add(value);
      nextFilters[key] = Array.from(currentValues);
    }

    return this.applyFilters(this.pages, nextFilters).length;
  }

  private applyFilters(pages: ContentPage[], filters: LensFilterState) {
    return pages.filter((page) => {
      if (!this.matchesAudience(page, filters.audience)) return false;
      if (!this.matchesTopics(page, filters.topic)) return false;
      if (!this.matchesFormats(page, filters.format)) return false;
      if (!this.matchesReadTime(page, filters.readTime)) return false;
      if (!this.matchesUpdated(page, filters.updatedAt)) return false;
      return true;
    });
  }

  private matchesAudience(page: ContentPage, filterValues?: string[]) {
    if (!filterValues || filterValues.length === 0) return true;
    return filterValues.some((audience) => page.audience.includes(audience));
  }

  private matchesTopics(page: ContentPage, filterValues?: string[]) {
    if (!filterValues || filterValues.length === 0) return true;
    return filterValues.some((topic) => page.topic.includes(topic));
  }

  private matchesFormats(page: ContentPage, filterValues?: string[]) {
    if (!filterValues || filterValues.length === 0) return true;
    return filterValues.includes(page.format);
  }

  private matchesReadTime(page: ContentPage, filterValues?: string[]) {
    if (!filterValues || filterValues.length === 0) return true;
    const minutes = page.readMinutes;
    return filterValues.some((value) => {
      switch (value) {
        case "0-5":
          return minutes <= 5;
        case "5-10":
          return minutes > 5 && minutes <= 10;
        case "10-15":
          return minutes > 10 && minutes <= 15;
        case "15+":
          return minutes > 15;
        default:
          return true;
      }
    });
  }

  private matchesUpdated(page: ContentPage, filterValues?: string[]) {
    if (!filterValues || filterValues.length === 0) return true;
    const daysAgo = this.getDaysAgo(page.updatedAt);
    return filterValues.some((value) => {
      switch (value) {
        case "7d":
          return daysAgo <= 7;
        case "30d":
          return daysAgo <= 30;
        case "90d":
          return daysAgo <= 90;
        case "180d":
          return daysAgo <= 180;
        case "archive":
          return daysAgo > 180;
        default:
          return true;
      }
    });
  }

  private isFresh(date: string, maxDays: number) {
    return this.getDaysAgo(date) <= maxDays;
  }

  private getDaysAgo(date: string) {
    const now = Date.now();
    const then = new Date(date).getTime();
    return Math.floor((now - then) / (1000 * 60 * 60 * 24));
  }

  private formatUpdatedDistance(date: string) {
    const days = this.getDaysAgo(date);
    if (days <= 1) return "today";
    if (days < 30) return `${days} d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} mo ago`;
    const years = Math.floor(months / 12);
    return `${years} yr ago`;
  }

  private slugify(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
}

export const navigationService = new NavigationService();
