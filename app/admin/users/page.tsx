"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Building2, 
  ShieldAlert, 
  UserPlus, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit,
  Trash2,
  Ban,
  CheckCircle2
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  email: string;
  full_name: string;
  company: string;
  plan: string;
  status: string;
  certificates_count: number;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 0 });

  // Modals state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editForm, setEditForm] = useState({ plan: "", status: "", full_name: "", company: "" });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: "10",
        search: searchTerm,
        plan: planFilter,
        status: statusFilter
      });
      
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      
      if (json.status === "success") {
        setUsers(json.data);
        setPagination(json.pagination);
      } else {
        throw new Error(json.message || "Failed to fetch users");
      }
    } catch (err) {
      toast.error("Failed to load users");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, searchTerm, planFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await fetch(`/api/admin/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, ...editForm })
      });
      
      if (res.ok) {
        toast.success("User updated successfully");
        setIsEditOpen(false);
        fetchUsers();
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        toast.success("User deleted successfully");
        setIsDeleteOpen(false);
        fetchUsers();
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise': return <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100 uppercase text-[10px] font-black">Enterprise</Badge>;
      case 'pro': return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 uppercase text-[10px] font-black">Pro</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground uppercase text-[10px] font-black">Free</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 uppercase text-[10px] font-black">Active</Badge>;
      case 'suspended': return <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100 uppercase text-[10px] font-black">Suspended</Badge>;
      default: return <Badge variant="outline" className="uppercase text-[10px] font-black">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="User Management" 
        description="Monitor platform adoption and manage user accounts."
      >
        <Button className="rounded-full shadow-lg gap-2">
          <UserPlus className="size-4" />
          Add User
        </Button>
      </PageHeader>

      {/* Filters Card */}
      <Card className="border-none shadow-xl ring-1 ring-border/50 rounded-[2rem] overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email or company..." 
                className="pl-10 rounded-full bg-muted/20 border-none ring-1 ring-border/50 focus-visible:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[140px] rounded-full bg-muted/20 border-none ring-1 ring-border/50">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="All">All Plans</SelectItem>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] rounded-full bg-muted/20 border-none ring-1 ring-border/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-none shadow-2xl ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/30 border-b border-border/40">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">User</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Company</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Certs</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <Loader2 className="size-8 animate-spin mx-auto text-primary opacity-20" />
                      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fetching platform users...</p>
                    </td>
                  </tr>
                ) : users.length > 0 ? users.map((user) => (
                  <tr key={user.id} className="group hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 rounded-2xl border-2 border-background shadow-sm ring-1 ring-border/50">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="rounded-2xl font-black text-xs bg-indigo-50 text-indigo-600">
                            {user.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-foreground leading-none">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground mt-1 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <Building2 className="size-3.5 text-muted-foreground" />
                        {user.company || "No Company"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getPlanBadge(user.plan)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-black tabular-nums">{user.certificates_count}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl w-48 p-2">
                          <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-2">Management</DropdownMenuLabel>
                          <DropdownMenuItem className="rounded-xl gap-2 font-bold text-xs" onClick={() => { setSelectedUser(user); setIsDetailsOpen(true); }}>
                            <ExternalLink className="size-3.5" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl gap-2 font-bold text-xs" onClick={() => { 
                            setSelectedUser(user); 
                            setEditForm({ plan: user.plan, status: user.status, full_name: user.full_name, company: user.company || "" });
                            setIsEditOpen(true); 
                          }}>
                            <Edit className="size-3.5" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 opacity-50" />
                          <DropdownMenuItem className="rounded-xl gap-2 font-bold text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50" onClick={() => { setSelectedUser(user); setIsDeleteOpen(true); }}>
                            <Trash2 className="size-3.5" /> Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <ShieldAlert className="size-10 mx-auto text-muted-foreground opacity-20" />
                      <p className="mt-4 text-sm font-bold opacity-40">No users found matching your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-muted/10 border-t border-border/40 flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Showing <span className="text-foreground">{users.length}</span> of <span className="text-foreground">{pagination.total}</span> users
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full size-8" 
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="text-xs font-black px-2">{pagination.page} / {pagination.total_pages || 1}</div>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full size-8" 
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          {selectedUser && (
            <>
              <div className="bg-muted/20 p-8 border-b border-border/40">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    <Avatar className="size-20 rounded-[2rem] border-4 border-background shadow-xl">
                      <AvatarImage src={selectedUser.avatar_url} />
                      <AvatarFallback className="rounded-[2rem] text-2xl font-black bg-indigo-50 text-indigo-600">
                        {selectedUser.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-black tracking-tighter">{selectedUser.full_name}</h2>
                      <p className="text-muted-foreground font-medium flex items-center gap-2">
                        <Mail className="size-3.5" /> {selectedUser.email}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        {getPlanBadge(selectedUser.plan)}
                        {getStatusBadge(selectedUser.status)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Joined Platform</p>
                    <p className="text-sm font-bold mt-1">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="p-8 grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Platform Usage</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-3xl bg-muted/10 border border-border/50">
                      <span className="text-xs font-bold uppercase">Total Certificates</span>
                      <span className="text-xl font-black">{selectedUser.certificates_count}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-3xl bg-muted/10 border border-border/50">
                      <span className="text-xs font-bold uppercase">Last Login</span>
                      <span className="text-xs font-bold">{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Account Metadata</h3>
                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-bold uppercase">Company</span>
                      <span className="font-black">{selectedUser.company || 'Not Specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-bold uppercase">User ID</span>
                      <span className="font-mono opacity-50">{selectedUser.id.substring(0, 8)}...</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-8 rounded-full border-primary/20 text-primary font-bold shadow-sm">
                    View Full Audit Logs
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter">Edit Profile</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest">Update account credentials and tier.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Full Name</label>
              <Input 
                value={editForm.full_name} 
                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                className="rounded-full bg-muted/20 border-none ring-1 ring-border/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Company</label>
              <Input 
                value={editForm.company} 
                onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                className="rounded-full bg-muted/20 border-none ring-1 ring-border/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Subscription Plan</label>
                <Select value={editForm.plan} onValueChange={(v) => setEditForm({...editForm, plan: v})}>
                  <SelectTrigger className="rounded-full bg-muted/20 border-none ring-1 ring-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Account Status</label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({...editForm, status: v})}>
                  <SelectTrigger className="rounded-full bg-muted/20 border-none ring-1 ring-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-full flex-1">Cancel</Button>
            <Button onClick={handleUpdateUser} className="rounded-full flex-1 shadow-lg">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl">
          <div className="text-center space-y-4">
            <div className="size-16 rounded-[2rem] bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600">
              <ShieldAlert className="size-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter">Are you absolutely sure?</h2>
            <p className="text-muted-foreground text-sm">
              This will soft-delete <span className="font-bold text-foreground">{selectedUser?.full_name}</span>. 
              The user will no longer be able to access the platform.
            </p>
          </div>
          <DialogFooter className="gap-3 mt-8">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-full flex-1">Keep User</Button>
            <Button variant="destructive" onClick={handleDeleteUser} className="rounded-full flex-1 shadow-lg">Delete Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
