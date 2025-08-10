import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { OrderHistoryItem } from "@/hooks/use-order-history"

function money(n?: number) {
  const v = typeof n === "number" && isFinite(n) ? n : 0
  return v.toFixed(2)
}

export async function generateInvoicePdf(order: OrderHistoryItem) {
  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([595.28, 841.89]) // A4
  const { width } = page.getSize()
  const margin = 50
  const yStart = 790

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = yStart

  // Header
  page.drawText("Sushi Yaki", {
    x: margin,
    y,
    size: 20,
    font: fontBold,
    color: rgb(0.95, 0.75, 0.2),
  })
  y -= 26
  page.drawText("Invoice / Receipt", { x: margin, y, size: 14, font })
  y -= 20

  // Order info
  const infoLeft = [
    `Order ID: ${order.order_id}`,
    `Status: ${order.status}`,
    `Date: ${new Date(order.created_at).toLocaleString()}`,
  ]
  const infoRight = [
    `Customer: ${order.customer_name || "—"}`,
    `Phone: ${order.phone || "—"}`,
    `Address: ${order.address || "—"}`,
  ]

  infoLeft.forEach((t, i) => {
    page.drawText(t, { x: margin, y: y - i * 16, size: 11, font })
  })
  infoRight.forEach((t, i) => {
    const textWidth = font.widthOfTextAtSize(t, 11)
    page.drawText(t, { x: width - margin - textWidth, y: y - i * 16, size: 11, font })
  })
  y -= 60

  // Table header (use ASCII-safe "Tk" instead of "৳")
  page.drawText("Item", { x: margin, y, size: 11, font: fontBold })
  page.drawText("Qty", { x: margin + 280, y, size: 11, font: fontBold })
  page.drawText("Unit (Tk)", { x: margin + 330, y, size: 11, font: fontBold })
  page.drawText("Line (Tk)", { x: width - margin - 70, y, size: 11, font: fontBold })
  y -= 12
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    color: rgb(0.8, 0.8, 0.8),
    thickness: 1,
  })
  y -= 10

  // Items
  const items = Array.isArray(order.items) ? order.items : []
  for (const it of items) {
    const name = (it as any).item_name || "Item"
    const notes = (it as any).notes || (it as any).modifiers || (it as any).item_description || ""
    const qty = typeof (it as any).quantity === "number" ? (it as any).quantity : 1
    const unit = typeof (it as any).price_at_purchase === "number" ? (it as any).price_at_purchase : 0
    const line = unit * qty

    page.drawText(String(name), { x: margin, y, size: 11, font })
    page.drawText(String(qty), { x: margin + 280, y, size: 11, font })
    page.drawText(money(unit), { x: margin + 330, y, size: 11, font })
    const lineText = money(line)
    const lineWidth = font.widthOfTextAtSize(lineText, 11)
    page.drawText(lineText, { x: width - margin - lineWidth, y, size: 11, font })
    y -= 14

    if (notes) {
      const noteStr = `Notes: ${String(notes)}`
      page.drawText(noteStr, { x: margin + 10, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
      y -= 14
    }

    if (y < 120) {
      // Footer and new page
      drawFooter(page, font)
      const np = pdfDoc.addPage([595.28, 841.89])
      page = np
      y = yStart
    }
  }

  // Totals
  y -= 6
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    color: rgb(0.8, 0.8, 0.8),
    thickness: 1,
  })
  y -= 16

  const totals = [
    ["Subtotal", money((order as any).subtotal)],
    ["VAT", money((order as any).vat)],
    ["Delivery", money((order as any).delivery_charge)],
    ["Discount", money((order as any).discount)],
    ["Total (Tk)", money((order as any).total_price)], // ASCII-safe label
  ]

  for (const [label, val] of totals) {
    page.drawText(label, { x: margin, y, size: 12, font })
    const tWidth = fontBold.widthOfTextAtSize(val, 12)
    page.drawText(val, { x: width - margin - tWidth, y, size: 12, font: fontBold })
    y -= 16
  }

  // Footer
  drawFooter(page, font)

  return await pdfDoc.save()
}

function drawFooter(page: any, font: any) {
  page.drawLine({
    start: { x: 50, y: 60 },
    end: { x: page.getSize().width - 50, y: 60 },
    color: rgb(0.85, 0.85, 0.85),
    thickness: 1,
  })
  page.drawText("Thank you for your order!", { x: 50, y: 44, size: 10, font })
  page.drawText("sushiyaki.example", { x: 50, y: 30, size: 9, font, color: rgb(0.5, 0.5, 0.5) })
}
