"use client"

import { useState } from "react"
import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateInvoicePdf } from "@/lib/invoice"
import type { OrderHistoryItem } from "@/hooks/use-order-history"

export function InvoiceButton({ order }: { order: OrderHistoryItem }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const bytes = await generateInvoicePdf(order) // uses "Tk" labels in lib/invoice to avoid WinAnsi issues
      const blob = new Blob([bytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invoice-${order.order_id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Invoice download failed:", err)
      alert("Could not generate invoice. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading} className="h-8 bg-transparent">
      <FileDown className="mr-2 h-4 w-4" />
      {downloading ? "Generating..." : "Invoice"}
    </Button>
  )
}
