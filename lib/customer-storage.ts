interface CustomerData {
  name: string
  phone: string
  address: string
  notes?: string
  orderCount: number
  lastUpdated: string
}

interface CustomerSummary {
  name: string
  orderCount: number
  lastOrder: string
}

class CustomerStorage {
  private readonly STORAGE_KEY = "customer_data"
  private readonly ENCRYPTION_KEY = "sushi_customer_key"

  private encrypt(data: string): string {
    // Simple base64 encoding for basic obfuscation
    return btoa(data)
  }

  private decrypt(data: string): string {
    try {
      return atob(data)
    } catch {
      return ""
    }
  }

  saveCustomerData(customerInfo: Omit<CustomerData, "orderCount" | "lastUpdated">): void {
    try {
      const existingData = this.getCustomerData()
      const orderCount = existingData ? existingData.orderCount + 1 : 1

      const customerData: CustomerData = {
        ...customerInfo,
        orderCount,
        lastUpdated: new Date().toISOString(),
      }

      const encryptedData = this.encrypt(JSON.stringify(customerData))
      localStorage.setItem(this.STORAGE_KEY, encryptedData)

      console.log("Customer data saved successfully")
    } catch (error) {
      console.error("Failed to save customer data:", error)
    }
  }

  getCustomerData(): CustomerData | null {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_KEY)
      if (!encryptedData) return null

      const decryptedData = this.decrypt(encryptedData)
      if (!decryptedData) return null

      const customerData = JSON.parse(decryptedData) as CustomerData

      // Validate data structure
      if (!customerData.name || !customerData.phone || !customerData.address) {
        this.clearCustomerData()
        return null
      }

      return customerData
    } catch (error) {
      console.error("Failed to retrieve customer data:", error)
      this.clearCustomerData()
      return null
    }
  }

  getCustomerSummary(): CustomerSummary | null {
    const customerData = this.getCustomerData()
    if (!customerData) return null

    return {
      name: customerData.name,
      orderCount: customerData.orderCount,
      lastOrder: new Date(customerData.lastUpdated).toLocaleDateString(),
    }
  }

  clearCustomerData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log("Customer data cleared")
    } catch (error) {
      console.error("Failed to clear customer data:", error)
    }
  }

  updateCustomerData(updates: Partial<Omit<CustomerData, "orderCount" | "lastUpdated">>): void {
    const existingData = this.getCustomerData()
    if (!existingData) return

    const updatedData: CustomerData = {
      ...existingData,
      ...updates,
      lastUpdated: new Date().toISOString(),
    }

    const encryptedData = this.encrypt(JSON.stringify(updatedData))
    localStorage.setItem(this.STORAGE_KEY, encryptedData)
  }
}

export const customerStorage = new CustomerStorage()
