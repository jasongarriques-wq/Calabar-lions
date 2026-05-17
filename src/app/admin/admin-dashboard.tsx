"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  LogIn,
  Shield,
  Users,
  Trophy,
  BookOpen,
  School,
  Megaphone,
  Flag,
  Plus,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Settings,
  UserCheck,
  UserX,
  BarChart3,
  CalendarDays,
  Upload,
  Lock,
  Eye,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Activity,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type AdminUser = {
  id: string;
  name: string;
  role: string;
  group: string;
  status: string;
  risk: "Low" | "Medium" | "High";
  email: string;
  phone: string;
  address: string;
  house: string;
  sport: string;
  attendance: string;
  graduation: string;
};

export type AdminReport = {
  id: string;
  title: string;
  severity: "Low" | "Medium" | "High";
  area: string;
};

type Props = {
  users: AdminUser[];
  reports: AdminReport[];
  pendingApprovals: number;
};

const grades = [
  { grade: "Grade 7", form: "First Form", classes: ["7-1", "7-2", "7-3", "7-4", "7-5", "7-6", "7-7", "7-8"] },
  { grade: "Grade 8", form: "Second Form", classes: ["8-1", "8-2", "8-3", "8-4", "8-5", "8-6", "8-7", "8-8"] },
  { grade: "Grade 9", form: "Third Form", classes: ["9-1", "9-2", "9-3", "9-4", "9-5", "9-6", "9-7", "9-8"] },
  { grade: "Grade 10", form: "Fourth Form", classes: ["10-1", "10-2", "10-3", "10-4", "10-5", "10-6", "10-7", "10-8"] },
  { grade: "Grade 11", form: "Fifth Form", classes: ["11-1", "11-2", "11-3", "11-4", "11-5", "11-6", "11-7", "11-8"] },
];

const sports = [
  "Track & Field",
  "Football",
  "Cricket",
  "Basketball",
  "Rugby",
  "Swimming",
  "Table Tennis",
  "Chess",
  "Fitness Club",
];

const clubs = [
  "Debate Society",
  "Robotics Club",
  "Science Club",
  "Media Club",
  "Entrepreneurship Club",
  "Quiz Team",
  "Chess Club",
  "Music Club",
];

const sidebar = [
  { label: "Dashboard", icon: BarChart3 },
  { label: "Students", icon: Users },
  { label: "Classes", icon: School },
  { label: "Sports", icon: Trophy },
  { label: "Clubs", icon: Flag },
  { label: "Teachers", icon: BookOpen },
  { label: "Announcements", icon: Megaphone },
  { label: "Moderation", icon: Shield },
  { label: "Events", icon: CalendarDays },
  { label: "Settings", icon: Settings },
];

const signInRoles = [
  { role: "Super Admin", access: "Full platform control", defaultGroup: "Admin Command" },
  { role: "Moderator", access: "Reports, posts, comments, user safety", defaultGroup: "Moderation" },
  { role: "Teacher", access: "Classes, homework, announcements", defaultGroup: "Grade 11" },
  { role: "Coach", access: "Sports teams, fixtures, athletes", defaultGroup: "Track & Field" },
  { role: "Prefect", access: "Student leadership and class support", defaultGroup: "10-1" },
  { role: "Student", access: "Class groups, sports, clubs, feed", defaultGroup: "11-3" },
  { role: "Old Boy", access: "Alumni network, mentorship, donations", defaultGroup: "Class of 2012" },
];

const productivityApps = [
  {
    name: "Lion Docs",
    type: "Essay & Document Editor",
    description:
      "Write essays, SBA reports, assignments, and collaborative documents.",
    features: ["Live collaboration", "Teacher comments", "Auto-save", "Templates", "Grammar tools"],
  },
  {
    name: "Lion Slides",
    type: "Presentation Builder",
    description:
      "Create SBA presentations, class presentations, and pitch decks.",
    features: ["Animations", "Group editing", "Presenter mode", "Export PDF", "Media embeds"],
  },
  {
    name: "Lion Sheets",
    type: "Spreadsheet System",
    description:
      "Perform calculations, charts, data analysis, and financial work.",
    features: ["Formulas", "Charts", "Attendance tracking", "Budget sheets", "Gradebooks"],
  },
  {
    name: "Lion Notes",
    type: "Digital Notebook",
    description:
      "Store class notes, diagrams, formulas, and revision materials.",
    features: ["Draw mode", "Subject tabs", "Cloud sync", "Voice notes", "Study folders"],
  },
];

function StatCard({
  title,
  value,
  icon: Icon,
  note,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  note: string;
}) {
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <h3 className="mt-1 text-3xl font-bold text-slate-950">{value}</h3>
            <p className="mt-2 text-xs text-slate-500">{note}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
            <Icon className="h-6 w-6 text-slate-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

export function AdminDashboard({ users, reports, pendingApprovals }: Props) {
  const [active, setActive] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [signedInAs, setSignedInAs] = useState(signInRoles[0]);

  const allClassGroups = useMemo(() => grades.flatMap((g) => g.classes), []);

  const [selectedProfile, setSelectedProfile] = useState<AdminUser | null>(users[0] ?? null);

  const filteredUsers = users.filter((user) =>
    [user.name, user.role, user.group, user.status]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex">
        <aside className="hidden min-h-screen w-72 flex-col bg-slate-950 p-5 text-white lg:flex">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 font-black text-slate-950">
                CL
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Calabar Lions</h1>
                <p className="text-xs text-slate-400">Admin Command Center</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {sidebar.map((item) => {
              const Icon = item.icon;
              const selected = active === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => setActive(item.label)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    selected ? "bg-white text-slate-950" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="h-4 w-4 text-emerald-400" />
              Admin Access
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Only verified staff, admins, and approved moderators should access this area.
            </p>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <header className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-black tracking-tight md:text-4xl"
              >
                Admin Dashboard
              </motion.h2>
              <p className="mt-2 text-slate-500">
                Manage classes, sports, clubs, users, posts, reports, and school-wide announcements.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <LogIn className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <select
                  value={signedInAs.role}
                  onChange={(e) =>
                    setSignedInAs(
                      signInRoles.find((item) => item.role === e.target.value) ?? signInRoles[0],
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 font-semibold outline-none focus:ring-2 focus:ring-slate-300 sm:w-56"
                >
                  {signInRoles.map((item) => (
                    <option key={item.role} value={item.role}>
                      Sign in as {item.role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users, groups, roles..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-slate-300 sm:w-80"
                />
              </div>
              <Button className="rounded-2xl bg-slate-950 hover:bg-slate-800">
                <Plus className="mr-2 h-4 w-4" /> Create Group
              </Button>
            </div>
          </header>

          <section className="mb-8">
            <Card className="rounded-2xl border-slate-200 bg-slate-950 text-white shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                    Current Admin Preview
                  </p>
                  <h3 className="mt-1 text-2xl font-black">Signed in as {signedInAs.role}</h3>
                  <p className="mt-2 text-sm text-slate-300">{signedInAs.access}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill>{signedInAs.defaultGroup}</Pill>
                  <Pill>Permission Preview</Pill>
                  <Pill>Role-Based Access</Pill>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Class Groups"
              value={allClassGroups.length}
              icon={School}
              note="Grade 7 to Grade 11, 8 classes each"
            />
            <StatCard
              title="Sports Groups"
              value={sports.length}
              icon={Trophy}
              note="Official sport communities"
            />
            <StatCard
              title="Pending Approvals"
              value={pendingApprovals}
              icon={UserCheck}
              note="Students, old boys, staff requests"
            />
            <StatCard
              title="Open Reports"
              value={reports.length}
              icon={AlertTriangle}
              note="Needs admin review"
            />
          </section>

          <section className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
            <Card className="rounded-2xl border-slate-200 shadow-sm 2xl:col-span-2">
              <CardContent className="p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Grade &amp; Class Groups</h3>
                    <p className="text-sm text-slate-500">Core academic structure for the platform.</p>
                  </div>
                  <Button variant="outline" className="rounded-2xl">
                    <Upload className="mr-2 h-4 w-4" /> Bulk Import
                  </Button>
                </div>

                <div className="space-y-4">
                  {grades.map((grade) => (
                    <div
                      key={grade.grade}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h4 className="font-bold">{grade.grade}</h4>
                          <p className="text-xs text-slate-500">{grade.form}</p>
                        </div>
                        <Pill>{grade.classes.length} groups</Pill>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {grade.classes.map((className) => (
                          <button
                            key={className}
                            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold hover:bg-slate-200"
                          >
                            {className}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold">Sports Groups</h3>
                    <Trophy className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {sports.map((sport) => (
                      <div
                        key={sport}
                        className="flex items-center justify-between rounded-2xl bg-slate-100 p-3"
                      >
                        <span className="text-sm font-medium">{sport}</span>
                        <MoreVertical className="h-4 w-4 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold">Clubs &amp; Societies</h3>
                    <Flag className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {clubs.map((club) => (
                      <Pill key={club}>{club}</Pill>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mt-6">
            <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
              <div className="bg-gradient-to-r from-slate-950 to-slate-800 p-6 text-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">
                      Calabar Productivity Suite
                    </p>
                    <h3 className="mt-2 text-3xl font-black">
                      Built-In 365 Style Student Workspace
                    </h3>
                    <p className="mt-3 max-w-3xl text-slate-300">
                      Students can write essays, build presentations, create spreadsheets,
                      collaborate live, and complete SBA projects directly inside the Calabar
                      Lions ecosystem.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Pill>SBA Ready</Pill>
                    <Pill>Cloud Collaboration</Pill>
                    <Pill>Teacher Review</Pill>
                    <Pill>Auto Save</Pill>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-4">
                  {productivityApps.map((app) => (
                    <motion.div
                      key={app.name}
                      whileHover={{ y: -4 }}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-2xl font-black text-slate-950">{app.name}</h4>
                          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-emerald-600">
                            {app.type}
                          </p>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                          <BookOpen className="h-6 w-6 text-slate-700" />
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-relaxed text-slate-600">
                        {app.description}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {app.features.map((feature) => (
                          <span
                            key={feature}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-2">
                        <Button className="rounded-2xl bg-slate-950 text-xs hover:bg-slate-800">
                          Open App
                        </Button>
                        <Button variant="outline" className="rounded-2xl text-xs">
                          Create File
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h4 className="text-2xl font-black">SBA Workspace System</h4>
                      <p className="mt-2 max-w-3xl text-slate-600">
                        Students can create full School Based Assessments with teacher review,
                        live collaboration, grading workflows, version history, research folders,
                        presentation exports, and spreadsheet calculations.
                      </p>
                    </div>

                    <Button className="rounded-2xl bg-emerald-600 px-6 py-6 text-base font-bold text-white hover:bg-emerald-700">
                      Create New SBA Project
                    </Button>
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SbaFeature
                      title="Essay Writing"
                      body="Introduction, methodology, analysis, conclusion, bibliography."
                    />
                    <SbaFeature
                      title="Spreadsheet Analysis"
                      body="Charts, formulas, financial analysis, survey calculations."
                    />
                    <SbaFeature
                      title="Presentation Builder"
                      body="Final oral presentations with slides and media support."
                    />
                    <SbaFeature
                      title="Teacher Review"
                      body="Comments, grading, approvals, and revision tracking."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">User Verification</h3>
                    <p className="text-sm text-slate-500">
                      Approve students, old boys, teachers, coaches, and moderators.
                    </p>
                  </div>
                  <Button variant="outline" className="rounded-2xl">
                    View All
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="py-3 pr-4">Name</th>
                        <th className="py-3 pr-4">Role</th>
                        <th className="py-3 pr-4">Group</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500">
                            No users to verify.
                          </td>
                        </tr>
                      )}
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-semibold">{user.name}</td>
                          <td className="py-3 pr-4 text-slate-600">{user.role}</td>
                          <td className="py-3 pr-4 text-slate-600">{user.group}</td>
                          <td className="py-3 pr-4">
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">
                              {user.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setSelectedProfile(user)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" className="rounded-xl bg-slate-950">
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="rounded-xl">
                                <UserX className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Moderation Queue</h3>
                    <p className="text-sm text-slate-500">
                      Handle reports before they damage the culture.
                    </p>
                  </div>
                  <Shield className="h-5 w-5 text-slate-500" />
                </div>

                <div className="space-y-3">
                  {reports.length === 0 && (
                    <p className="text-sm text-slate-500">No open reports.</p>
                  )}
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold">{report.title}</h4>
                          <p className="mt-1 text-sm text-slate-500">Area: {report.area}</p>
                          <div className="mt-3">
                            <Pill>{report.severity} severity</Pill>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="rounded-xl">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-xl">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {selectedProfile && (
            <section className="mt-6">
              <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
                <div className="bg-slate-950 p-6 text-white">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 text-3xl font-black text-slate-950">
                        {selectedProfile.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-3xl font-black">{selectedProfile.name}</h3>
                        <p className="mt-1 text-slate-300">
                          {selectedProfile.role} • {selectedProfile.group}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Pill>{selectedProfile.house}</Pill>
                          <Pill>{selectedProfile.sport}</Pill>
                          <Pill>Graduation {selectedProfile.graduation}</Pill>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button className="rounded-2xl bg-white text-slate-950 hover:bg-slate-200">
                        <UserCheck className="mr-2 h-4 w-4" /> Verify User
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-2xl border-slate-700 text-white hover:bg-slate-800"
                      >
                        <Shield className="mr-2 h-4 w-4" /> Moderate
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-2xl border-red-700 text-red-300 hover:bg-red-950"
                      >
                        <UserX className="mr-2 h-4 w-4" /> Suspend
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                            <Mail className="h-4 w-4" /> Contact Information
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-slate-400" /> {selectedProfile.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-slate-400" /> {selectedProfile.phone}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-slate-400" /> {selectedProfile.address}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                            <GraduationCap className="h-4 w-4" /> Academic Profile
                          </div>
                          <div className="space-y-3 text-sm">
                            <div>
                              <strong>Class:</strong> {selectedProfile.group}
                            </div>
                            <div>
                              <strong>Attendance:</strong> {selectedProfile.attendance}
                            </div>
                            <div>
                              <strong>Status:</strong> {selectedProfile.status}
                            </div>
                            <div>
                              <strong>Risk Level:</strong> {selectedProfile.risk}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <Activity className="h-5 w-5 text-slate-700" />
                          <h4 className="text-lg font-bold">Admin Activity Access</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                          <div className="rounded-xl bg-slate-100 p-3">Recent Posts</div>
                          <div className="rounded-xl bg-slate-100 p-3">Comments &amp; Replies</div>
                          <div className="rounded-xl bg-slate-100 p-3">Login History</div>
                          <div className="rounded-xl bg-slate-100 p-3">Group Memberships</div>
                          <div className="rounded-xl bg-slate-100 p-3">Uploaded Media</div>
                          <div className="rounded-xl bg-slate-100 p-3">Reported Content</div>
                          <div className="rounded-xl bg-slate-100 p-3">Achievements &amp; Badges</div>
                          <div className="rounded-xl bg-slate-100 p-3">Disciplinary Notes</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <h4 className="mb-4 font-bold">Profile Permissions</h4>

                        <div className="space-y-3 text-sm">
                          <PermissionRow label="View Profile" ok />
                          <PermissionRow label="Edit Role" ok />
                          <PermissionRow label="Access Messages" warning />
                          <PermissionRow label="Suspend Account" ok />
                          <PermissionRow label="Reset Password" ok />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <h4 className="mb-4 font-bold">Quick Actions</h4>

                        <div className="grid grid-cols-1 gap-2">
                          <Button className="rounded-xl bg-slate-950 hover:bg-slate-800">
                            Message User
                          </Button>
                          <Button variant="outline" className="rounded-xl">
                            Move Class
                          </Button>
                          <Button variant="outline" className="rounded-xl">
                            Assign Badge
                          </Button>
                          <Button variant="outline" className="rounded-xl">
                            View Reports
                          </Button>
                          <Button variant="outline" className="rounded-xl text-red-600">
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function SbaFeature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h5 className="font-bold">{title}</h5>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
    </div>
  );
}

function PermissionRow({
  label,
  ok,
  warning,
}: {
  label: string;
  ok?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      {ok && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
      {warning && <Shield className="h-4 w-4 text-amber-500" />}
    </div>
  );
}
