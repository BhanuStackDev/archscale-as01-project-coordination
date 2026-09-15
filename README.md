# ArchScale Coordination Intelligence — AS-01

## AI-Powered Project Coordination & Change Impact Management

ArchScale Coordination Intelligence is an AI-assisted project coordination platform designed for architecture and design studios.

It transforms fragmented project updates from channels such as WhatsApp, email, site updates, meeting notes and drawing revisions into structured coordination intelligence.

The system identifies meaningful project changes, evaluates their impact, identifies affected stakeholders and converts the result into trackable actions and approvals.

---

## Problem

Architecture and design projects involve many stakeholders, handoffs and continuously changing decisions.

Important project information can become fragmented across:

* WhatsApp conversations
* Email threads
* Site updates
* Meeting notes
* Drawing revisions
* Client decisions
* Consultant and contractor communications

The core problem is not a lack of information.

The problem is that teams often do not know:

**What changed?**

**Who is affected?**

**What is the impact?**

**Who needs to act?**

**Which approval is still pending?**

**Has the coordination loop actually been closed?**

ArchScale Coordination Intelligence addresses this gap with an AI-assisted coordination workflow.

---

## Solution

The platform provides a single coordination workspace where project teams can:

1. Capture an unstructured project update.
2. Detect meaningful project changes.
3. Analyse downstream impact.
4. Identify affected stakeholders.
5. Generate recommended coordination actions.
6. Assign action ownership.
7. Track acknowledgement and approval.
8. Resolve or reopen actions.
9. Persist coordination activity.
10. Monitor coordination metrics from the dashboard.

---

# Core Workflow

```text
Unstructured Project Update
           ↓
   Change Detection
           ↓
    Impact Analysis
           ↓
Affected Stakeholders
           ↓
 Recommended Actions
           ↓
   Owner Assignment
           ↓
 Acknowledgement
           ↓
   Approve / Reject
           ↓
      Resolve
           ↓
 Persistent Coordination Record
```

---

# Key Features

## Project Coordination Dashboard

The Overview workspace provides a central view of:

* Active projects
* Stakeholders
* Open changes
* Pending approvals
* Resolved actions
* In-progress actions
* Blocked actions
* Total tracked coordination actions

Dashboard metrics are connected to the coordination database.

---

## Project Workspace

Projects include coordination-relevant information such as:

* Project name
* Client
* Current project stage
* Project health
* Open changes
* Pending approvals
* Stakeholder count
* Next milestone

Example projects included in the demonstration workspace:

* Riverside Residence
* North Avenue Office
* Lakeview Boutique Hotel

---

## Activity & Change Tracking

Project activity is consolidated into a timeline.

Examples include:

* Client approvals
* Site clarifications
* Material updates
* Drawing revisions
* AI-detected project changes

Each AI-generated coordination event receives a unique activity reference.

Example:

```text
ACT-2026-8198
```

---

## Stakeholder & Role Management

The system maintains project stakeholder information including:

* Name
* Role
* Organisation
* Coordination status

Example roles:

* Project Architect
* Interior Designer
* Client Representative
* Main Contractor
* Electrical Consultant
* Material Supplier

---

# AI Change Intelligence

The primary AS-01 intervention is the **AI Change Monitor**.

A project team member can paste an update such as:

> Client approved the revised living room layout, but requested a larger master bathroom. Contractor has already started framing based on Rev 04 drawings.

The coordination workflow then evaluates the update.

### 1. Detect

The workflow identifies meaningful signals such as:

* Design or scope change
* Execution dependency
* Drawing revision
* Material dependency

### 2. Assess

The system determines an impact level:

```text
Medium
High
Critical
```

For example, a change combined with construction activity and a drawing-version mismatch can be classified as a critical coordination issue.

### 3. Identify

The workflow identifies stakeholders who may be affected.

Example:

```text
Project Architect
Interior Designer
Main Contractor
Client Representative
```

### 4. Act

The system generates coordination actions such as:

* Create a coordination task.
* Verify the latest drawing or decision version.
* Verify or pause downstream site activity.
* Notify affected stakeholders.
* Record acknowledgement.
* Obtain required approval.
* Resolve the action.

---

# Action & Approval Tracking

Every AI-generated recommendation can become a persisted coordination action.

Each action contains:

* Action reference
* Activity reference
* Project
* Action description
* Owner
* Owner role
* Status
* Approval status
* Acknowledgement state
* Created timestamp
* Updated timestamp

Supported action states include:

```text
Pending
In Progress
Resolved
Blocked
```

Approval states include:

```text
Pending
Approved
Rejected
```

The workflow supports:

```text
Pending
   ↓
Acknowledge
   ↓
Approve
   ↓
In Progress
   ↓
Resolve
```

A rejected action can become:

```text
Rejected
   ↓
Blocked
   ↓
Re-open
```

---

# AI / Workflow Architecture

The coordination intelligence layer is implemented using a LangGraph workflow.

```text
                    ┌─────────────────────┐
                    │ Project Update      │
                    │ Capture             │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Change Detection    │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Impact Analysis     │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Stakeholder &       │
                    │ Action Generation   │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Persistence Layer   │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Action & Approval   │
                    │ Tracking            │
                    └─────────────────────┘
```

The project includes a fallback coordination workflow so the core application flow can remain operational even when the optional LangGraph dependency is unavailable.

---

# Technology Stack

## Frontend

* React
* Vite
* Redux Toolkit
* Lucide React
* CSS
* Responsive UI

## Backend

* Python
* FastAPI
* Pydantic
* SQLite
* LangGraph

## Data & State

* SQLite persistence
* REST APIs
* Redux-based frontend state

---

# Backend API

## Health

```http
GET /api/health
```

Returns backend health and workflow availability.

---

## Stakeholders

```http
GET /api/stakeholders
```

Returns the current stakeholder dataset.

---

## Activities

```http
GET /api/activities
```

Returns persisted project coordination activities.

---

## Actions

```http
GET /api/actions
```

Returns persisted coordination actions.

Optional activity filtering:

```http
GET /api/actions?activity_ref=ACT-2026-8198
```

---

## Analyse Project Change

```http
POST /api/analyze-change
```

Example request:

```json
{
  "project_name": "Riverside Residence",
  "source": "WhatsApp",
  "actor": "Client Representative",
  "update_text": "Client approved the revised living room layout, but requested a larger master bathroom. Contractor has already started framing based on Rev 04 drawings."
}
```

The endpoint returns:

* Change classification
* Impact level
* Impact reasoning
* Affected stakeholders
* Recommended actions
* Persisted action records
* Coordination recommendation
* Activity reference

---

## Update Action

```http
PATCH /api/actions/{action_id}
```

Used to update:

* Action status
* Approval status
* Acknowledgement

---

# Data Persistence

The backend uses SQLite for the project demonstration.

Primary database:

```text
backend/archscale_coordination.db
```

Core tables:

```text
project_activities
coordination_actions
```

This allows project coordination events and action states to remain persisted beyond a single browser interaction.

---

# Demo Scenario

The recommended demonstration uses **Riverside Residence**.

Example update:

```text
Client approved the revised living room layout,
but requested a larger master bathroom.
Contractor has already started framing based on
Rev 04 drawings.
```

The platform identifies:

```text
Design / scope change
Execution dependency
Drawing revision
```

Impact:

```text
Critical
```

Affected stakeholders:

```text
Project Architect
Interior Designer
Main Contractor
Client Representative
```

Generated actions are then assigned and tracked through:

```text
Acknowledge
→ Approve
→ In Progress
→ Resolve
```

This demonstrates the complete coordination intervention from unstructured information to closed-loop execution.

---

# Project Structure

```text
archscale-as01-project-coordination/
│
├── backend/
│   ├── main.py
│   ├── archscale_coordination.db
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   │   └── ActionTracker.jsx
    │   ├── store/
    │   │   ├── complaintSlice.js
    │   │   └── index.js
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.css
    │   └── main.jsx
    │
    ├── public/
    ├── package.json
    └── vite.config.js
```

---

# Local Setup

## Clone

```bash
git clone https://github.com/BhanuStackDev/archscale-as01-project-coordination.git
cd archscale-as01-project-coordination
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Backend

Open another terminal:

```bash
cd backend
python main.py
```

Backend:

```text
http://127.0.0.1:8000
```

Health endpoint:

```text
http://127.0.0.1:8000/api/health
```

---

# Production Build

Frontend production build:

```bash
cd frontend
npm run build
```

The production build is generated in:

```text
frontend/dist/
```

---

# Current Status

## Completed

* Project coordination dashboard
* Project workspace
* Activity and change tracking
* Stakeholder and role management
* AI Change Monitor
* Impact assessment
* Affected stakeholder detection
* Action generation
* Owner assignment
* Action acknowledgement
* Approval / rejection
* Action resolution
* Action reopening
* SQLite persistence
* Live dashboard metrics
* Responsive frontend
* FastAPI backend
* LangGraph workflow
* Production frontend build

---

# Hackathon Context

This project was developed for the **ArchScale Guild Intern Technology Hackathon — AS-01 Coordination** challenge.

The system focuses on the central coordination problem:

> How can architecture and design teams detect meaningful project changes and ensure that the right people know, act and close the loop?

The implementation demonstrates one complete intelligent workflow rather than a collection of disconnected features.

---

# Future Scope

Potential production extensions include:

* Multi-project authentication and access control
* Real WhatsApp and email integrations
* Calendar and meeting integrations
* Document and drawing version intelligence
* Automated stakeholder notifications
* Real LLM-powered classification
* Role-based permissions
* Cloud database
* Audit trails
* Advanced analytics
* Enterprise collaboration integrations

---

# Developer

**Managed & Developed by Bhanuday Urmaliya — Full Stack Developer**

---

# Repository

GitHub:

https://github.com/BhanuStackDev/archscale-as01-project-coordination

---

# License

This project is developed as a hackathon submission and demonstration project.
