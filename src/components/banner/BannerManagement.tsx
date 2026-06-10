"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { FaEdit, FaExternalLinkAlt, FaPlus, FaTrash } from "react-icons/fa";
import BannerModal, { BannerFormData } from "./BannerModal";
import ConfirmationModal from "@/components/users/ConfirmationModal";

interface Banner {
  id: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  productLink: string | null;
  isPublished: boolean;
  createdById: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
  createdByRole: "admin" | "moderator" | "customer";
  createdAt: string;
  updatedAt: string;
}

interface BannerManagementProps {
  panelType: "admin" | "moderator";
}

export default function BannerManagement({ panelType }: BannerManagementProps) {
  const { data: session } = useSession();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; banner: Banner | null }>({
    open: false,
    banner: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; banner: Banner | null }>({
    open: false,
    banner: null,
  });

  const accessToken = (session?.user as any)?.accessToken;

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/banners`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setBanners(data.banners);
      } else {
        toast.error(data.message || "Failed to load banners");
      }
    } catch (error) {
      toast.error("Error loading banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchBanners();
  }, [accessToken]);

  const createFormData = (data: BannerFormData) => {
    const formData = new FormData();

    if (data.image) {
      formData.append("image", data.image);
    }

    formData.append("productLink", data.productLink.trim());
    formData.append("isPublished", String(data.isPublished));

    return formData;
  };

  const handleCreateBanner = async (data: BannerFormData) => {
    setActionInProgress("create");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/banners`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: createFormData(data),
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Banner created successfully");
        setCreateModalOpen(false);
        setBanners((prev) => [result.banner, ...prev]);
      } else {
        toast.error(result.message || "Failed to create banner");
      }
    } catch (error) {
      toast.error("Error creating banner");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUpdateBanner = async (data: BannerFormData) => {
    if (!editModal.banner) return;

    setActionInProgress(editModal.banner.id);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/banners/${editModal.banner.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: createFormData(data),
        }
      );

      const result = await res.json();

      if (result.success) {
        toast.success("Banner updated successfully");
        setEditModal({ open: false, banner: null });
        setBanners((prev) =>
          prev.map((banner) => (banner.id === result.banner.id ? result.banner : banner))
        );
      } else {
        toast.error(result.message || "Failed to update banner");
      }
    } catch (error) {
      toast.error("Error updating banner");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteBanner = async () => {
    if (!deleteModal.banner) return;

    setActionInProgress(deleteModal.banner.id);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/banners/${deleteModal.banner.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await res.json();

      if (result.success) {
        toast.success("Banner deleted successfully");
        setBanners((prev) => prev.filter((banner) => banner.id !== deleteModal.banner?.id));
        setDeleteModal({ open: false, banner: null });
      } else {
        toast.error(result.message || "Failed to delete banner");
      }
    } catch (error) {
      toast.error("Error deleting banner");
    } finally {
      setActionInProgress(null);
    }
  };

  const getCreatorLabel = (banner: Banner) => {
    const role = banner.createdByRole === "admin" ? "Admin" : "Moderator";
    const name = banner.createdByName || "Unknown";
    return `${name} (${role})`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-400">Loading banners...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Banner Management {panelType === "moderator" ? "(Moderator)" : ""}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Create, update, publish, unpublish, and delete homepage banners.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg transition"
        >
          <FaPlus size={14} />
          Create Banner
        </button>
      </div>

      <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Banner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Product Link
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Created By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800">
            {banners.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  No banners found. Create your first banner.
                </td>
              </tr>
            ) : (
              banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-gray-900/50">
                  <td className="px-6 py-4">
                    <img
                      src={banner.imageUrl}
                      alt="Banner"
                      className="w-40 h-20 object-cover rounded-lg border border-gray-700"
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {banner.productLink ? (
                      <a
                        href={banner.productLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition max-w-[260px]"
                      >
                        <span className="truncate">{banner.productLink}</span>
                        <FaExternalLinkAlt size={12} />
                      </a>
                    ) : (
                      <span className="text-gray-500">No link</span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-white text-sm">{getCreatorLabel(banner)}</p>
                      <p className="text-gray-500 text-xs">{banner.createdByEmail || "No email"}</p>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {banner.isPublished ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-900/50 text-green-300">
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-800 text-gray-300">
                        Unpublished
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                    {new Date(banner.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                    <button
                      onClick={() => setEditModal({ open: true, banner })}
                      disabled={actionInProgress === banner.id}
                      className="text-orange-400 hover:text-orange-300 transition disabled:opacity-50"
                      title="Edit Banner"
                    >
                      <FaEdit size={18} />
                    </button>

                    <button
                      onClick={() => setDeleteModal({ open: true, banner })}
                      disabled={actionInProgress === banner.id}
                      className="text-red-400 hover:text-red-300 transition disabled:opacity-50"
                      title="Delete Banner"
                    >
                      <FaTrash size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <BannerModal
        isOpen={createModalOpen}
        title="Create Banner"
        isLoading={actionInProgress === "create"}
        onClose={() => setCreateModalOpen(false)}
        onConfirm={handleCreateBanner}
      />

      <BannerModal
        isOpen={editModal.open}
        title="Edit Banner"
        isEdit
        initialData={editModal.banner}
        isLoading={actionInProgress === editModal.banner?.id}
        onClose={() => setEditModal({ open: false, banner: null })}
        onConfirm={handleUpdateBanner}
      />

      <ConfirmationModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, banner: null })}
        onConfirm={handleDeleteBanner}
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This will also remove the image from Cloudinary."
        confirmText="Yes, Delete"
        confirmVariant="danger"
        isLoading={actionInProgress === deleteModal.banner?.id}
      />
    </div>
  );
}