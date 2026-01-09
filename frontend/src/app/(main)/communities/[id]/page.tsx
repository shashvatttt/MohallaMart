"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

interface Community {
  _id: string;
  name: string;
  description: string;
  members: any[];
  admins: any[];
  creator: { _id: string; name: string };
  code: string;
}

export default function CommunityDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();

  const [community, setCommunity] = useState<Community | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  /* ---------------- ACTIONS ---------------- */

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this community?")) return;
    try {
      await api.delete(`/communities/${id}`);
      toast.success("Community deleted");
      router.push("/communities");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put(`/communities/${id}`, {
        name: editName,
        description: editDescription,
      });
      setCommunity(res.data);
      setIsEditing(false);
      toast.success("Community updated");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update");
    }
  };

  const handleJoin = async () => {
    try {
      await api.put(`/communities/${id}/join`);
      toast.success("Joined community!");
      fetchCommunity();
      checkAuth();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to join");
    }
  };

  const handleLeave = async () => {
    try {
      await api.put(`/communities/${id}/leave`);
      toast.success("Left community");
      fetchCommunity();
      checkAuth();
      setProducts([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to leave");
    }
  };

  const handleKick = async (memberId: string) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      await api.delete(`/communities/${id}/members/${memberId}`);
      toast.success("Member removed");
      fetchCommunity();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  const handlePromote = async (memberId: string) => {
    if (!window.confirm("Promote this member to admin?")) return;
    try {
      await api.put(`/communities/${id}/members/${memberId}/promote`);
      toast.success("Member promoted");
      fetchCommunity();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to promote member");
    }
  };

  /* ---------------- FETCH ---------------- */

  const fetchCommunity = async () => {
    try {
      const res = await api.get(`/communities/${id}`);
      setCommunity(res.data);
      setEditName(res.data.name);
      setEditDescription(res.data.description);

      const isMember = res.data.members.some(
        (m: any) => m._id === user?._id
      );

      if (isMember) {
        const prodRes = await api.get(`/products?communityId=${id}`);
        setProducts(prodRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch community", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCommunity();
  }, [id, user]);

  /* ---------------- GUARDS ---------------- */

  if (loading) return <div>Loading...</div>;
  if (!community) return <div>Community not found</div>;

  const isMember =
    user && community.members.some((m: any) => m._id === user._id);
  const isCreator = user && community.creator._id === user._id;
  const isAdmin =
    isCreator ||
    (user &&
      community.admins.some(
        (a: any) => a === user._id || a._id === user._id
      ));

  /* ---------------- UI ---------------- */

  return (
    <div>
      {/* HEADER */}
      <div className="bg-white border-b px-6 py-8 mb-8">
        <div className="flex justify-between items-start">
          <div>
            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-3">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Save</Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="text-2xl font-bold">{community.name}</h2>
                <p className="text-gray-500">{community.description}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Created by {community.creator.name} • {community.members.length} members
                </p>
              </>
            )}
          </div>

          {isAdmin && !isEditing && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>

              {isCreator && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="mt-4">
          {isMember ? (
            <div className="flex gap-3">
              {!isCreator && (
                <Button variant="outline" onClick={handleLeave}>
                  Leave
                </Button>
              )}
              <Link href={`/products/create?communityId=${id}`}>
                <Button>Sell Something</Button>
              </Link>
            </div>
          ) : (
            <Button onClick={handleJoin}>Join Community</Button>
          )}
        </div>
      </div>

      {/* PRODUCTS */}
      {isMember ? (
        products.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No products yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )
      ) : (
        <div className="text-center text-gray-600 py-20">
          Join this community to view products.
        </div>
      )}

      {/* MEMBERS */}
      {isMember && (
        <div className="mt-12 bg-white border rounded p-6">
          <h3 className="font-bold mb-4">
            Members ({community.members.length})
          </h3>

          {community.members.map((member: any) => {
            const isMe = user && member._id === user._id;
            const isMemberAdmin =
              community.creator._id === member._id ||
              community.admins.some((a: any) => a === member._id || a._id === member._id);

            return (
              <div key={member._id} className="flex justify-between py-2 border-b">
                <span>{member.name}{isMe && " (You)"}</span>
                <div className="flex gap-2">
                  {isCreator && !isMemberAdmin && (
                    <Button size="sm" variant="outline" onClick={() => handlePromote(member._id)}>
                      Promote
                    </Button>
                  )}
                  {isAdmin && !isMe && member._id !== community.creator._id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-600"
                      onClick={() => handleKick(member._id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
