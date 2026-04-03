"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  /** If set, user must type this string to enable the confirm button */
  requireText?: string;
  destructive?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  requireText,
  destructive = false,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");

  const canConfirm = requireText ? typed === requireText : true;

  function handleConfirm() {
    if (!canConfirm) return;
    setTyped("");
    onConfirm();
  }

  function handleClose() {
    setTyped("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <p className="mt-2" style={{ color: "var(--text-1)" }}>{message}</p>
      {requireText && (
        <div className="mt-3">
          <label htmlFor="confirm-input" className="subtle-label">
            Type <strong style={{ color: "var(--text-0)" }}>{requireText}</strong> to confirm
          </label>
          <input
            id="confirm-input"
            type="text"
            className="compact-select mt-1"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            style={{ width: "100%" }}
          />
        </div>
      )}
      <div className="flex justify-between items-center mt-4">
        <button type="button" className="ghost-btn" onClick={handleClose}>
          Cancel
        </button>
        <button
          type="button"
          className={destructive ? "danger-btn ghost-btn" : "ghost-btn"}
          onClick={handleConfirm}
          disabled={!canConfirm}
          style={destructive ? { borderColor: "color-mix(in srgb, var(--danger), transparent 30%)" } : undefined}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
