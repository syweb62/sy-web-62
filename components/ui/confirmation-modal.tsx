"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Check, X } from "lucide-react"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: "confirm" | "cancel" | "warning"
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  type = "confirm",
}: ConfirmationModalProps) => {
  if (!isOpen) return null

  const getTypeConfig = () => {
    switch (type) {
      case "confirm":
        return {
          icon: <Check className="w-6 h-6 text-green-400" />,
          confirmButtonClass: "bg-green-600 hover:bg-green-700 text-white",
          iconBgClass: "bg-green-600/20",
        }
      case "cancel":
        return {
          icon: <X className="w-6 h-6 text-red-400" />,
          confirmButtonClass: "bg-red-600 hover:bg-red-700 text-white",
          iconBgClass: "bg-red-600/20",
        }
      case "warning":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
          confirmButtonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
          iconBgClass: "bg-yellow-600/20",
        }
    }
  }

  const config = getTypeConfig()

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <Card className="relative bg-gray-900 border-gray-700 shadow-2xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <CardHeader className="text-center pb-4">
          <div className={`w-16 h-16 rounded-full ${config.iconBgClass} flex items-center justify-center mx-auto mb-4`}>
            {config.icon}
          </div>
          <CardTitle className="text-xl font-semibold text-white">{title}</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <p className="text-gray-300 text-base leading-relaxed">{message}</p>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6 py-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
            >
              {cancelText}
            </Button>
            <Button onClick={handleConfirm} className={`px-6 py-2 ${config.confirmButtonClass}`}>
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
