"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  const triggerRef = useRef<Element | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Capture the element that had focus when the modal opens
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
    }
  }, [open]);

  // Inert + scroll lock + focus management
  useEffect(() => {
    if (!open) return;

    const appShell = document.querySelector(".app-shell");
    const prevOverflow = document.body.style.overflow;

    if (appShell) appShell.setAttribute("inert", "");
    document.body.style.overflow = "hidden";

    // Move focus into the modal
    dialogRef.current?.focus();

    return () => {
      if (appShell) appShell.removeAttribute("inert");
      document.body.style.overflow = prevOverflow;

      // Restore focus to trigger element
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const titleId = "modal-title";

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal-panel surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id={titleId} className="modal-title">{title}</h2>
          <button
            className="ghost-btn modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
