import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Menu,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
  Zap,
} from "lucide-react";

import ActionTracker from "./components/ActionTracker";
import "./App.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

const initialStakeholders = [
  {
    id: 1,
    name: "Aarav Mehta",
    role: "Project Architect",
    company: "ArchScale Studio",
    status: "Active",
    initials: "AM",
  },
  {
    id: 2,
    name: "Neha Kapoor",
    role: "Interior Designer",
    company: "ArchScale Studio",
    status: "Active",
    initials: "NK",
  },
  {
    id: 3,
    name: "Rohan Shah",
    role: "Client Representative",
    company: "Riverside Holdings",
    status: "Waiting",
    initials: "RS",
  },
  {
    id: 4,
    name: "Vikram Patel",
    role: "Main Contractor",
    company: "Patel BuildWorks",
    status: "Active",
    initials: "VP",
  },
  {
    id: 5,
    name: "Isha Verma",
    role: "Electrical Consultant",
    company: "VoltEdge Consultants",
    status: "Active",
    initials: "IV",
  },
  {
    id: 6,
    name: "Kunal Jain",
    role: "Material Supplier",
    company: "StoneCraft Materials",
    status: "Waiting",
    initials: "KJ",
  },
];

const initialActivities = [
  {
    id: "ACT-1048",
    time: "10 min ago",
    actor: "Rohan Shah",
    title: "Client approval received",
    description:
      "Master bedroom layout approved with one revision request.",
    type: "Approval",
    impact: "Medium",
  },
  {
    id: "ACT-1047",
    time: "28 min ago",
    actor: "Vikram Patel",
    title: "Site clarification raised",
    description:
      "Contractor requested clarification on staircase finish.",
    type: "Site",
    impact: "High",
  },
  {
    id: "ACT-1046",
    time: "1 hr ago",
    actor: "Kunal Jain",
    title: "Material availability update",
    description:
      "Selected marble shade 312 is unavailable from supplier.",
    type: "Supplier",
    impact: "High",
  },
  {
    id: "ACT-1045",
    time: "2 hrs ago",
    actor: "Aarav Mehta",
    title: "Drawing revision uploaded",
    description:
      "Kitchen package moved from Rev 04 to Rev 05.",
    type: "Drawing",
    impact: "Critical",
  },
];

const initialProjects = [
  {
    id: 1,
    name: "Riverside Residence",
    client: "Riverside Holdings",
    stage: "Design Development",
    health: "At Risk",
    openChanges: 4,
    pendingApprovals: 3,
    stakeholders: 12,
    nextMilestone: "18 Sep 2026",
  },
  {
    id: 2,
    name: "North Avenue Office",
    client: "North Avenue Group",
    stage: "Construction",
    health: "On Track",
    openChanges: 1,
    pendingApprovals: 1,
    stakeholders: 9,
    nextMilestone: "22 Sep 2026",
  },
  {
    id: 3,
    name: "Lakeview Boutique Hotel",
    client: "Lakeview Hospitality",
    stage: "Tender",
    health: "On Track",
    openChanges: 2,
    pendingApprovals: 2,
    stakeholders: 15,
    nextMilestone: "25 Sep 2026",
  },
];

function App() {
  const [activeView, setActiveView] =
    useState("Overview");

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [analysis, setAnalysis] =
    useState(null);

  const [activities, setActivities] =
    useState(initialActivities);

  const [projects] =
    useState(initialProjects);

  const [stakeholders] =
    useState(initialStakeholders);

  const [liveMetrics, setLiveMetrics] =
    useState({
      totalActivities: 0,
      totalActions: 0,
      pendingApprovals: 0,
      resolvedActions: 0,
      blockedActions: 0,
      inProgressActions: 0,
      loading: true,
    });

  const [form, setForm] = useState({
    project_name: "Riverside Residence",
    source: "WhatsApp",
    actor: "Client Representative",
    update_text:
      "Client approved the revised living room layout, but requested a larger master bathroom. Contractor has already started framing based on Rev 04 drawings.",
  });

  const fetchLiveMetrics = useCallback(
    async () => {
      try {
        const [activitiesResponse, actionsResponse] =
          await Promise.all([
            fetch(`${API_BASE}/api/activities`),
            fetch(`${API_BASE}/api/actions`),
          ]);

        if (
          !activitiesResponse.ok ||
          !actionsResponse.ok
        ) {
          throw new Error(
            "Unable to load live coordination metrics"
          );
        }

        const activitiesData =
          await activitiesResponse.json();

        const actionsData =
          await actionsResponse.json();

        const activityItems =
          Array.isArray(activitiesData.items)
            ? activitiesData.items
            : [];

        const actionItems =
          Array.isArray(actionsData.items)
            ? actionsData.items
            : [];

        const pendingApprovals =
          actionItems.filter(
            (action) =>
              action.approval_status ===
              "Pending"
          ).length;

        const resolvedActions =
          actionItems.filter(
            (action) =>
              action.status === "Resolved"
          ).length;

        const blockedActions =
          actionItems.filter(
            (action) =>
              action.status === "Blocked"
          ).length;

        const inProgressActions =
          actionItems.filter(
            (action) =>
              action.status === "In Progress"
          ).length;

        setLiveMetrics({
          totalActivities:
            activityItems.length,
          totalActions:
            actionItems.length,
          pendingApprovals,
          resolvedActions,
          blockedActions,
          inProgressActions,
          loading: false,
        });

        if (activityItems.length > 0) {
          const mappedActivities =
            activityItems.map(
              (activity) => ({
                id: activity.activity_ref,
                time: formatActivityTime(
                  activity.created_at
                ),
                actor:
                  activity.actor ||
                  "Project stakeholder",
                title:
                  activity.change_title ||
                  "Project change detected",
                description:
                  activity.change_summary ||
                  "Coordination activity recorded.",
                type:
                  activity.change_type ||
                  "Project",
                impact:
                  activity.impact_level ||
                  "Medium",
              })
            );

          setActivities(
            mappedActivities
          );
        }
      } catch (error) {
        console.error(
          "Live metric loading failed:",
          error
        );

        setLiveMetrics(
          (current) => ({
            ...current,
            loading: false,
          })
        );
      }
    },
    []
  );

  useEffect(() => {
    fetchLiveMetrics();
  }, [fetchLiveMetrics, activeView]);

  const stats = useMemo(
    () => ({
      projects: projects.length,
      stakeholders:
        stakeholders.length,
      activeChanges:
        liveMetrics.totalActivities >
        0
          ? liveMetrics.totalActivities
          : projects.reduce(
              (total, project) =>
                total +
                project.openChanges,
              0
            ),
      pendingApprovals:
        liveMetrics.totalActions >
        0
          ? liveMetrics.pendingApprovals
          : projects.reduce(
              (total, project) =>
                total +
                project.pendingApprovals,
              0
            ),
      resolvedActions:
        liveMetrics.resolvedActions,
      totalActions:
        liveMetrics.totalActions,
      blockedActions:
        liveMetrics.blockedActions,
      inProgressActions:
        liveMetrics.inProgressActions,
    }),
    [
      projects,
      stakeholders,
      liveMetrics,
    ]
  );

  const navigate = (view) => {
    setActiveView(view);
    setMobileMenu(false);
  };

  const updateForm = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const runChangeAnalysis = async (
    event
  ) => {
    event.preventDefault();

    if (!form.update_text.trim()) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/analyze-change`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail ||
            `Analysis failed with status ${response.status}`
        );
      }

      setAnalysis(result);

      const newActivity = {
        id: result.activity_ref,
        time: "Just now",
        actor: form.actor,
        title:
          result.change_title,
        description:
          result.change_summary,
        type:
          result.change_type,
        impact:
          result.impact_level,
      };

      setActivities(
        (current) => [
          newActivity,
          ...current,
        ]
      );

      await fetchLiveMetrics();

      setActiveView(
        "AI Change Monitor"
      );
    } catch (error) {
      setAnalysis({
        status: "error",
        error:
          error.message ||
          "Unable to connect to the coordination intelligence engine.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${
          mobileMenu
            ? "sidebar-open"
            : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Building2
              size={20}
            />
          </div>

          <div>
            <div className="brand-title">
              ArchScale
            </div>

            <div className="brand-subtitle">
              Coordination Intelligence
            </div>
          </div>

          <button
            type="button"
            className="mobile-close"
            onClick={() =>
              setMobileMenu(false)
            }
          >
            <X size={20} />
          </button>
        </div>

        <div className="workspace-card">
          <div className="workspace-label">
            CURRENT PROJECT
          </div>

          <div className="workspace-name">
            Riverside Residence
          </div>

          <div className="workspace-meta">
            <span className="status-dot" />
            Coordination monitoring active
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            {
              label: "Overview",
              icon: (
                <LayoutDashboard
                  size={18}
                />
              ),
            },
            {
              label: "Projects",
              icon: (
                <Building2 size={18} />
              ),
            },
            {
              label: "Activity",
              icon: (
                <Activity size={18} />
              ),
            },
            {
              label: "Stakeholders",
              icon: (
                <Users size={18} />
              ),
            },
            {
              label: "AI Change Monitor",
              icon: (
                <Bot size={18} />
              ),
            },
          ].map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={() =>
                navigate(item.label)
              }
              className={`nav-item ${
                activeView ===
                item.label
                  ? "nav-item-active"
                  : ""
              }`}
            >
              {item.icon}

              <span>
                {item.label}
              </span>

              {item.label ===
                "AI Change Monitor" && (
                <span className="nav-live">
                  AI
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-icon">
            <ShieldCheck
              size={17}
            />
          </div>

          <div>
            <div className="sidebar-footer-title">
              Coordination safety layer
            </div>

            <div className="sidebar-footer-text">
              Every important update gets an impact check.
            </div>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu"
              onClick={() =>
                setMobileMenu(true)
              }
            >
              <Menu size={20} />
            </button>

            <div>
              <div className="eyebrow">
                PROJECT COORDINATION / AS-01
              </div>

              <h1>
                {activeView}
              </h1>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="system-status">
              <span className="status-dot" />
              Intelligence Engine Online
            </div>
          </div>
        </header>

        <main className="content">
          {activeView ===
            "Overview" && (
            <Overview
              stats={stats}
              projects={projects}
              activities={
                activities
              }
              onNewAnalysis={() =>
                navigate(
                  "AI Change Monitor"
                )
              }
            />
          )}

          {activeView ===
            "Projects" && (
            <Projects
              projects={projects}
            />
          )}

          {activeView ===
            "Activity" && (
            <ActivityView
              activities={
                activities
              }
            />
          )}

          {activeView ===
            "Stakeholders" && (
            <Stakeholders
              stakeholders={
                stakeholders
              }
            />
          )}

          {activeView ===
            "AI Change Monitor" && (
            <ChangeMonitor
              form={form}
              updateForm={
                updateForm
              }
              runChangeAnalysis={
                runChangeAnalysis
              }
              isAnalyzing={
                isAnalyzing
              }
              analysis={analysis}
              onOverview={() =>
                navigate(
                  "Overview"
                )
              }
            />
          )}
        </main>

        <footer className="app-footer">
          <span>
            Developed and Managed by{" "}
            <strong>
              Bhanuday Urmaliya
            </strong>{" "}
            — Full Stack Developer
          </span>

          <span>
            ArchScale AS-01 Coordination
          </span>
        </footer>
      </div>
    </div>
  );
}

function Overview({
  stats,
  projects,
  activities,
  onNewAnalysis,
}) {
  const criticalCount =
    projects.filter(
      (project) =>
        project.health ===
        "At Risk"
    ).length;

  return (
    <div>
      <section className="hero-panel">
        <div>
          <div className="hero-kicker">
            <Zap size={15} />
            ONE PROJECT · MANY HANDOFFS · ONE SOURCE OF TRUTH
          </div>

          <h2>
            Stop project changes from
            <br />
            becoming coordination surprises.
          </h2>

          <p>
            Capture project updates, detect meaningful changes,
            identify who is affected and turn ambiguity into
            explicit next actions.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={onNewAnalysis}
          >
            Analyze a Project Update
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="hero-visual">
          <div className="flow-node">
            <span className="flow-icon">
              <FileText size={17} />
            </span>

            Unstructured Update
          </div>

          <div className="flow-line" />

          <div className="flow-node flow-node-ai">
            <span className="flow-icon">
              <Bot size={17} />
            </span>

            AI Change Detection
          </div>

          <div className="flow-line" />

          <div className="flow-node">
            <span className="flow-icon">
              <Users size={17} />
            </span>

            Impacted Stakeholders
          </div>

          <div className="flow-line" />

          <div className="flow-node">
            <span className="flow-icon">
              <CheckCircle2
                size={17}
              />
            </span>

            Actions & Approval
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          label="Active Projects"
          value={stats.projects}
          note="Across current workspace"
          icon={
            <Building2
              size={20}
            />
          }
        />

        <StatCard
          label="Stakeholders"
          value={
            stats.stakeholders
          }
          note="People + partner roles"
          icon={
            <Users size={20} />
          }
        />

        <StatCard
          label="Open Changes"
          value={
            stats.activeChanges
          }
          note={
            stats.totalActions >
            0
              ? `${stats.totalActions} tracked coordination actions`
              : "Need coordination"
          }
          icon={
            <RefreshCw
              size={20}
            />
          }
        />

        <StatCard
          label="Pending Approvals"
          value={
            stats.pendingApprovals
          }
          note={`${stats.resolvedActions} actions resolved · ${criticalCount} project at risk`}
          icon={
            <AlertTriangle
              size={20}
            />
          }
          warning
        />
      </section>

      <section className="stats-grid">
        <StatCard
          label="Resolved Actions"
          value={
            stats.resolvedActions
          }
          note="Completed coordination work"
          icon={
            <CheckCircle2
              size={20}
            />
          }
        />

        <StatCard
          label="In Progress"
          value={
            stats.inProgressActions
          }
          note="Currently being executed"
          icon={
            <Activity size={20} />
          }
        />

        <StatCard
          label="Blocked Actions"
          value={
            stats.blockedActions
          }
          note="Need re-open or intervention"
          icon={
            <AlertTriangle
              size={20}
            />
          }
          warning
        />

        <StatCard
          label="Tracked Actions"
          value={
            stats.totalActions
          }
          note={
            liveMetricNote(
              stats.totalActions
            )
          }
          icon={
            <ShieldCheck
              size={20}
            />
          }
        />
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-eyebrow">
                PROJECT HEALTH
              </div>

              <h3>
                Active projects
              </h3>
            </div>

            <button
              type="button"
              className="text-button"
              onClick={onNewAnalysis}
            >
              Open AI monitor
              <ChevronRight
                size={16}
              />
            </button>
          </div>

          <div className="project-list">
            {projects.map(
              (project) => (
                <div
                  className="project-row"
                  key={project.id}
                >
                  <div className="project-main">
                    <div className="project-icon">
                      <Building2
                        size={18}
                      />
                    </div>

                    <div>
                      <div className="project-name">
                        {
                          project.name
                        }
                      </div>

                      <div className="project-client">
                        {
                          project.client
                        }{" "}
                        ·{" "}
                        {
                          project.stage
                        }
                      </div>
                    </div>
                  </div>

                  <div className="project-metric">
                    <span>
                      {
                        project.openChanges
                      }
                    </span>
                    baseline changes
                  </div>

                  <div className="project-metric">
                    <span>
                      {
                        project.pendingApprovals
                      }
                    </span>
                    baseline approvals
                  </div>

                  <span
                    className={`health-pill ${
                      project.health ===
                      "At Risk"
                        ? "health-risk"
                        : "health-good"
                    }`}
                  >
                    {
                      project.health
                    }
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-eyebrow">
                RECENT PROJECT ACTIVITY
              </div>

              <h3>
                Latest signals
              </h3>
            </div>
          </div>

          <div className="activity-list">
            {activities
              .slice(0, 5)
              .map(
                (activity) => (
                  <ActivityItem
                    key={
                      activity.id
                    }
                    activity={
                      activity
                    }
                  />
                )
              )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  icon,
  warning,
}) {
  return (
    <div
      className={`stat-card ${
        warning
          ? "stat-warning"
          : ""
      }`}
    >
      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-content">
        <div className="stat-label">
          {label}
        </div>

        <div className="stat-value">
          {value}
        </div>

        <div className="stat-note">
          {note}
        </div>
      </div>
    </div>
  );
}

function Projects({
  projects,
}) {
  return (
    <div>
      <SectionIntro
        eyebrow="PROJECTS"
        title="Project coordination workspace"
        description="Keep project health, active changes and approvals visible in one place."
      />

      <div className="cards-grid">
        {projects.map(
          (project) => (
            <div
              className="project-card"
              key={project.id}
            >
              <div className="card-top">
                <div className="project-icon large">
                  <Building2
                    size={21}
                  />
                </div>

                <span
                  className={`health-pill ${
                    project.health ===
                    "At Risk"
                      ? "health-risk"
                      : "health-good"
                  }`}
                >
                  {
                    project.health
                  }
                </span>
              </div>

              <h3>
                {project.name}
              </h3>

              <p>
                {project.client}
              </p>

              <div className="project-detail-grid">
                <div>
                  <span>
                    Stage
                  </span>

                  <strong>
                    {
                      project.stage
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Stakeholders
                  </span>

                  <strong>
                    {
                      project.stakeholders
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Open changes
                  </span>

                  <strong>
                    {
                      project.openChanges
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Next milestone
                  </span>

                  <strong>
                    {
                      project.nextMilestone
                    }
                  </strong>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function ActivityView({
  activities,
}) {
  return (
    <div>
      <SectionIntro
        eyebrow="ACTIVITY & CHANGE TRACKING"
        title="One timeline for project truth"
        description="Bring messages, approvals, site clarifications and revisions into a single activity stream."
      />

      <div className="panel">
        <div className="timeline">
          {activities.map(
            (activity) => (
              <ActivityItem
                key={
                  activity.id
                }
                activity={
                  activity
                }
                detailed
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({
  activity,
  detailed,
}) {
  return (
    <div
      className={`activity-item ${
        detailed
          ? "activity-detailed"
          : ""
      }`}
    >
      <div className="activity-marker">
        {activity.type ===
          "Approval" && (
          <CheckCircle2
            size={16}
          />
        )}

        {activity.type ===
          "Site" && (
          <AlertTriangle
            size={16}
          />
        )}

        {activity.type ===
          "Supplier" && (
          <Building2
            size={16}
          />
        )}

        {activity.type ===
          "Drawing" && (
          <FileText
            size={16}
          />
        )}

        {![
          "Approval",
          "Site",
          "Supplier",
          "Drawing",
        ].includes(
          activity.type
        ) && (
          <Activity
            size={16}
          />
        )}
      </div>

      <div className="activity-body">
        <div className="activity-topline">
          <strong>
            {activity.title}
          </strong>

          <span>
            {activity.time}
          </span>
        </div>

        <div className="activity-description">
          {
            activity.description
          }
        </div>

        <div className="activity-meta">
          <span>
            {activity.actor}
          </span>

          <span>
            {activity.type}
          </span>

          <span
            className={`impact-text impact-${String(
              activity.impact ||
                "Medium"
            ).toLowerCase()}`}
          >
            {
              activity.impact
            }{" "}
            impact
          </span>
        </div>
      </div>
    </div>
  );
}

function Stakeholders({
  stakeholders,
}) {
  return (
    <div>
      <SectionIntro
        eyebrow="STAKEHOLDER & ROLE MANAGEMENT"
        title="Know who needs to know"
        description="Every project role is visible with its responsibility and current coordination state."
      />

      <div className="cards-grid stakeholder-grid">
        {stakeholders.map(
          (person) => (
            <div
              className="stakeholder-card"
              key={person.id}
            >
              <div className="avatar">
                {
                  person.initials
                }
              </div>

              <div className="stakeholder-info">
                <div className="stakeholder-name">
                  {
                    person.name
                  }
                </div>

                <div className="stakeholder-role">
                  {
                    person.role
                  }
                </div>

                <div className="stakeholder-company">
                  {
                    person.company
                  }
                </div>
              </div>

              <span
                className={`stakeholder-status ${
                  person.status ===
                  "Active"
                    ? "stakeholder-active"
                    : "stakeholder-waiting"
                }`}
              >
                {
                  person.status
                }
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function ChangeMonitor({
  form,
  updateForm,
  runChangeAnalysis,
  isAnalyzing,
  analysis,
  onOverview,
}) {
  return (
    <div>
      <SectionIntro
        eyebrow="AI CHANGE INTELLIGENCE"
        title="Turn a project update into coordinated action"
        description="Paste the kind of update that normally gets buried in WhatsApp, email, meeting notes or site messages."
      />

      <div className="analysis-layout">
        <div className="panel analysis-input-panel">
          <div className="panel-header">
            <div>
              <div className="panel-eyebrow">
                STEP 01 · CAPTURE
              </div>

              <h3>
                Project update
              </h3>
            </div>

            <div className="engine-badge">
              <Bot size={15} />
              LangGraph workflow
            </div>
          </div>

          <form
            onSubmit={
              runChangeAnalysis
            }
          >
            <div className="form-grid">
              <Field label="Project">
                <select
                  value={
                    form.project_name
                  }
                  onChange={(event) =>
                    updateForm(
                      "project_name",
                      event.target
                        .value
                    )
                  }
                >
                  <option>
                    Riverside Residence
                  </option>

                  <option>
                    North Avenue Office
                  </option>

                  <option>
                    Lakeview Boutique Hotel
                  </option>
                </select>
              </Field>

              <Field label="Source">
                <select
                  value={
                    form.source
                  }
                  onChange={(event) =>
                    updateForm(
                      "source",
                      event.target
                        .value
                    )
                  }
                >
                  <option>
                    WhatsApp
                  </option>

                  <option>
                    Email
                  </option>

                  <option>
                    Site Update
                  </option>

                  <option>
                    Drawing Revision
                  </option>

                  <option>
                    Meeting Notes
                  </option>
                </select>
              </Field>

              <Field label="Actor">
                <select
                  value={
                    form.actor
                  }
                  onChange={(event) =>
                    updateForm(
                      "actor",
                      event.target
                        .value
                    )
                  }
                >
                  <option>
                    Architect
                  </option>

                  <option>
                    Project Architect
                  </option>

                  <option>
                    Client Representative
                  </option>

                  <option>
                    Interior Designer
                  </option>

                  <option>
                    Main Contractor
                  </option>

                  <option>
                    Consultant
                  </option>

                  <option>
                    Material Supplier
                  </option>
                </select>
              </Field>
            </div>

            <Field label="Update / Message">
              <textarea
                value={
                  form.update_text
                }
                onChange={(event) =>
                  updateForm(
                    "update_text",
                    event.target
                      .value
                  )
                }
                placeholder="Paste an email, WhatsApp message, site update or revision note..."
                rows={10}
              />
            </Field>

            <div className="demo-hint">
              <div className="demo-hint-icon">
                <Zap size={15} />
              </div>

              <div>
                <strong>
                  Demo scenario
                </strong>

                <span>
                  The current message contains a design
                  change plus a downstream construction risk.
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="primary-button full"
              disabled={
                isAnalyzing
              }
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw
                    size={17}
                    className="spin"
                  />
                  Running coordination analysis...
                </>
              ) : (
                <>
                  Run AI Change Analysis
                  <ArrowRight
                    size={17}
                  />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="panel analysis-output-panel">
          <div className="panel-header">
            <div>
              <div className="panel-eyebrow">
                STEP 02–04 · UNDERSTAND → DECIDE → ACT
              </div>

              <h3>
                Impact analysis
              </h3>
            </div>
          </div>

          {!analysis &&
            !isAnalyzing && (
              <div className="empty-analysis">
                <div className="empty-icon">
                  <Bot size={28} />
                </div>

                <h4>
                  Waiting for a project update
                </h4>

                <p>
                  Submit the message on the left. The workflow
                  will identify the change, assess impact and
                  produce an actionable coordination response.
                </p>

                <div className="empty-steps">
                  <span>
                    1 · Detect
                  </span>

                  <span>
                    2 · Assess
                  </span>

                  <span>
                    3 · Identify
                  </span>

                  <span>
                    4 · Act
                  </span>
                </div>
              </div>
            )}

          {isAnalyzing && (
            <div className="loading-analysis">
              <div className="loader-ring">
                <RefreshCw
                  size={27}
                  className="spin"
                />
              </div>

              <h4>
                AI coordination workflow running
              </h4>

              <p>
                Parsing the update and checking downstream
                impact...
              </p>
            </div>
          )}

          {analysis?.status ===
            "error" && (
            <div className="error-box">
              <AlertTriangle
                size={19}
              />

              <div>
                <strong>
                  Analysis unavailable
                </strong>

                <p>
                  {
                    analysis.error
                  }
                </p>

                <button
                  type="button"
                  className="text-button"
                  onClick={
                    onOverview
                  }
                >
                  Return to overview
                </button>
              </div>
            </div>
          )}

          {analysis?.status ===
            "Success" && (
            <AnalysisResult
              analysis={
                analysis
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AnalysisResult({
  analysis,
}) {
  return (
    <div className="analysis-result">
      <div className="analysis-success">
        <div className="success-icon">
          <CheckCircle2
            size={20}
          />
        </div>

        <div>
          <div className="success-title">
            Change intelligence generated
          </div>

          <div className="success-ref">
            {
              analysis.activity_ref
            }
          </div>
        </div>

        <span
          className={`risk-badge risk-${String(
            analysis.impact_level
          ).toLowerCase()}`}
        >
          {
            analysis.impact_level
          }{" "}
          impact
        </span>
      </div>

      <div className="analysis-summary">
        <div className="analysis-label">
          Detected change
        </div>

        <h4>
          {
            analysis.change_title
          }
        </h4>

        <p>
          {
            analysis.change_summary
          }
        </p>
      </div>

      <div className="result-grid">
        <ResultBlock
          title="What changed?"
          icon={
            <RefreshCw
              size={17}
            />
          }
        >
          <p>
            {
              analysis.detected_change
            }
          </p>
        </ResultBlock>

        <ResultBlock
          title="Why it matters"
          icon={
            <AlertTriangle
              size={17}
            />
          }
        >
          <p>
            {
              analysis.impact_reason
            }
          </p>
        </ResultBlock>
      </div>

      <div className="result-section">
        <div className="result-section-title">
          <Users size={17} />
          Affected stakeholders
        </div>

        <div className="affected-list">
          {(
            analysis.affected_stakeholders ||
            []
          ).map((person) => (
            <div
              className="affected-row"
              key={`${person.role}-${person.name}`}
            >
              <div className="affected-avatar">
                {
                  person.initials
                }
              </div>

              <div className="affected-info">
                <strong>
                  {
                    person.name
                  }
                </strong>

                <span>
                  {
                    person.role
                  }
                </span>
              </div>

              <span className="affected-reason">
                {
                  person.reason
                }
              </span>
            </div>
          ))}
        </div>
      </div>

      <ActionTracker
        activityRef={
          analysis.activity_ref
        }
        initialActions={
          analysis.actions || []
        }
      />

      <div className="ai-explanation">
        <div className="ai-explanation-icon">
          <Bot size={18} />
        </div>

        <div>
          <div className="analysis-label">
            Coordination recommendation
          </div>

          <p>
            {analysis.next_step}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResultBlock({
  title,
  icon,
  children,
}) {
  return (
    <div className="result-block">
      <div className="result-block-title">
        {icon}
        {title}
      </div>

      {children}
    </div>
  );
}

function Field({
  label,
  children,
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="section-intro">
      <div className="panel-eyebrow">
        {eyebrow}
      </div>

      <h2>{title}</h2>

      <p>{description}</p>
    </div>
  );
}

function formatActivityTime(
  timestamp
) {
  if (!timestamp) {
    return "Recent";
  }

  const date =
    new Date(timestamp);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Recent";
  }

  const diffMs =
    Date.now() -
    date.getTime();

  const diffMinutes = Math.max(
    0,
    Math.floor(
      diffMs / 60000
    )
  );

  if (
    diffMinutes < 1
  ) {
    return "Just now";
  }

  if (
    diffMinutes < 60
  ) {
    return `${diffMinutes} min ago`;
  }

  const hours = Math.floor(
    diffMinutes / 60
  );

  if (hours < 24) {
    return `${hours} hr${
      hours === 1
        ? ""
        : "s"
    } ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  return `${days} day${
    days === 1 ? "" : "s"
  } ago`;
}

function liveMetricNote(
  totalActions
) {
  if (totalActions === 0) {
    return "No coordination actions yet";
  }

  return `${totalActions} persisted in coordination database`;
}

export default App;

