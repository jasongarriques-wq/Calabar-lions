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
  ClipboardList,
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
  { label: "Users", icon: Users },
  { label: "Academic Division", icon: GraduationCap },
  { label: "Classes", icon: School },
  { label: "Subjects", icon: BookOpen },
  { label: "Assignments", icon: ClipboardList },
  { label: "Lion Docs", icon: BookOpen },
  { label: "Lion Slides", icon: Megaphone },
  { label: "Lion Sheets", icon: Activity },
  { label: "Sports", icon: Trophy },
  { label: "Groups", icon: Flag },
  { label: "Posts & Reports", icon: Shield },
  { label: "Media Center", icon: Megaphone },
  { label: "Calendar", icon: CalendarDays },
  { label: "Notifications", icon: AlertTriangle },
  { label: "Analytics", icon: BarChart3 },
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
          {active !== "Dashboard" && (
            <SectionPlaceholder
              label={active}
              users={users}
              reports={reports}
              pendingApprovals={pendingApprovals}
            />
          )}
          {active === "Dashboard" && (
            <>
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
                              <a
                                href={`/profile/${user.id}`}
                                className="inline-flex h-8 items-center rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open
                              </a>
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const DIVISIONS: Record<
  string,
  { tagline: string; bullets: string[] }
> = {
  Users: {
    tagline: "Create, approve, and govern every Lion on the platform.",
    bullets: [
      "Create student accounts",
      "Verify enrolment & approve teachers",
      "Reset passwords",
      "Assign students to forms / classes",
      "Disciplinary records and transfers",
    ],
  },
  "Academic Division": {
    tagline: "Forms 7–11 academic operations.",
    bullets: [
      "Create forms & classes",
      "Assign form teachers",
      "Manage timetables",
      "Manage SBA systems",
      "Upload syllabuses",
      "Review academic reports",
    ],
  },
  Classes: {
    tagline: "All 40 main classes + sixth-form streams.",
    bullets: [
      "Create / rename classes",
      "Assign form teachers",
      "Move students between classes",
      "Archive a previous year's classes",
    ],
  },
  Subjects: {
    tagline: "CSEC + CAPE subject catalog.",
    bullets: [
      "Add or edit subjects",
      "Tag SBA / coursework type",
      "Assign subject teachers",
      "Link templates to Lion Docs",
    ],
  },
  Assignments: {
    tagline: "Homework + SBA assignments by class.",
    bullets: [
      "Create classroom assignments",
      "Attach Lion Docs / Sheets / Slides templates",
      "Track submissions by class",
      "Grade with rubric",
    ],
  },
  "Lion Docs": {
    tagline: "Essay / SBA editor administration.",
    bullets: [
      "Essay & SBA templates",
      "Teacher collaboration permissions",
      "File approvals",
      "Shared academic libraries",
    ],
  },
  "Lion Slides": {
    tagline: "Presentation builder administration.",
    bullets: [
      "Presentation templates",
      "School-branded themes",
      "Classroom presentation permissions",
    ],
  },
  "Lion Sheets": {
    tagline: "Spreadsheet & gradebook administration.",
    bullets: [
      "Gradebook systems",
      "Spreadsheet templates",
      "Academic analytics",
      "Attendance systems",
    ],
  },
  Sports: {
    tagline: "Sports division operations.",
    bullets: [
      "Create teams",
      "Assign coaches",
      "Upload fixtures and results",
      "Manage athlete profiles",
      "Training schedules",
    ],
  },
  Groups: {
    tagline: "Houses, classes, sports, clubs, alumni.",
    bullets: [
      "Approve new groups",
      "Pin official groups",
      "Audit membership",
      "Archive old groups",
    ],
  },
  "Posts & Reports": {
    tagline: "Moderation queue across Lion Social.",
    bullets: [
      "Review reports",
      "Remove inappropriate content",
      "Suspend accounts",
      "Conduct records",
    ],
  },
  "Media Center": {
    tagline: "School announcements and media library.",
    bullets: [
      "Platform-wide announcements",
      "Homepage banners",
      "Event promotion",
      "Livestreams & uploads",
      "Newsletter publishing",
    ],
  },
  Calendar: {
    tagline: "Term-wide events and academic calendar.",
    bullets: [
      "Term dates",
      "Exam schedule",
      "Sports fixtures",
      "Club meetings",
    ],
  },
  Notifications: {
    tagline: "Platform-wide notifications and routing.",
    bullets: [
      "Send broadcast",
      "Configure per-event templates",
      "Quiet hours for students",
    ],
  },
  Analytics: {
    tagline: "Platform-wide health and engagement.",
    bullets: [
      "Active students per form",
      "Submission rates",
      "Top groups and channels",
      "Storage usage",
    ],
  },
  Settings: {
    tagline: "Branding, security, infrastructure.",
    bullets: [
      "School year creation",
      "Global settings",
      "Branding customisation",
      "Backup & audit logs",
    ],
  },
};

function SectionPlaceholder({
  label,
  users,
  reports,
  pendingApprovals,
}: {
  label: string;
  users: AdminUser[];
  reports: AdminReport[];
  pendingApprovals: number;
}) {
  const meta = DIVISIONS[label];
  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-300/80">
          Division
        </p>
        <h2 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">{label}</h2>
        {meta && <p className="mt-2 max-w-3xl text-slate-500">{meta.tagline}</p>}
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {meta?.bullets.map((b) => (
          <Card key={b} className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4 text-sm">
              <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-emerald-50 text-emerald-700">
                ✓
              </span>
              <span className="font-medium">{b}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {label === "Users" && (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Recent users</h3>
              <span className="text-xs text-slate-500">
                {pendingApprovals.toLocaleString()} pending approvals
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Group</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-semibold">{u.name}</td>
                      <td className="py-2 pr-4 text-slate-600">{u.role}</td>
                      <td className="py-2 pr-4 text-slate-600">{u.group}</td>
                      <td className="py-2 text-slate-600">{u.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {label === "Posts & Reports" && (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <h3 className="mb-3 text-xl font-bold">Open reports</h3>
            <ul className="space-y-2 text-sm">
              {reports.length === 0 && (
                <li className="text-slate-500">No open reports — all clear.</li>
              )}
              {reports.map((r) => (
                <li key={r.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-bold">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.area}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
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
