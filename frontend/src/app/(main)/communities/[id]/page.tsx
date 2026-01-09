"use client";

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

interface Community {
    _id: string;
    name: string;
    description: string;
    members: any[]; // populated
    admins: any[]; // populated
    creator: { _id: string; name: string };
    code: string;
}

export default function CommunityDetailsPage() {
    const { id } = useParams();
    const [community, setCommunity] = useState<Community | null>(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, checkAuth } = useAuthStore();
    const router = useRouter();

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this community? This cannot be undone.')) return;
        try {
            await api.delete(`/communities/${id}`);
            toast.success('Community deleted');
            router.push('/communities');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.put(`/communities/${id}`, {
                name: editName,
                description: editDescription
            });
            setCommunity(res.data);
            setIsEditing(false);
            toast.success('Community updated');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update');
        }
    };

    const handleKick = async (memberId: string) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;
        try {
            await api.delete(`/communities/${id}/members/${memberId}`);
            toast.success('Member removed');
            fetchCommunity();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to remove member');
        }
    };

    const handlePromote = async (memberId: string) => {
        if (!window.confirm('Promote this member to Admin?')) return;
        try {
            await api.put(`/communities/${id}/members/${memberId}/promote`);
            toast.success('Member promoted');
            fetchCommunity();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to promote');
        }
    };

    const fetchCommunity = async () => {
        try {
            const res = await api.get(`/communities/${id}`);
            setCommunity(res.data);
            setEditName(res.data.name);
            setEditDescription(res.data.description);

            // If member, fetch products
            const isMember = res.data.members.some((m: any) => m._id === user?._id);
            if (isMember) {
                const prodRes = await api.get(`/products?communityId=${id}`);
                setProducts(prodRes.data);
            }
        } catch (error) {
            console.error("Failed to fetch community", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchCommunity();
    }, [id, user]);

    const handleJoin = async () => {
        try {
            await api.put(`/communities/${id}/join`);
            toast.success('Joined community!');
            fetchCommunity(); // Refresh
            checkAuth(); // Update user state
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to join');
        }
    };

    const handleLeave = async () => {
        try {
            await api.put(`/communities/${id}/leave`);
            toast.success('Left community');
            fetchCommunity();
            checkAuth();
            setProducts([]); // Clear products
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to leave');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!community) return <div>Community not found</div>;

    const isMember = user && community.members.some((m: any) => m._id === user?._id);
    const isCreator = user && community.creator._id === user._id;
    const isAdmin = isCreator || (user && community.admins.some((a: any) => a === user._id || a._id === user._id));

    return (
        <div>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 mb-8">
                <div className="max-w-7xl mx-auto">
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <form onSubmit={handleUpdate} className="space-y-4">
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="font-bold text-2xl"
                                    />
                                    <Input
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                    />
                                    <div className="flex space-x-2">
                                        <Button type="submit" size="sm">Save</Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                        {community.name}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500 truncate">{community.description}</p>
                                    <div className="mt-2 text-sm text-gray-500">
                                        Created by {community.creator.name} • {community.members.length} Members
                                        {community.code && <span className="ml-4 p-1 bg-gray-100 rounded font-mono select-all">Code: {community.code}</span>}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="mt-4 flex flex-col items-end md:mt-0 md:ml-4 space-y-2">
                            {isAdmin && !isEditing && (
                                <div className="space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                                    {isCreator && (
                                        <Button variant="destructive" size="sm" onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">Delete</Button>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            {isMember ? (
                                <div className="space-x-3">
                                    {!isCreator && (
                                        <Button variant="outline" onClick={handleLeave}>Leave</Button>
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
                </div>
            </div>

            {/* Products or Join Prompt */}
            {isMember ? (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Community Marketplace</h3>
                    </div>
                    {products.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
                            <p className="text-gray-500">No products yet. Be the first to sell!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {products.map((product: any) => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                    <p className="text-lg text-gray-600 mb-4">Join this community to view products and chat with members.</p>
                </div>
            )}

            {/* Member List (Visible to members) */}
            {isMember && (
                <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Members ({community.members.length})</h3>
                    <div className="divide-y divide-gray-100">
                        {community.members.map((member: any) => {
                            const isMemberAdmin = community.admins.some((a: any) => a === member._id || a._id === member._id) || community.creator._id === member._id;
                            const isMe = user && member._id === user._id;

                            return (
                                <div key={member._id} className="py-3 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {member.name}
                                                {member._id === community.creator._id && <span className="ml-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Owner</span>}
                                                {community.admins.some((a: any) => a === member._id || a._id === member._id) && member._id !== community.creator._id && <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Admin</span>}
                                                {isMe && <span className="ml-2 text-xs text-gray-500">(You)</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        {/* Creator Actions */}
                                        {isCreator && !isMemberAdmin && (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => handlePromote(member._id)} className="text-xs h-7">Promote</Button>
                                            </>
                                        )}
                                        {/* Admin/Creator Actions (Kick) */}
                                        {isAdmin && !isMe && member._id !== community.creator._id && (
                                            <Button size="sm" variant="outline" onClick={() => handleKick(member._id)} className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">Remove</Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
