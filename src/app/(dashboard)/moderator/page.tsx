"use client";

import Link from "next/link";
import { FaShoppingCart, FaBox, FaCheckCircle, FaClock } from "react-icons/fa";
import RecentReviewsPanel from "@/components/dashboard/RecentReviewsPanel";

const stats = [
  { title: "Total Orders", value: "856", change: "+8%", icon: FaShoppingCart, color: "bg-blue-500" },
  { title: "Pending Orders", value: "34", change: "-5%", icon: FaClock, color: "bg-yellow-500" },
  { title: "Completed Orders", value: "782", change: "+12%", icon: FaCheckCircle, color: "bg-green-500" },
  { title: "Products in Stock", value: "2,345", change: "+3%", icon: FaBox, color: "bg-orange-500" },
];

const recentOrders = [
  { id: "#MOD-101", customer: "Emily Clark", amount: "৳89.99", status: "Processing", date: "2025-06-05" },
  { id: "#MOD-102", customer: "Michael Lee", amount: "৳159.99", status: "Shipped", date: "2025-06-04" },
  { id: "#MOD-103", customer: "Sarah Williams", amount: "৳49.99", status: "Delivered", date: "2025-06-03" },
  { id: "#MOD-104", customer: "David Brown", amount: "৳299.99", status: "Pending", date: "2025-06-02" },
];

const getStatusBadge = (status: string) => {
  const base = "px-2 py-1 text-xs rounded-full font-medium";
  switch (status) {
    case "Delivered":
      return <span className={`${base} bg-green-500/20 text-green-400`}>{status}</span>;
    case "Processing":
      return <span className={`${base} bg-blue-500/20 text-blue-400`}>{status}</span>;
    case "Shipped":
      return <span className={`${base} bg-purple-500/20 text-purple-400`}>{status}</span>;
    default:
      return <span className={`${base} bg-yellow-500/20 text-yellow-400`}>{status}</span>;
  }
};

export default function ModeratorDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Moderator Dashboard</h1>
        <p className="mt-1 text-gray-400">Manage orders, products, and reviews</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="rounded-xl border border-gray-800 bg-black p-5 transition hover:border-orange-500/50">
            <div className="mb-3 flex items-center justify-between">
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="text-xl text-white" />
              </div>
              <span className="text-sm font-medium text-green-400">{stat.change}</span>
            </div>
            <p className="text-sm text-gray-400">{stat.title}</p>
            <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-black">
          <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
            <Link href="/moderator/orders" className="text-sm text-orange-500 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">Order ID</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">Customer</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">Amount</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">Status</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, idx) => (
                  <tr key={idx} className="border-t border-gray-800 hover:bg-gray-800/30">
                    <td className="px-6 py-3 font-medium text-white">{order.id}</td>
                    <td className="px-6 py-3 text-gray-300">{order.customer}</td>
                    <td className="px-6 py-3 text-gray-300">{order.amount}</td>
                    <td className="px-6 py-3">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-3 text-gray-400">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <RecentReviewsPanel panelType="moderator" />
      </div>
    </div>
  );
}
