"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, Calendar, Clock, Users } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

// Interface for real reservations data
interface Reservation {
  reservation_id: string
  name: string
  phone: string
  date: string
  time: string
  people_count: number
  user_id: string | null
  created_at: string
  status: string
  table: string
  notes: string
}

export default function ReservationsPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-900/50 text-green-300"
      case "pending":
        return "bg-yellow-900/50 text-yellow-300"
      case "cancelled":
        return "bg-red-900/50 text-red-300"
      case "completed":
        return "bg-blue-900/50 text-blue-300"
      default:
        return "bg-gray-900/50 text-gray-300"
    }
  }

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/reservations")
        const result = await response.json()

        if (result.success) {
          setReservations(result.reservations)
        } else {
          console.error("Failed to fetch reservations:", result.error)
        }
      } catch (error) {
        console.error("Error fetching reservations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [])

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.reservation_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.phone.includes(searchTerm)

    let matchesDate = true
    if (dateFilter === "today") {
      const today = new Date().toISOString().split("T")[0]
      matchesDate = reservation.date === today
    } else if (dateFilter === "tomorrow") {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      matchesDate = reservation.date === tomorrow.toISOString().split("T")[0]
    } else if (dateFilter === "week") {
      const today = new Date()
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      matchesDate =
        reservation.date >= startOfWeek.toISOString().split("T")[0] &&
        reservation.date <= endOfWeek.toISOString().split("T")[0]
    }

    let matchesStatus = true
    if (statusFilter !== "all") {
      matchesStatus = reservation.status === statusFilter
    }

    return matchesSearch && matchesDate && matchesStatus
  })

  return (
    <div className="h-full w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Reservations</h1>
          <p className="text-gray-400 mt-1">Manage table reservations and bookings</p>
        </div>
        <Button
          className="bg-gold text-black hover:bg-gold/80"
          onClick={() => {
            // For now, redirect to booking page - can be enhanced later with modal
            window.open("/book", "_blank")
          }}
        >
          <Plus size={16} className="mr-2" />
          New Reservation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/30 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="text-gold" size={20} />
              <div>
                <p className="text-sm text-gray-400">Today</p>
                <p className="text-xl font-bold text-white">
                  {reservations.filter((r) => r.date === new Date().toISOString().split("T")[0]).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/30 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="text-gold" size={20} />
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-xl font-bold text-white">
                  {reservations.filter((r) => r.status === "pending").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/30 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="text-gold" size={20} />
              <div>
                <p className="text-sm text-gray-400">Total Guests</p>
                <p className="text-xl font-bold text-white">
                  {reservations.reduce((sum, r) => sum + r.people_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/30 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="text-gold" size={20} />
              <div>
                <p className="text-sm text-gray-400">This Week</p>
                <p className="text-xl font-bold text-white">{reservations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-black/30 border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search reservations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-gray-800/50 border-gray-700">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-48 bg-gray-800/50 border-gray-700">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card className="bg-black/30 border-gray-800 flex-1">
        <CardHeader>
          <CardTitle className="text-white">Reservations ({filteredReservations.length})</CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          <div className="overflow-x-auto h-full">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">Reservation ID</TableHead>
                  <TableHead className="text-gray-400">Customer</TableHead>
                  <TableHead className="text-gray-400">Date & Time</TableHead>
                  <TableHead className="text-gray-400">Guests</TableHead>
                  <TableHead className="text-gray-400">Table</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Notes</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400">
                      Loading reservations...
                    </TableCell>
                  </TableRow>
                ) : filteredReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400">
                      No reservations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReservations.map((reservation) => (
                    <TableRow key={reservation.reservation_id} className="border-gray-800">
                      <TableCell className="font-medium text-white">{reservation.reservation_id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{reservation.name}</p>
                          <p className="text-gray-400 text-sm">{reservation.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-300">
                          <p>{reservation.date}</p>
                          <p className="text-sm text-gray-400">{reservation.time}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{reservation.people_count}</TableCell>
                      <TableCell className="text-gold">{reservation.table}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(reservation.status)}>{reservation.status}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">{reservation.notes}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-400 hover:text-red-300 bg-transparent"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
