"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { FaTrash, FaBan, FaEdit } from "react-icons/fa";
import Link from "next/link";
import ConfirmationModal from "@/components/users/ConfirmationModal";
import ReasonModal from "@/components/users/ReasonModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "moderator" | "customer";
  createdAt: string;
  isBanned: boolean;
}

export default function AdminUsersPage() {
  const { data: session, update } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Ban modal state
  const [banModal, setBanModal] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: "",
    userName: "",
  });
  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: "",
    userName: "",
  });
  // 👇 Role change confirmation modal
  const [roleModal, setRoleModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    newRole: string;
  }>({
    open: false,
    userId: "",
    userName: "",
    newRole: "",
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`, {
        headers: { Authorization: `Bearer ${(session?.user as any)?.accessToken}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
      else toast.error("Failed to load users");
    } catch (error) {
      toast.error("Error loading users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) fetchUsers();
  }, [session]);

  // 👇 Open role change modal instead of changing directly
  const openRoleChangeModal = (userId: string, userName: string, newRole: string) => {
    setRoleModal({ open: true, userId, userName, newRole });
  };

  // 👇 Actual role change after confirmation
  const handleRoleChangeConfirmed = async () => {
    const { userId, newRole } = roleModal;
    setRoleModal({ open: false, userId: "", userName: "", newRole: "" });
    setUpdatingRole(userId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session?.user as any)?.accessToken}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Role updated to ${newRole}`);
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u)));
        if ((session?.user as any)?.id === userId) {
          toast.loading("Your role has changed. Logging you out...");
          setTimeout(() => signOut({ callbackUrl: "/login" }), 1500);
        }
      } else {
        toast.error(data.message || "Failed to update role");
      }
    } catch (error) {
      toast.error("Error updating role");
    } finally {
      setUpdatingRole(null);
    }
  };

  // Ban user with reason
  const confirmBan = (userId: string, userName: string) => {
    setBanModal({ open: true, userId, userName });
  };

  const handleBan = async (reason: string) => {
    const { userId, userName } = banModal;
    setActionInProgress(userId);
    setBanModal({ open: false, userId: "", userName: "" });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${userId}/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session?.user as any)?.accessToken}`,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User ${userName} has been banned.`);
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isBanned: true } : u)));
        if ((session?.user as any)?.id === userId) {
          toast.loading("Your account has been banned. Logging you out...");
          setTimeout(() => signOut({ callbackUrl: "/" }), 1500);
        }
      } else {
        toast.error(data.message || "Failed to ban user");
      }
    } catch (error) {
      toast.error("Error banning user");
    } finally {
      setActionInProgress(null);
    }
  };

  // Delete user (hard delete)
  const confirmDelete = (userId: string, userName: string) => {
    setDeleteModal({ open: true, userId, userName });
  };

  const handleDelete = async () => {
    const { userId, userName } = deleteModal;
    setActionInProgress(userId);
    setDeleteModal({ open: false, userId: "", userName: "" });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session?.user as any)?.accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User ${userName} has been permanently deleted.`);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        if ((session?.user as any)?.id === userId) {
          toast.loading("Your account has been deleted. Logging you out...");
          setTimeout(() => signOut({ callbackUrl: "/" }), 1500);
        }
      } else {
        toast.error(data.message || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Error deleting user");
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><span className="text-gray-400">Loading users...</span></div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <Link href="/admin/users/banned-users" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition">
          View Banned Users
        </Link>
      </div>
      <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Joined</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-900/50">
                <td className="px-6 py-4 whitespace-nowrap text-white">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    // 👇 Open modal on change
                    onChange={(e) =>
                      openRoleChangeModal(user.id, user.name || "User", e.target.value)
                    }
                    disabled={updatingRole === user.id}
                    className="bg-gray-800 text-white rounded-md px-2 py-1 text-sm border border-gray-700"
                  >
                    <option value="customer">Customer</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                  {updatingRole === user.id && <span className="ml-2 inline-block w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isBanned ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-900/50 text-red-300">Banned</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-900/50 text-green-300">Active</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                  <button
                    onClick={() => confirmBan(user.id, user.name || "User")}
                    disabled={actionInProgress === user.id || user.isBanned}
                    className="text-orange-400 hover:text-orange-300 transition disabled:opacity-50"
                    title="Ban User"
                  >
                    <FaBan size={18} />
                  </button>
                  <button
                    onClick={() => confirmDelete(user.id, user.name || "User")}
                    disabled={actionInProgress === user.id}
                    className="text-red-400 hover:text-red-300 transition disabled:opacity-50"
                    title="Permanently Delete"
                  >
                    <FaTrash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ban Reason Modal */}
      <ReasonModal
        isOpen={banModal.open}
        onClose={() => setBanModal({ open: false, userId: "", userName: "" })}
        onConfirm={handleBan}
        title="Ban User"
        message={`You are about to ban ${banModal.userName}. Please provide a reason.`}
        confirmText="Yes, Ban"
        isLoading={actionInProgress !== null}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, userId: "", userName: "" })}
        onConfirm={handleDelete}
        title="Permanently Delete User"
        message={`Are you sure you want to PERMANENTLY DELETE ${deleteModal.userName}? This action cannot be undone and all user data will be removed.`}
        confirmText="Yes, Delete Permanently"
        confirmVariant="danger"
        isLoading={actionInProgress !== null}
      />

      {/* 👇 Role Change Confirmation Modal */}
      <ConfirmationModal
        isOpen={roleModal.open}
        onClose={() => setRoleModal({ open: false, userId: "", userName: "", newRole: "" })}
        onConfirm={handleRoleChangeConfirmed}
        title="Change User Role"
        message={`Are you sure you want to change ${roleModal.userName}'s role to ${roleModal.newRole}?`}
        confirmText="Yes, Change Role"
        confirmVariant="warning"
        isLoading={updatingRole !== null}
      />
    </div>
  );
}