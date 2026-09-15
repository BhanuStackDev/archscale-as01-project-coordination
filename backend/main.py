import os
import random
import sqlite3
from datetime import datetime, timezone
from typing import Optional, TypedDict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from langgraph.graph import END, StateGraph

    LANGGRAPH_AVAILABLE = True
except Exception:
    LANGGRAPH_AVAILABLE = False


app = FastAPI(
    title="ArchScale AS-01 Coordination Intelligence",
    version="1.1.0",
    description=(
        "AI-assisted project coordination workflow for "
        "stakeholder, activity, change-impact and approval management."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "archscale_coordination.db",
)


STAKEHOLDERS = [
    {
        "id": 1,
        "name": "Aarav Mehta",
        "role": "Project Architect",
        "company": "ArchScale Studio",
        "initials": "AM",
    },
    {
        "id": 2,
        "name": "Neha Kapoor",
        "role": "Interior Designer",
        "company": "ArchScale Studio",
        "initials": "NK",
    },
    {
        "id": 3,
        "name": "Rohan Shah",
        "role": "Client Representative",
        "company": "Riverside Holdings",
        "initials": "RS",
    },
    {
        "id": 4,
        "name": "Vikram Patel",
        "role": "Main Contractor",
        "company": "Patel BuildWorks",
        "initials": "VP",
    },
    {
        "id": 5,
        "name": "Isha Verma",
        "role": "Electrical Consultant",
        "company": "VoltEdge Consultants",
        "initials": "IV",
    },
    {
        "id": 6,
        "name": "Kunal Jain",
        "role": "Material Supplier",
        "company": "StoneCraft Materials",
        "initials": "KJ",
    },
]


def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    conn = get_connection()

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS project_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            activity_ref TEXT UNIQUE NOT NULL,
            project_name TEXT NOT NULL,
            source TEXT NOT NULL,
            actor TEXT NOT NULL,
            update_text TEXT NOT NULL,
            change_title TEXT,
            change_type TEXT,
            change_summary TEXT,
            impact_level TEXT,
            impact_reason TEXT,
            affected_stakeholders TEXT,
            recommended_actions TEXT,
            next_step TEXT,
            created_at TEXT NOT NULL
        )
        """
    )

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS coordination_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action_ref TEXT UNIQUE NOT NULL,
            activity_ref TEXT NOT NULL,
            project_name TEXT NOT NULL,
            action_text TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            owner_role TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending',
            approval_status TEXT NOT NULL DEFAULT 'Pending',
            acknowledged INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )

    conn.commit()
    conn.close()


init_database()


class ChangeInput(BaseModel):
    project_name: str = Field(min_length=2)
    source: str = Field(min_length=2)
    actor: str = Field(min_length=2)
    update_text: str = Field(min_length=8)


class ActionUpdate(BaseModel):
    status: Optional[str] = None
    approval_status: Optional[str] = None
    acknowledged: Optional[bool] = None


class CoordinationState(TypedDict, total=False):
    project_name: str
    source: str
    actor: str
    update_text: str
    change_title: str
    change_type: str
    change_summary: str
    detected_change: str
    impact_level: str
    impact_reason: str
    affected_stakeholders: list
    recommended_actions: list
    next_step: str


def detect_change_node(state: CoordinationState):
    text = state["update_text"].lower()

    change_signals = []

    if any(
        phrase in text
        for phrase in [
            "approved",
            "approval",
            "requested",
            "revision",
            "change",
            "rev ",
            "revised",
            "larger",
            "smaller",
            "layout",
        ]
    ):
        change_signals.append("design_or_scope_change")

    if any(
        phrase in text
        for phrase in [
            "contractor",
            "framing",
            "construction",
            "site",
            "started",
            "work started",
        ]
    ):
        change_signals.append("execution_dependency")

    if any(
        phrase in text
        for phrase in [
            "supplier",
            "unavailable",
            "material",
            "marble",
            "shade",
        ]
    ):
        change_signals.append("material_dependency")

    if "rev 04" in text and (
        "rev 05" in text
        or "revision" in text
        or "revised" in text
    ):
        change_signals.append("drawing_revision")

    if len(change_signals) >= 2:
        change_type = "Cross-discipline change"
        title = "Design update requires downstream coordination"
    elif "material_dependency" in change_signals:
        change_type = "Material change"
        title = "Material availability change detected"
    elif "drawing_revision" in change_signals:
        change_type = "Drawing revision"
        title = "Drawing revision requires coordination"
    else:
        change_type = "Project update"
        title = "Potential coordination change detected"

    summary = (
        "The update contains a meaningful project decision or "
        "revision that can affect work owned by other stakeholders."
    )

    return {
        **state,
        "change_title": title,
        "change_type": change_type,
        "change_summary": summary,
        "detected_change": (
            "The coordination engine detected the following "
            f"signals: "
            f"{', '.join(change_signals) if change_signals else 'general project change'}."
        ),
    }


def impact_analysis_node(state: CoordinationState):
    text = state["update_text"].lower()

    impact_score = 1

    if any(
        phrase in text
        for phrase in [
            "contractor",
            "construction",
            "framing",
            "started",
            "site",
            "rev 04",
            "rev 05",
        ]
    ):
        impact_score += 2

    if any(
        phrase in text
        for phrase in [
            "approved",
            "requested",
            "larger",
            "smaller",
            "change",
            "revision",
            "layout",
        ]
    ):
        impact_score += 1

    if any(
        phrase in text
        for phrase in [
            "unavailable",
            "urgent",
            "delay",
            "already started",
            "cannot",
        ]
    ):
        impact_score += 2

    if impact_score >= 5:
        impact_level = "Critical"
    elif impact_score >= 3:
        impact_level = "High"
    else:
        impact_level = "Medium"

    reasons = []

    if "contractor" in text or "framing" in text:
        reasons.append(
            "Execution may already be proceeding against an older decision."
        )

    if "rev 04" in text or "rev 05" in text:
        reasons.append(
            "A drawing version mismatch can create rework or incorrect execution."
        )

    if "approved" in text or "requested" in text:
        reasons.append(
            "A client decision can create downstream design and coordination work."
        )

    if not reasons:
        reasons.append(
            "The update requires confirmation of ownership and downstream impact."
        )

    return {
        **state,
        "impact_level": impact_level,
        "impact_reason": " ".join(reasons),
    }


def stakeholder_and_action_node(
    state: CoordinationState,
):
    text = state["update_text"].lower()

    affected = []

    def add_person(person_id: int, reason: str):
        person = next(
            item
            for item in STAKEHOLDERS
            if item["id"] == person_id
        )

        affected.append(
            {
                "name": person["name"],
                "role": person["role"],
                "initials": person["initials"],
                "reason": reason,
            }
        )

    add_person(
        1,
        "Owns the design decision and coordination response.",
    )

    if any(
        phrase in text
        for phrase in [
            "master bathroom",
            "living room",
            "layout",
            "interior",
        ]
    ):
        add_person(
            2,
            "Needs to update interior coordination and affected layouts.",
        )

    if any(
        phrase in text
        for phrase in [
            "contractor",
            "framing",
            "construction",
            "site",
            "started",
        ]
    ):
        add_person(
            4,
            "Must confirm whether site work is based on the latest decision.",
        )

    if any(
        phrase in text
        for phrase in [
            "electrical",
            "lighting",
            "power",
        ]
    ):
        add_person(
            5,
            "Needs to review downstream services affected by the revision.",
        )

    if any(
        phrase in text
        for phrase in [
            "supplier",
            "material",
            "marble",
            "shade",
            "unavailable",
        ]
    ):
        add_person(
            6,
            "Needs to confirm availability or alternative material.",
        )

    if (
        "approved" in text
        or "requested" in text
        or "client" in text
    ):
        add_person(
            3,
            "Client representative should confirm the final decision record.",
        )

    unique = {}

    for person in affected:
        unique[person["name"]] = person

    affected = list(unique.values())

    actions = [
        "Create a coordination task linked to this project change.",
        "Confirm the latest drawing or decision version before execution continues.",
        "Notify all affected stakeholders and record acknowledgement.",
    ]

    if (
        "contractor" in text
        or "framing" in text
    ):
        actions.insert(
            1,
            "Pause or verify any site work that may be based on the superseded decision.",
        )

    if (
        "supplier" in text
        or "unavailable" in text
    ):
        actions.append(
            "Request an approved material alternative and record client/design sign-off."
        )

    if state["impact_level"] == "Critical":
        next_step = (
            "Escalate this change as a critical coordination item, "
            "verify the current revision immediately and close the affected "
            "approval/action loop before dependent work proceeds."
        )
    else:
        next_step = (
            "Notify affected stakeholders, verify the current revision and "
            "assign the coordination actions to named owners."
        )

    return {
        **state,
        "affected_stakeholders": affected,
        "recommended_actions": actions,
        "next_step": next_step,
    }


def build_workflow():
    if not LANGGRAPH_AVAILABLE:
        return None

    graph = StateGraph(CoordinationState)

    graph.add_node(
        "detect_change",
        detect_change_node,
    )

    graph.add_node(
        "impact_analysis",
        impact_analysis_node,
    )

    graph.add_node(
        "stakeholder_and_action",
        stakeholder_and_action_node,
    )

    graph.set_entry_point("detect_change")

    graph.add_edge(
        "detect_change",
        "impact_analysis",
    )

    graph.add_edge(
        "impact_analysis",
        "stakeholder_and_action",
    )

    graph.add_edge(
        "stakeholder_and_action",
        END,
    )

    return graph.compile()


workflow = build_workflow()


def run_coordination_workflow(
    payload: ChangeInput,
):
    state: CoordinationState = {
        "project_name": payload.project_name,
        "source": payload.source,
        "actor": payload.actor,
        "update_text": payload.update_text,
    }

    if workflow is not None:
        return workflow.invoke(state)

    state = detect_change_node(state)
    state = impact_analysis_node(state)
    state = stakeholder_and_action_node(state)

    return state


def choose_action_owner(
    action_text: str,
    index: int,
    affected: list,
):
    text = action_text.lower()

    if (
        "site" in text
        or "contractor" in text
        or "execution" in text
    ):
        person = next(
            (
                item
                for item in STAKEHOLDERS
                if item["role"] == "Main Contractor"
                and any(
                    item["name"] == affected_person["name"]
                    for affected_person in affected
                )
            ),
            None,
        )

        if person:
            return person

    if (
        "client" in text
        or "sign-off" in text
        or "approval" in text
    ):
        person = next(
            (
                item
                for item in STAKEHOLDERS
                if item["role"] == "Client Representative"
                and any(
                    item["name"] == affected_person["name"]
                    for affected_person in affected
                )
            ),
            None,
        )

        if person:
            return person

    if (
        "interior" in text
        or "layout" in text
    ):
        person = next(
            (
                item
                for item in STAKEHOLDERS
                if item["role"] == "Interior Designer"
                and any(
                    item["name"] == affected_person["name"]
                    for affected_person in affected
                )
            ),
            None,
        )

        if person:
            return person

    if affected:
        return affected[
            min(index, len(affected) - 1)
        ]

    return {
        "name": "Aarav Mehta",
        "role": "Project Architect",
    }


@app.get("/")
def root():
    return {
        "service": "ArchScale AS-01 Coordination Intelligence",
        "status": "online",
        "langgraph_available": LANGGRAPH_AVAILABLE,
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "langgraph_available": LANGGRAPH_AVAILABLE,
        "database": DB_FILE,
    }


@app.get("/api/stakeholders")
def get_stakeholders():
    return {
        "items": STAKEHOLDERS,
        "total": len(STAKEHOLDERS),
    }


@app.get("/api/activities")
def get_activities():
    conn = get_connection()

    rows = conn.execute(
        """
        SELECT
            activity_ref,
            project_name,
            source,
            actor,
            change_title,
            change_type,
            change_summary,
            impact_level,
            created_at
        FROM project_activities
        ORDER BY id DESC
        LIMIT 100
        """
    ).fetchall()

    conn.close()

    return {
        "items": [
            dict(row)
            for row in rows
        ],
        "total": len(rows),
    }


@app.get("/api/actions")
def get_actions(
    activity_ref: Optional[str] = None,
):
    conn = get_connection()

    if activity_ref:
        rows = conn.execute(
            """
            SELECT *
            FROM coordination_actions
            WHERE activity_ref = ?
            ORDER BY id ASC
            """,
            (activity_ref,),
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT *
            FROM coordination_actions
            ORDER BY id DESC
            LIMIT 100
            """
        ).fetchall()

    conn.close()

    items = []

    for row in rows:
        item = dict(row)
        item["acknowledged"] = bool(
            item["acknowledged"]
        )
        items.append(item)

    return {
        "items": items,
        "total": len(items),
    }


@app.post("/api/analyze-change")
def analyze_change(
    data: ChangeInput,
):
    try:
        result = run_coordination_workflow(data)

        activity_ref = (
            f"ACT-2026-"
            f"{random.randint(1000, 9999)}"
        )

        created_at = datetime.now(
            timezone.utc
        ).isoformat()

        conn = get_connection()

        conn.execute(
            """
            INSERT INTO project_activities (
                activity_ref,
                project_name,
                source,
                actor,
                update_text,
                change_title,
                change_type,
                change_summary,
                impact_level,
                impact_reason,
                affected_stakeholders,
                recommended_actions,
                next_step,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                activity_ref,
                data.project_name,
                data.source,
                data.actor,
                data.update_text,
                result["change_title"],
                result["change_type"],
                result["change_summary"],
                result["impact_level"],
                result["impact_reason"],
                str(
                    result["affected_stakeholders"]
                ),
                str(
                    result["recommended_actions"]
                ),
                result["next_step"],
                created_at,
            ),
        )

        actions_response = []

        for index, action_text in enumerate(
            result["recommended_actions"]
        ):
            owner = choose_action_owner(
                action_text,
                index,
                result["affected_stakeholders"],
            )

            action_ref = (
                f"ACTN-2026-"
                f"{random.randint(10000, 99999)}"
            )

            cursor = conn.execute(
                """
                INSERT INTO coordination_actions (
                    action_ref,
                    activity_ref,
                    project_name,
                    action_text,
                    owner_name,
                    owner_role,
                    status,
                    approval_status,
                    acknowledged,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    action_ref,
                    activity_ref,
                    data.project_name,
                    action_text,
                    owner["name"],
                    owner["role"],
                    "Pending",
                    "Pending",
                    0,
                    created_at,
                    created_at,
                ),
            )

            action_id = cursor.lastrowid

            actions_response.append(
                {
                    "id": action_id,
                    "action_ref": action_ref,
                    "activity_ref": activity_ref,
                    "project_name": data.project_name,
                    "action_text": action_text,
                    "owner_name": owner["name"],
                    "owner_role": owner["role"],
                    "status": "Pending",
                    "approval_status": "Pending",
                    "acknowledged": False,
                    "created_at": created_at,
                    "updated_at": created_at,
                }
            )

        conn.commit()
        conn.close()

        return {
            "status": "Success",
            "activity_ref": activity_ref,
            "project_name": data.project_name,
            "source": data.source,
            "actor": data.actor,
            "change_title": result["change_title"],
            "change_type": result["change_type"],
            "change_summary": result["change_summary"],
            "detected_change": result["detected_change"],
            "impact_level": result["impact_level"],
            "impact_reason": result["impact_reason"],
            "affected_stakeholders": result[
                "affected_stakeholders"
            ],
            "recommended_actions": result[
                "recommended_actions"
            ],
            "actions": actions_response,
            "next_step": result["next_step"],
            "created_at": created_at,
            "workflow": (
                "LangGraph"
                if workflow is not None
                else "Fallback coordination workflow"
            ),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


@app.patch("/api/actions/{action_id}")
def update_action(
    action_id: int,
    data: ActionUpdate,
):
    allowed_statuses = {
        "Pending",
        "In Progress",
        "Resolved",
        "Blocked",
    }

    allowed_approval = {
        "Pending",
        "Approved",
        "Rejected",
    }

    if (
        data.status is not None
        and data.status not in allowed_statuses
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid action status",
        )

    if (
        data.approval_status is not None
        and data.approval_status not in allowed_approval
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid approval status",
        )

    conn = get_connection()

    row = conn.execute(
        """
        SELECT *
        FROM coordination_actions
        WHERE id = ?
        """,
        (action_id,),
    ).fetchone()

    if row is None:
        conn.close()

        raise HTTPException(
            status_code=404,
            detail="Action not found",
        )

    current_status = row["status"]
    current_approval = row[
        "approval_status"
    ]
    current_acknowledged = bool(
        row["acknowledged"]
    )

    new_status = (
        data.status
        if data.status is not None
        else current_status
    )

    new_approval = (
        data.approval_status
        if data.approval_status is not None
        else current_approval
    )

    new_acknowledged = (
        data.acknowledged
        if data.acknowledged is not None
        else current_acknowledged
    )

    if new_approval == "Rejected":
        new_status = "Blocked"

    if (
        new_approval == "Approved"
        and new_status == "Pending"
    ):
        new_status = "In Progress"

    updated_at = datetime.now(
        timezone.utc
    ).isoformat()

    conn.execute(
        """
        UPDATE coordination_actions
        SET
            status = ?,
            approval_status = ?,
            acknowledged = ?,
            updated_at = ?
        WHERE id = ?
        """,
        (
            new_status,
            new_approval,
            int(new_acknowledged),
            updated_at,
            action_id,
        ),
    )

    conn.commit()

    updated = conn.execute(
        """
        SELECT *
        FROM coordination_actions
        WHERE id = ?
        """,
        (action_id,),
    ).fetchone()

    conn.close()

    result = dict(updated)
    result["acknowledged"] = bool(
        result["acknowledged"]
    )

    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )

