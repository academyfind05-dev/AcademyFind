"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface AdminDeleteButtonProps {
    id: string;
    onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
    title?: string;
}

export default function AdminDeleteButton({ id, onDelete, title = "Delete Item?" }: AdminDeleteButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const executeDelete = async () => {
        setIsLoading(true);
        setIsOpen(false);
        try {
            const res = await onDelete(id);
            if (res.success) {
                toast.success("Deleted successfully");
            } else {
                toast.error(res.error || "Failed to delete");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                disabled={isLoading}
                title={title}
                className="p-2 bg-white border border-red-200 rounded-xl text-red-500 hover:text-red-700 hover:border-red-300 hover:bg-red-50 transition-all shadow-xs cursor-pointer ml-2 disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
            
            <ConfirmModal 
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onConfirm={executeDelete}
                title={title}
                destructive={true}
            />
        </>
    );
}
