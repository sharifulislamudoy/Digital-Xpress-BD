"use client";

import BannedUsersTable from "@/components/users/BannedUsersTable";

export default function AdminBannedUsersPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Banned Users (Admin)</h1>
      <BannedUsersTable />
    </div>
  );
}