"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, Calendar, Clock, Users } from "lucide-react"

// Mock reservations data
const mockReservations = [
  {
    id: "RES-001",
    customer: "Emily Davis",
    email: "emily@example.com",
    phone: "+1 (555) 123-4567",
    date: "2024-01-15",
    time: "7:30 PM",
    guests: 4,
    table: "Table 12",
    status: "confirmed",
    notes: "Birthday celebration",
    created: "2024-01-10",
  },
  {
    id: "RES-002",
    customer: "Robert Wilson",
    email: "robert@example.com",
    phone: "+1 (555) 234-5678",
    date: "2024-01-15",
    time: "8:00 PM",
    guests: 2,
    table: "Table 5",
    status: "confirmed",
    notes: "Anniversary dinner",
    created: "2024-01-12",
  },
  {
    id: "RES-003",
    customer: "Lisa Anderson",
    email: "lisa@example.com",
    phone: "+1 (555) 345-6789",
    date: "2024-01-16",
    time: "6:30 PM",
    guests: 6,
    table: "Table 8",
    status: "pending",
    notes: "Business dinner",
    created: "2024-01-14",
  },
  {
    id: "RES-004",
    customer: "David Brown",
    email: "david@example.com",
    phone: "+1 (555) 456-7890",
    date: "2024-01-16",
    time: "7:00 PM",
    guests: 3,
    table: "Table 3",
    status: "cancelled",
    notes: "",
    created: "2024-01-13",
  },
]

export default function ReservationsPage() {
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

  const filteredReservations = mockReservations.filter((reservation) => {
    const matchesSearch =
      reservation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.phone.includes(searchTerm)

    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter

    let matchesDate = true
    if (dateFilter === "today") {
      matchesDate = reservation.date === "2024-01-15"
    } else if (dateFilter === "tomorrow") {
      matchesDate = reservation.date === "2024-01-16"
    } else if (dateFilter === "week") {
      // Mock logic for this week
      matchesDate = true
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Reservations</h1>
          <p className="text-gray-400 mt-1">Manage table reservations and bookings</p>
        </div>
        <Button className="bg-gold text-black hover:bg-gold/80">
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
                  {mockReservations.filter((r) => r.date === "2024-01-15").length}
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
                  {mockReservations.filter((r) => r.status === "pending").length}
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
                <p className="text-xl font-bold text-white">{mockReservations.reduce((sum, r) => sum + r.guests, 0)}</p>
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
                <p className="text-xl font-bold text-white">{mockReservations.length}</p>
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
      <Card className="bg-black/30 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Reservations ({filteredReservations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id} className="border-gray-800">
                    <TableCell className="font-medium text-white">{reservation.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">{reservation.customer}</p>
                        <p className="text-gray-400 text-sm">{reservation.email}</p>
                        <p className="text-gray-400 text-sm">{reservation.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-300">
                        <p>{reservation.date}</p>
                        <p className="text-sm text-gray-400">{reservation.time}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">{reservation.guests}</TableCell>
                    <TableCell className="text-gold">{reservation.table}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(reservation.status)}>{reservation.status}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-300 max-w-32 truncate">{reservation.notes || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit size={14} />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
