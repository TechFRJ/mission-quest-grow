import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Mobile-first modal shell:
 * - Mobile: full-screen (100vh), header + body scroll + fixed footer
 * - Desktop: centered card with max height 90vh
 */
export function ModalShell({ title, onClose, children, footer, className }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-foreground/20 backdrop-blur-sm sm:items-center">
      {/* Panel */}
      <div
        className={cn(
          "w-full bg-card shadow-elevated flex flex-col",
          // Mobile: full screen
          "h-[100vh] rounded-none",
          // Desktop: centered card
          "sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl",
          className,
        )}
      >
        {/* Header (fixed) */}
        <div className="flex-shrink-0 border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
            <X className="w-5 h-5" />
            <span className="sr-only">Fechar</span>
          </button>
        </div>

        {/* Body (scroll) */}
        <div className="flex-1 overflow-y-auto p-4 modal-body-safe">
          {children}
        </div>

        {/* Footer (fixed) */}
        {footer ? (
          <div className="flex-shrink-0 border-t border-border bg-card p-4 modal-footer-safe">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
