import React, { useEffect } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (type === "success" || type === "info") {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [type, onClose, duration]);

  const getStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border border-green-200 rounded-lg shadow-lg";
      case "error":
        return "bg-red-50 border border-red-200 rounded-lg shadow-lg";
      case "warning":
        return "bg-amber-50 border border-amber-200 rounded-lg shadow-lg";
      case "info":
        return "bg-blue-50 border border-blue-200 rounded-lg shadow-lg";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg
            className="w-5 h-5 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-5 h-5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="w-5 h-5 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "info":
        return (
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "success":
        return "text-green-700";
      case "error":
        return "text-red-700";
      case "warning":
        return "text-yellow-700";
      case "info":
        return "text-blue-700";
    }
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 p-5 max-w-sm shadow-2xl ${getStyles()}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 pt-0.5">{getIcon()}</div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${getTextColor()}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ml-4 transition-colors cursor-pointer ${
            type === "success"
              ? "text-green-400 hover:text-green-600"
              : type === "error"
                ? "text-red-400 hover:text-red-600"
                : type === "warning"
                  ? "text-amber-400 hover:text-amber-600"
                  : "text-blue-400 hover:text-blue-600"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
