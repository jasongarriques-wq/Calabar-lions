export type SbaTrack = "csec" | "cape";

export type SbaSubject = {
  code: string;
  name: string;
  track: SbaTrack;
  category:
    | "Sciences"
    | "Business"
    | "Technology"
    | "Technical & Vocational"
    | "Humanities"
    | "Languages";
  sbaType: string;
  template?: string;
};

const labReport = `<h2>1. Aim</h2><p>State the purpose of the investigation.</p>
<h2>2. Hypothesis</h2><p>Predict what you expect and why.</p>
<h2>3. Apparatus &amp; Materials</h2><ul><li></li></ul>
<h2>4. Method</h2><ol><li></li></ol>
<h2>5. Results</h2><p>Record raw data in your <em>linked sheet</em>. Place key tables and charts here.</p>
<h2>6. Discussion</h2><p>Explain the trends. Reference theory. Address sources of error.</p>
<h2>7. Conclusion</h2><p>Direct answer to the aim.</p>
<h2>8. References</h2><ul><li></li></ul>`;

const researchEssay = `<h2>1. Title</h2><p></p>
<h2>2. Statement of the Problem</h2><p></p>
<h2>3. Aims of the Study</h2><ul><li></li></ul>
<h2>4. Literature Review</h2><p></p>
<h2>5. Methodology</h2><p>Sample, instruments, procedure (cross-reference the linked sheet for raw data).</p>
<h2>6. Presentation &amp; Analysis of Findings</h2><p>Embed charts from the linked sheet. Interpret each.</p>
<h2>7. Discussion</h2><p></p>
<h2>8. Recommendations</h2><p></p>
<h2>9. Limitations</h2><p></p>
<h2>10. References</h2><ul><li></li></ul>`;

const businessProject = `<h2>1. Description of the Business</h2><p></p>
<h2>2. Justification of Location</h2><p></p>
<h2>3. Selection of Appropriate Labour</h2><p></p>
<h2>4. Sources of Capital</h2><p></p>
<h2>5. Role of the Entrepreneur</h2><p></p>
<h2>6. Type of Production</h2><p></p>
<h2>7. Levels of Production</h2><p></p>
<h2>8. Quality Control</h2><p></p>
<h2>9. Use of Technology</h2><p></p>
<h2>10. Linkages</h2><p></p>
<h2>11. Potential for Growth</h2><p></p>
<h2>12. Government Regulations</h2><p></p>`;

const codingProject = `<h2>1. Problem Definition</h2><p></p>
<h2>2. Stakeholders &amp; Requirements</h2><ul><li></li></ul>
<h2>3. Design</h2><p>Algorithms, diagrams, data structures. Cross-reference the linked sheet for test data.</p>
<h2>4. Implementation</h2><p>Describe modules; paste critical code snippets.</p>
<h2>5. Testing</h2><p>Test plan and results.</p>
<h2>6. Documentation</h2><p>User guide / setup.</p>
<h2>7. Limitations &amp; Future Work</h2><p></p>`;

const portfolio = `<h2>1. Theme &amp; Concept</h2><p></p>
<h2>2. Inspiration &amp; Research</h2><p></p>
<h2>3. Development Pieces</h2><p>Describe each draft / iteration. Attach reference images.</p>
<h2>4. Final Piece(s)</h2><p></p>
<h2>5. Critical Reflection</h2><p></p>`;

const performance = `<h2>1. Concept &amp; Theme</h2><p></p>
<h2>2. Process Journal</h2><p>Rehearsal log, decisions, feedback.</p>
<h2>3. Final Piece Description</h2><p></p>
<h2>4. Reflection</h2><p></p>`;

const fieldStudy = `<h2>1. Title &amp; Hypothesis</h2><p></p>
<h2>2. Location of the Study Area</h2><p>Map &amp; sketches.</p>
<h2>3. Methodology</h2><p>Sampling, instruments, procedure.</p>
<h2>4. Presentation of Data</h2><p>Tables and charts from the linked sheet.</p>
<h2>5. Analysis</h2><p></p>
<h2>6. Conclusion</h2><p></p>
<h2>7. Limitations</h2><p></p>
<h2>8. References</h2><ul><li></li></ul>`;

const oralAssessment = `<h2>1. Theme / Topic</h2><p></p>
<h2>2. Preparation Notes</h2><p>Key vocabulary, structure, anticipated questions.</p>
<h2>3. Practice Log</h2><p>Date / partner / feedback.</p>
<h2>4. Recording References</h2><p>Links to audio/video stored in research files.</p>`;

const englishSba = `<h2>1. Theme</h2><p></p>
<h2>2. Plan of Investigation</h2><p></p>
<h2>3. Reflections (3 pieces)</h2><p></p>
<h2>4. Written Report</h2><p></p>
<h2>5. Oral Presentation Notes</h2><p></p>
<h2>6. Bibliography</h2><ul><li></li></ul>`;

const officeAdmin = `<h2>1. Department / Section Profile</h2><p></p>
<h2>2. Aim of the Study</h2><p></p>
<h2>3. Functions Observed</h2><ul><li></li></ul>
<h2>4. Office Equipment &amp; Procedures</h2><p></p>
<h2>5. Findings &amp; Analysis</h2><p></p>
<h2>6. Recommendations</h2><p></p>
<h2>7. Appendices</h2><p>Forms, organisational charts, photos in research files.</p>`;

const accountingProject = `<h2>1. Description of the Business</h2><p></p>
<h2>2. Source Documents</h2><p>Sample receipts/invoices in research files.</p>
<h2>3. Books of Original Entry</h2><p>Use the linked sheet.</p>
<h2>4. Ledger Accounts</h2><p>Use the linked sheet.</p>
<h2>5. Trial Balance</h2><p>Use the linked sheet.</p>
<h2>6. Financial Statements</h2><p>Trading, Profit &amp; Loss, Balance Sheet.</p>
<h2>7. Analysis &amp; Interpretation</h2><p></p>`;

const cariStudies = `<h2>1. Statement of the Problem</h2><p></p>
<h2>2. Purpose of the Research</h2><p></p>
<h2>3. Literature Review</h2><p></p>
<h2>4. Data Collection Sources</h2><p></p>
<h2>5. Presentation of Findings</h2><p></p>
<h2>6. Discussion &amp; Analysis</h2><p></p>
<h2>7. Conclusion</h2><p></p>
<h2>8. Limitations</h2><p></p>
<h2>9. Bibliography</h2><ul><li></li></ul>`;

const communicationStudies = `<h2>1. Module 1 — Gathering &amp; Processing Information</h2><p>Reflective piece &amp; expository piece.</p>
<h2>2. Module 2 — Language &amp; Community</h2><p>Analysis of language use in a community context.</p>
<h2>3. Module 3 — Speaking &amp; Writing</h2><p>Oral presentation notes &amp; the final written exposition.</p>
<h2>4. Bibliography</h2><ul><li></li></ul>`;

export const SBA_SUBJECTS: SbaSubject[] = [
  // CSEC Sciences
  { code: "BIO",    name: "Biology",                    track: "csec", category: "Sciences", sbaType: "Lab investigations",       template: labReport },
  { code: "CHEM",   name: "Chemistry",                  track: "csec", category: "Sciences", sbaType: "Experiments / lab reports", template: labReport },
  { code: "PHY",    name: "Physics",                    track: "csec", category: "Sciences", sbaType: "Experimental investigations", template: labReport },
  { code: "ISCI",   name: "Integrated Science",         track: "csec", category: "Sciences", sbaType: "Scientific projects",      template: labReport },
  { code: "AGSI",   name: "Agricultural Science",       track: "csec", category: "Sciences", sbaType: "Practical projects / reports", template: labReport },
  { code: "HSB",    name: "Human & Social Biology",     track: "csec", category: "Sciences", sbaType: "Research / project work",  template: researchEssay },

  // CSEC Business
  { code: "POB",    name: "Principles of Business",     track: "csec", category: "Business", sbaType: "Business research project", template: businessProject },
  { code: "POA",    name: "Principles of Accounts",     track: "csec", category: "Business", sbaType: "Accounting project",       template: accountingProject },
  { code: "ECON",   name: "Economics",                  track: "csec", category: "Business", sbaType: "Research analysis",        template: researchEssay },
  { code: "OA",     name: "Office Administration",      track: "csec", category: "Business", sbaType: "Office simulation / project", template: officeAdmin },
  { code: "EDPM",   name: "Electronic Document Preparation & Management (EDPM)", track: "csec", category: "Business", sbaType: "Document production project", template: officeAdmin },

  // CSEC Tech / Computer
  { code: "IT",     name: "Information Technology",     track: "csec", category: "Technology", sbaType: "Programming / database / web project", template: codingProject },
  { code: "CS",     name: "Computer Science",           track: "csec", category: "Technology", sbaType: "Coding / programming project",     template: codingProject },
  { code: "INTECH", name: "Industrial Technology",      track: "csec", category: "Technology", sbaType: "Technical practical project",      template: portfolio },

  // CSEC Technical & Vocational
  { code: "TD",     name: "Technical Drawing",          track: "csec", category: "Technical & Vocational", sbaType: "Drafting / design portfolio", template: portfolio },
  { code: "BT",     name: "Building Technology",        track: "csec", category: "Technical & Vocational", sbaType: "Construction project",         template: portfolio },
  { code: "MET",    name: "Mechanical Engineering Technology", track: "csec", category: "Technical & Vocational", sbaType: "Engineering practical", template: portfolio },
  { code: "EET",    name: "Electrical & Electronic Technology", track: "csec", category: "Technical & Vocational", sbaType: "Wiring / electronics project", template: portfolio },
  { code: "FN",     name: "Food & Nutrition",           track: "csec", category: "Technical & Vocational", sbaType: "Food preparation / project",  template: portfolio },
  { code: "CT",     name: "Clothing & Textiles",        track: "csec", category: "Technical & Vocational", sbaType: "Garment / design project",    template: portfolio },
  { code: "HE",     name: "Home Economics",             track: "csec", category: "Technical & Vocational", sbaType: "Practical assignment",        template: portfolio },
  { code: "VA",     name: "Visual Arts",                track: "csec", category: "Technical & Vocational", sbaType: "Art portfolio",               template: portfolio },
  { code: "TA",     name: "Theatre Arts",               track: "csec", category: "Technical & Vocational", sbaType: "Performance / project",       template: performance },
  { code: "MUSIC",  name: "Music",                      track: "csec", category: "Technical & Vocational", sbaType: "Performance / composition",   template: performance },

  // CSEC Humanities
  { code: "GEO",    name: "Geography",                  track: "csec", category: "Humanities", sbaType: "Field study / project",  template: fieldStudy },
  { code: "HIST",   name: "History",                    track: "csec", category: "Humanities", sbaType: "Research assignment",    template: researchEssay },
  { code: "SOC",    name: "Social Studies",             track: "csec", category: "Humanities", sbaType: "Community / social research", template: researchEssay },

  // CSEC Languages
  { code: "ENG-A",  name: "English A",                  track: "csec", category: "Languages", sbaType: "SBA / oral components",   template: englishSba },
  { code: "ENG-B",  name: "English B",                  track: "csec", category: "Languages", sbaType: "SBA / oral / project",    template: englishSba },
  { code: "SPAN",   name: "Spanish",                    track: "csec", category: "Languages", sbaType: "Oral assessment",         template: oralAssessment },
  { code: "FREN",   name: "French",                     track: "csec", category: "Languages", sbaType: "Oral assessment",         template: oralAssessment },

  // CAPE Sciences
  { code: "CAPE-BIO",  name: "CAPE Biology",            track: "cape", category: "Sciences", sbaType: "Lab investigations + research", template: labReport },
  { code: "CAPE-CHEM", name: "CAPE Chemistry",          track: "cape", category: "Sciences", sbaType: "Lab investigations + research", template: labReport },
  { code: "CAPE-PHY",  name: "CAPE Physics",            track: "cape", category: "Sciences", sbaType: "Lab investigations + research", template: labReport },
  { code: "CAPE-ENV",  name: "CAPE Environmental Science", track: "cape", category: "Sciences", sbaType: "Research project",      template: researchEssay },

  // CAPE Business
  { code: "CAPE-MOB",  name: "CAPE Management of Business", track: "cape", category: "Business", sbaType: "Business research", template: businessProject },
  { code: "CAPE-ENT",  name: "CAPE Entrepreneurship",   track: "cape", category: "Business", sbaType: "Venture project",        template: businessProject },
  { code: "CAPE-ACC",  name: "CAPE Accounting",         track: "cape", category: "Business", sbaType: "Accounting project",     template: accountingProject },
  { code: "CAPE-ECON", name: "CAPE Economics",          track: "cape", category: "Business", sbaType: "Research analysis",      template: researchEssay },

  // CAPE Technology
  { code: "CAPE-CS",   name: "CAPE Computer Science",   track: "cape", category: "Technology", sbaType: "Computing project",    template: codingProject },
  { code: "CAPE-IT",   name: "CAPE Information Technology", track: "cape", category: "Technology", sbaType: "IT project",       template: codingProject },

  // CAPE Humanities
  { code: "CARIB",     name: "CAPE Caribbean Studies",  track: "cape", category: "Humanities", sbaType: "Research paper",       template: cariStudies },
  { code: "CAPE-SOC",  name: "CAPE Sociology",          track: "cape", category: "Humanities", sbaType: "Research project",     template: researchEssay },
  { code: "COMS",      name: "CAPE Communication Studies", track: "cape", category: "Humanities", sbaType: "Communication SBA", template: communicationStudies },
  { code: "CAPE-LAW",  name: "CAPE Law (Internal Projects)", track: "cape", category: "Humanities", sbaType: "Case analysis",   template: researchEssay },
];

export const SBA_SUBJECTS_BY_CODE = Object.fromEntries(
  SBA_SUBJECTS.map((s) => [s.code, s]),
);

export const SBA_CATEGORIES: Array<{ category: SbaSubject["category"]; subjects: SbaSubject[] }> = [
  "Sciences",
  "Business",
  "Technology",
  "Technical & Vocational",
  "Humanities",
  "Languages",
].map((c) => ({
  category: c as SbaSubject["category"],
  subjects: SBA_SUBJECTS.filter((s) => s.category === c),
}));
