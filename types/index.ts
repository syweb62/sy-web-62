export interface Order {
  order_id: string
  short_order_id?: string
  customer_name: string
  phone?: string
  address: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  total_amount: number
  subtotal?: number
  discount?: number
  vat?: number
  delivery_charge?: number
  payment_method?: "cash" | "bkash" | "pickup"
  created_at: string
  updated_at?: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id?: string
  product_name: string
  quantity: number
  price: number
  total?: number
}

export interface EnhancedOrdersTableProps {
  orders?: Order[]
  onStatusUpdate?: (orderId: string, status: string) => Promise<void>
  onRefresh?: () => void
  userRole?: "admin" | "manager" | "staff"
  loading?: boolean
}

export interface ConfirmationModal {
  isOpen: boolean
  orderId: string
  action: string
  actionLabel: string
  isProcessing: boolean
}

export interface NotificationData {
  orderId?: string
  shortOrderId?: string
  customerName?: string
  totalAmount?: number
  status?: string
  reservationId?: string
  itemName?: string
  action?: string
}
