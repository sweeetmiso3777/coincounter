import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Mail, Phone, MapPin, Filter } from "lucide-react";

// Sample contact data
const contacts = [
  {
    id: 1,
    name: "Johnlory Amparo",
    email: "amparo.johnlory8@gmail.com",
    phone: "+639658674751",
    location: "Tagoloan, Misamis Oriental",
    role: "Admin",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    id: 2,
    name: "Jake Cuyugan",
    email: "cuyugan.jake@gmail.com",
    phone: "+1 (555) 234-5678",
    location: "Natumolan, Misamis Oriental",
    role: "Technical Writer",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    id: 3,
    name: "Joeven Secusana",
    email: "secusana.joeven@gmail.com",
    phone: "+1 (555) 345-6789",
    location: "Baluarte, Misamis Oriental",
    role: "System Analyst",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "inactive",
  },
  {
    id: 4,
    name: "Rosalie Paculanan",
    email: "paculanan.rosalie@gmail.com",
    phone: "+1 (555) 456-7890",
    location: "Balingasag, Misamis Oriental",
    role: "Project Manager",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    id: 5,
    name: "Gabriel Suarez",
    email: "suarez.gabriel@gmail.com",
    phone: "+1 (555) 567-8901",
    location: "Agusan, Misamis Oriental",
    role: "Developer",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
];

function ContactsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-2">
            Manage your team members and branch contacts
          </p>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Search contacts..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Contacts
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {contacts.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {contacts.filter((c) => c.status === "active").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Branch Managers
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {contacts.filter((c) => c.role === "Branch Manager").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Locations</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {
                      new Set(
                        contacts.map((c) => c.location.split(",")[1]?.trim())
                      ).size
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((contact) => (
            <Card
              key={contact.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={contact.avatar || "/placeholder.svg"}
                      alt={contact.name}
                    />
                    <AvatarFallback>
                      {contact.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {contact.name}
                      </h3>
                      <Badge
                        variant={
                          contact.status === "active" ? "default" : "secondary"
                        }
                        className={
                          contact.status === "active"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                      >
                        {contact.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{contact.role}</p>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{contact.phone}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{contact.location}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ContactsPage;
