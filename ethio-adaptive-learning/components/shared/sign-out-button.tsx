"use client"

import { useState } from "react"
import { LogOut, AlertCircle, X } from "lucide-react"
import { signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"

export function SignOutButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogoutClick = () => {
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    await signOut({ callbackUrl: "/login" })
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleLogoutClick}
        className="gap-2 transition-all duration-200 hover:scale-105 active:scale-95 px-2 md:px-3"
        title="Sign out of your account"
      >
        <LogOut className="size-4" />
        <span className="hidden md:inline">Sign out</span>
      </Button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 max-w-sm mx-4 animate-in fade-in-50 zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700">
            {/* Close button */}
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full">
                <AlertCircle className="size-6 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Header */}
            <h2 className="text-xl font-bold text-foreground mb-3 text-center">Sign Out?</h2>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 text-center">
              You will be logged out of your account and redirected to the login page.
            </p>

            {/* Action buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
                className="px-6 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirm}
                disabled={isLoading}
                className="px-6 gap-2 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut className="size-4" />
                    Sign Out
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
