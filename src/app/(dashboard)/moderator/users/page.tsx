"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { FaBan } from "react-icons/fa";
import { signOut } from "next-auth/react";
import Link from "next/link";
import ReasonModal from "@/components/users/ReasonModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isBanned: boolean;
}

export default function ModeratorUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [banModal, setBanModal] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: "",
    userName: "",
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

  if (loading) return <div className="flex justify-center items-center h-64"><span className="text-gray-400">Loading users...</span></div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">User Management (Moderator)</h1>
        <Link href="/moderator/users/banned-users" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition">
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
                  <span className="capitalize px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300">{user.role}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isBanned ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-900/50 text-red-300">Banned</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-900/50 text-green-300">Active</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => confirmBan(user.id, user.name || "User")}
                    // 👇 Disabled for admins (and already banned / action in progress)
                    disabled={
                      actionInProgress === user.id ||
                      user.isBanned ||
                      user.role === "admin"
                    }
                    className="text-orange-400 hover:text-orange-300 transition disabled:opacity-50"
                    title={
                      user.role === "admin"
                        ? "Moderators cannot ban administrators"
                        : "Ban User"
                    }
                  >
                    <FaBan size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReasonModal
        isOpen={banModal.open}
        onClose={() => setBanModal({ open: false, userId: "", userName: "" })}
        onConfirm={handleBan}
        title="Ban User"
        message={`You are about to ban ${banModal.userName}. Please provide a reason.`}
        confirmText="Yes, Ban"
        isLoading={actionInProgress !== null}
      />
    </div>
  );
}