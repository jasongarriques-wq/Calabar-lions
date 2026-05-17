export type LionToolMeta = {
  slug: string;
  name: string;
  type: string;
  description: string;
  features: string[];
};

export const LION_TOOLS: LionToolMeta[] = [
  {
    slug: "docs",
    name: "Lion Docs",
    type: "Essay & Document Editor",
    description: "Write essays, SBA reports, assignments, and collaborative documents.",
    features: ["Live collaboration", "Teacher comments", "Auto-save", "Templates", "Grammar tools"],
  },
  {
    slug: "slides",
    name: "Lion Slides",
    type: "Presentation Builder",
    description: "Create SBA presentations, class presentations, and pitch decks.",
    features: ["Animations", "Group editing", "Presenter mode", "Export PDF", "Media embeds"],
  },
  {
    slug: "sheets",
    name: "Lion Sheets",
    type: "Spreadsheet System",
    description: "Perform calculations, charts, data analysis, and financial work.",
    features: ["Formulas", "Charts", "Attendance tracking", "Budget sheets", "Gradebooks"],
  },
  {
    slug: "notes",
    name: "Lion Notes",
    type: "Digital Notebook",
    description: "Store class notes, diagrams, formulas, and revision materials.",
    features: ["Draw mode", "Subject tabs", "Cloud sync", "Voice notes", "Study folders"],
  },
  {
    slug: "sba",
    name: "SBA Workspace",
    type: "Project hub",
    description:
      "Run a full School-Based Assessment with essay, spreadsheet, slides, and teacher review under one roof.",
    features: ["Version history", "Teacher feedback", "Group editing", "Research folder", "Export bundle"],
  },
];

export function findTool(slug: string) {
  return LION_TOOLS.find((t) => t.slug === slug);
}
