"use client";

import BannedUsersTable from "@/components/users/BannedUsersTable";

export default function ModeratorBannedUsersPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Banned Users (Moderator)</h1>
      <BannedUsersTable />
    </div>
  );
}