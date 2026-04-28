"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Pencil,
  ShieldAlert,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BackButton } from "@/components/ui/back-button";

const mockUsers = [
  { id: "1", name: "John Doe", email: "john@example.com", plan: "Pro", certs: 1245, joined: "Jan 15, 2024", status: "Active" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", plan: "Free", certs: 12, joined: "Feb 02, 2024", status: "Active" },
  { id: "3", name: "Robert Fox", email: "robert@fox.com", plan: "Enterprise", certs: 8520, joined: "Dec 20, 2023", status: "Suspended" },
  { id: "4", name: "Emily Chen", email: "emily@chen.io", plan: "Pro", certs: 432, joined: "Mar 10, 2024", status: "Active" },
  { id: "5", name: "Michael Scott", email: "michael@dundermifflin.com", plan: "Free", certs: 0, joined: "Apr 01, 2024", status: "Inactive" },
  { id: "6", name: "Sarah Miller", email: "sarah@miller.net", plan: "Pro", certs: 2150, joined: "Jan 30, 2024", status: "Active" },
];

const planColors: Record<string, string> = {
  Free: "bg-gray-100 text-gray-700",
  Pro: "bg-indigo-100 text-indigo-700",
  Enterprise: "bg-purple-100 text-purple-700",
};

const statusColors: Record<string, string> = {
  Active: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Inactive: "text-gray-500 bg-gray-50 border-gray-200",
  Suspended: "text-red-600 bg-red-50 border-red-200",
};

export default function UserManagementPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = mockUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || u.plan.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader 
        title="User Management" 
        description="Monitor, manage, and moderate all platform users."
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="size-4" />
          Export Users
        </Button>
      </PageHeader>

      <Card className="border-border/50">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by name or email..." 
                className="pl-9 h-9" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Filter by Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 font-bold uppercase text-[10px]">
              <Filter className="size-3" />
              More Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3"><Checkbox className="size-4" /></th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Certificates</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4"><Checkbox className="size-4" /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${planColors[user.plan]}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium tabular-nums">
                      {user.certs.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {user.joined}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusColors[user.status]}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details">
                          <Eye className="size-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit User">
                          <Pencil className="size-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50" title="Suspend User">
                          <ShieldAlert className="size-4 text-red-400" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50" title="Delete User">
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <AlertCircle className="size-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No users found matching your search.</p>
            </div>
          )}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              Showing <span className="text-foreground">1-6</span> of <span className="text-foreground">1,284</span> users
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled className="h-8 px-3">Prev</Button>
              <Button variant="outline" size="sm" className="h-8 px-3">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
