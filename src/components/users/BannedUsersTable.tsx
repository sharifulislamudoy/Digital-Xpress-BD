"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { FaTrashRestore } from "react-icons/fa";
import ConfirmationModal from "./ConfirmationModal";

interface BannedUser {
  id: string;
  email: string;
  mobile: string;
  name: string | null;
  reason: string;
  bannedAt: string;
}

export default function BannedUsersTable() {
  const { data: session } = useSession();
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unbanning, setUnbanning] = useState<string | null>(null);
  const [unbanModal, setUnbanModal] = useState<{ open: boolean; id: string; email: string }>({
    open: false,
    id: "",
    email: "",
  });

  const fetchBannedUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/banned`, {
        headers: { Authorization: `Bearer ${(session?.user as any)?.accessToken}` },
      });
      const data = await res.json();
      if (data.success) setBannedUsers(data.bannedUsers);
      else toast.error("Failed to load banned users");
    } catch (error) {
      toast.error("Error loading banned users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) fetchBannedUsers();
  }, [session]);

  const confirmUnban = (id: string, email: string) => {
    setUnbanModal({ open: true, id, email });
  };

  const handleUnban = async () => {
    const { id, email } = unbanModal;
    setUnbanning(id);
    setUnbanModal({ open: false, id: "", email: "" });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/banned/${id}/unban`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${(session?.user as any)?.accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Unbanned ${email}`);
        fetchBannedUsers();
      } else {
        toast.error(data.message || "Failed to unban");
      }
    } catch (error) {
      toast.error("Error unbanning user");
    } finally {
      setUnbanning(null);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><span className="text-gray-400">Loading banned users...</span></div>;

  return (
    <>
      <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Mobile</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Banned At</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {bannedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-900/50">
                <td className="px-6 py-4 whitespace-nowrap text-white">{user.name || "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.mobile}</td>
                <td className="px-6 py-4 text-gray-400 text-sm">{user.reason}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">{new Date(user.bannedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => confirmUnban(user.id, user.email)}
                    disabled={unbanning === user.id}
                    className="text-green-400 hover:text-green-300 transition disabled:opacity-50"
                  >
                    {unbanning === user.id ? (
                      <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FaTrashRestore size={18} />
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {bannedUsers.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No banned users.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <ConfirmationModal
        isOpen={unbanModal.open}
        onClose={() => setUnbanModal({ open: false, id: "", email: "" })}
        onConfirm={handleUnban}
        title="Unban User"
        message={`Are you sure you want to unban ${unbanModal.email}? The user will be able to log in again.`}
        confirmText="Yes, Unban"
        confirmVariant="success"
        isLoading={unbanning !== null}
      />
    </>
  );
}