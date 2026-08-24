"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  destructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  destructive = false,
}: ConfirmModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <AlertDialogContent className="bg-white border-stone-200">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-stone-900">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-stone-500 font-medium">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel 
            disabled={loading} 
            className="border-stone-200 text-stone-700 hover:bg-stone-50 font-bold"
          >
            {cancelText}
          </AlertDialogCancel>
          <button
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold h-9 px-4 py-2 transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
              destructive 
                ? "bg-rose-600 hover:bg-rose-700 text-white" 
                : "bg-amber-500 hover:bg-amber-600 text-white"
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {confirmText}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
