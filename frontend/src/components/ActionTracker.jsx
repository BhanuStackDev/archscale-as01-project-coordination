import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  UserCheck,
  XCircle,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const STATUS_STYLES = {
  Pending: "action-status action-status-pending",
  "In Progress": "action-status action-status-progress",
  Resolved: "action-status action-status-resolved",
  Blocked: "action-status action-status-blocked",
};

export default function ActionTracker({
  activityRef,
  initialActions = [],
}) {
  const [actions, setActions] = useState(initialActions);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setActions(initialActions);
    setMessage("");
  }, [initialActions, activityRef]);

  const updateAction = async (actionId, payload, successMessage) => {
    setBusyId(actionId);
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE}/api/actions/${actionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to update action"
        );
      }

      setActions((current) =>
        current.map((action) =>
          action.id === actionId ? data : action
        )
      );

      setMessage(successMessage);
    } catch (error) {
      setMessage(
        error.message || "Action update failed"
      );
    } finally {
      setBusyId(null);
    }
  };

  const completed = actions.filter(
    (action) => action.status === "Resolved"
  ).length;

  const approved = actions.filter(
    (action) => action.approval_status === "Approved"
  ).length;

  return (
    <div className="action-tracker">
      <div className="action-tracker-header">
        <div>
          <div className="result-section-title">
            <ShieldCheck size={17} />
            Action & approval tracking
          </div>

          <div className="action-tracker-subtitle">
            Coordination loop for {activityRef}
          </div>
        </div>

        <div className="action-progress">
          <span>{completed}/{actions.length} resolved</span>
          <span>{approved}/{actions.length} approved</span>
        </div>
      </div>

      {message && (
        <div className="action-message">
          <CheckCircle2 size={14} />
          {message}
        </div>
      )}

      <div className="tracked-actions">
        {actions.map((action, index) => {
          const isBusy = busyId === action.id;

          return (
            <div
              className="tracked-action"
              key={action.id}
            >
              <div className="tracked-action-number">
                {index + 1}
              </div>

              <div className="tracked-action-main">
                <div className="tracked-action-title">
                  {action.action_text}
                </div>

                <div className="tracked-action-meta">
                  <span>
                    Owner: {action.owner_name}
                  </span>

                  <span>
                    {action.owner_role}
                  </span>

                  <span>
                    {action.action_ref}
                  </span>
                </div>

                <div className="tracked-action-badges">
                  <span
                    className={
                      STATUS_STYLES[action.status] ||
                      "action-status"
                    }
                  >
                    {action.status}
                  </span>

                  <span
                    className={`approval-status ${
                      action.approval_status ===
                      "Approved"
                        ? "approval-approved"
                        : action.approval_status ===
                          "Rejected"
                        ? "approval-rejected"
                        : "approval-pending"
                    }`}
                  >
                    Approval: {action.approval_status}
                  </span>

                  {action.acknowledged && (
                    <span className="approval-status approval-ack">
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>

              <div className="tracked-action-buttons">
                {!action.acknowledged && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      updateAction(
                        action.id,
                        {
                          acknowledged: true,
                          status: "In Progress",
                        },
                        "Stakeholder acknowledgement recorded."
                      )
                    }
                    className="action-button"
                  >
                    <UserCheck size={14} />
                    Acknowledge
                  </button>
                )}

                {action.approval_status ===
                  "Pending" &&
                  action.status !== "Blocked" && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          updateAction(
                            action.id,
                            {
                              approval_status:
                                "Approved",
                              status:
                                "In Progress",
                            },
                            "Action approved and moved to execution."
                          )
                        }
                        className="action-button action-button-approve"
                      >
                        <CheckCircle2 size={14} />
                        Approve
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          updateAction(
                            action.id,
                            {
                              approval_status:
                                "Rejected",
                              status: "Blocked",
                            },
                            "Action rejected and marked blocked."
                          )
                        }
                        className="action-button action-button-reject"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </>
                  )}

                {action.status === "In Progress" &&
                  action.approval_status !==
                    "Rejected" && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        updateAction(
                          action.id,
                          {
                            status: "Resolved",
                          },
                          "Action resolved successfully."
                        )
                      }
                      className="action-button action-button-resolve"
                    >
                      <CheckCircle2 size={14} />
                      Resolve
                    </button>
                  )}

                {action.status === "Blocked" && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      updateAction(
                        action.id,
                        {
                          approval_status:
                            "Pending",
                          status: "Pending",
                        },
                        "Action returned to approval queue."
                      )
                    }
                    className="action-button"
                  >
                    <RotateCcw size={14} />
                    Re-open
                  </button>
                )}

                {isBusy && (
                  <Clock3
                    size={14}
                    className="action-busy"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}