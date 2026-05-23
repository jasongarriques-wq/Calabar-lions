export type SbaTrack = "csec" | "cape";

export type SbaSubject = {
  code: string;
  name: string;
  track: SbaTrack;
  category: "Sciences" | "Business" | "Technology" | "Technical & Vocational" | "Humanities" | "Languages";
  sbaType: string;
  template?: string;
};

const labReport = `<h2>1. Aim</h2><p>State the purpose of the investigation.</p><h2>2. Hypothesis</h2><p>Predict what you expect and why.</p><h2>3. Apparatus &amp; Materials</h2><ul><li></li></ul><h2>4. Method</h2><ol><li></li></ol><h2>5. Results</h2><p>Record raw data in your linked sheet. Place key tables and charts here.</p><h2>6. Discussion</h2><p>Explain the trends. Reference theory. Address sources of error.</p><h2>7. Conclusion</h2><p>Direct answer to the aim.</p><h2>8. References</h2><ul><li></li></ul>`;

const researchEssay = `<h2>1. Title</h2><p></p><h2>2. Statement of the Problem</h2><p></p><h2>3. Aims of the Study</h2><ul><li></li></ul><h2>4. Literature Review</h2><p></p><h2>5. Methodology</h2><p></p><h2>6. Presentation &amp; Analysis of Findings</h2><p></p><h2>7. Discussion</h2><p></p><h2>8. Recommendations</h2><p></p><h2>9. Limitations</h2><p></p><h2>10. References</h2><ul><li></li></ul>`;

const businessProject = `<h2>1. Description of the Business</h2><p></p><h2>2. Justification of Location</h2><p></p><h2>3. Selection of Appropriate Labour</h2><p></p><h2>4. Sources of Capital</h2><p></p><h2>5. Role of the Entrepreneur</h2><p></p><h2>6. Type of Production</h2><p></p><h2>7. Levels of Production</h2><p></p><h2>8. Quality Control</h2><p></p><h2>9. Use of Technology</h2><p></p><h2>10. Potential for Growth</h2><p></p>`;

const codingProject = `<h2>1. Problem Definition</h2><p></p><h2>2. Stakeholders &amp; Requirements</h2><ul><li></li></ul><h2>3. Design</h2><p>Algorithms, diagrams, data structures.</p><h2>4. Implementation</h2><p>Describe modules; paste critical code snippets.</p><h2>5. Testing</h2><p>Test plan and results.</p><h2>6. Documentation</h2><p>User guide / setup.</p><h2>7. Limitations &amp; Future Work</h2><p></p>`;

const portfolio = `<h2>1. Theme &amp; Concept</h2><p></p><h2>2. Inspiration &amp; Research</h2><p></p><h2>3. Development Pieces</h2><p>Describe each draft / iteration.</p><h2>4. Final Piece(s)</h2><p></p><h2>5. Critical Reflection</h2><p></p>`;

const fieldStudy = `<h2>1. Title &amp; Hypothesis</h2><p></p><h2>2. Location of the Study Area</h2><p>Map &amp; sketches.</p><h2>3. Methodology</h2><p>Sampling, instruments, procedure.</p><h2>4. Presentation of Data</h2><p>Tables and charts from the linked sheet.</p><h2>5. Analysis</h2><p></p><h2>6. Conclusion</h2><p></p><h2>7. References</h2><ul><li></li></ul>`;

const englishSba = `<h2>1. Theme</h2><p></p><h2>2. Plan of Investigation</h2><p></p><h2>3. Reflections (3 pieces)</h2><p></p><h2>4. Written Report</h2><p></p><h2>5. Oral Presentation Notes</h2><p></p><h2>6. Bibliography</h2><ul><li></li></ul>`;

const oralAssessment = `<h2>1. Theme / Topic</h2><p></p><h2>2. Preparation Notes</h2><p>Key vocabulary, structure, anticipated questions.</p><h2>3. Practice Log</h2><p>Date / partner / feedback.</p>`;

const accountingProject = `<h2>1. Description of the Business</h2><p></p><h2>2. Source Documents</h2><p></p><h2>3. Books of Original Entry</h2><p>Use the linked sheet.</p><h2>4. Ledger Accounts</h2><p>Use the linked sheet.</p><h2>5. Trial Balance</h2><p>Use the linked sheet.</p><h2>6. Financial Statements</h2><p>Trading, Profit &amp; Loss, Balance Sheet.</p><h2>7. Analysis &amp; Interpretation</h2><p></p>`;

const cariStudies = `<h2>1. Statement of the Problem</h2><p></p><h2>2. Purpose of the Research</h2><p></p><h2>3. Literature Review</h2><p></p><h2>4. Data Collection Sources</h2><p></p><h2>5. Presentation of Findings</h2><p></p><h2>6. Discussion &amp; Analysis</h2><p></p><h2>7. Conclusion</h2><p></p><h2>8. Bibliography</h2><ul><li></li></ul>`;

export const SBA_SUBJECTS: SbaSubject[] = [
  { code: "BIO", name: "Biology", track: "csec", category: "Sciences", sbaType: "Lab investigations", template: labReport },
  { code: "CHEM", name: "Chemistry", track: "csec", category: "Sciences", sbaType: "Experiments / lab reports", template: labReport },
  { code: "PHY", name: "Physics", track: "csec", category: "Sciences", sbaType: "Experimental investigations", template: labReport },
  { code: "ISCI", name: "Integrated Science", track: "csec", category: "Sciences", sbaType: "Scientific projects", template: labReport },
  { code: "POB", name: "Principles of Business", track: "csec", category: "Business", sbaType: "Business research project", template: businessProject },
  { code: "POA", name: "Principles of Accounts", track: "csec", category: "Business", sbaType: "Accounting project", template: accountingProject },
  { code: "ECON", name: "Economics", track: "csec", category: "Business", sbaType: "Research analysis", template: researchEssay },
  { code: "IT", name: "Information Technology", track: "csec", category: "Technology", sbaType: "Programming / database project", template: codingProject },
  { code: "CS", name: "Computer Science", track: "csec", category: "Technology", sbaType: "Coding / programming project", template: codingProject },
  { code: "GEO", name: "Geography", track: "csec", category: "Humanities", sbaType: "Field study / project", template: fieldStudy },
  { code: "HIST", name: "History", track: "csec", category: "Humanities", sbaType: "Research assignment", template: researchEssay },
  { code: "SOC", name: "Social Studies", track: "csec", category: "Humanities", sbaType: "Community research", template: researchEssay },
  { code: "ENG-A", name: "English A", track: "csec", category: "Languages", sbaType: "SBA / oral components", template: englishSba },
  { code: "ENG-B", name: "English B", track: "csec", category: "Languages", sbaType: "SBA / oral / project", template: englishSba },
  { code: "SPAN", name: "Spanish", track: "csec", category: "Languages", sbaType: "Oral assessment", template: oralAssessment },
  { code: "FREN", name: "French", track: "csec", category: "Languages", sbaType: "Oral assessment", template: oralAssessment },
  { code: "VA", name: "Visual Arts", track: "csec", category: "Technical & Vocational", sbaType: "Art portfolio", template: portfolio },
  { code: "TA", name: "Theatre Arts", track: "csec", category: "Technical & Vocational", sbaType: "Performance / project", template: portfolio },
  { code: "FN", name: "Food & Nutrition", track: "csec", category: "Technical & Vocational", sbaType: "Food preparation project", template: portfolio },
  { code: "TD", name: "Technical Drawing", track: "csec", category: "Technical & Vocational", sbaType: "Drafting / design portfolio", template: portfolio },
  { code: "CAPE-BIO", name: "CAPE Biology", track: "cape", category: "Sciences", sbaType: "Lab investigations + research", template: labReport },
  { code: "CAPE-CHEM", name: "CAPE Chemistry", track: "cape", category: "Sciences", sbaType: "Lab investigations + research", template: labReport },
  { code: "CAPE-PHY", name: "CAPE Physics", track: "cape", category: "Sciences", sbaType: "Lab investigations + research", template: labReport },
  { code: "CAPE-MOB", name: "CAPE Management of Business", track: "cape", category: "Business", sbaType: "Business research", template: businessProject },
  { code: "CAPE-ACC", name: "CAPE Accounting", track: "cape", category: "Business", sbaType: "Accounting project", template: accountingProject },
  { code: "CAPE-CS", name: "CAPE Computer Science", track: "cape", category: "Technology", sbaType: "Computing project", template: codingProject },
  { code: "CARIB", name: "CAPE Caribbean Studies", track: "cape", category: "Humanities", sbaType: "Research paper", template: cariStudies },
  { code: "COMS", name: "CAPE Communication Studies", track: "cape", category: "Humanities", sbaType: "Communication SBA", template: cariStudies },
];

export const SBA_SUBJECTS_BY_CODE = Object.fromEntries(SBA_SUBJECTS.map((s) => [s.code, s]));

export const SBA_CATEGORIES: Array<{ category: SbaSubject["category"]; subjects: SbaSubject[] }> = [
  "Sciences", "Business", "Technology", "Technical & Vocational", "Humanities", "Languages",
].map((c) => ({
  category: c as SbaSubject["category"],
  subjects: SBA_SUBJECTS.filter((s) => s.category === c),
}));
