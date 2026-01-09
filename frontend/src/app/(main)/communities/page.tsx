"use client";

import { useEffect, useState } from 'react';
import api from '@/services/api';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus } from 'lucide-react';

interface Community {
    _id: string;
    name: string;
    description: string;
    creator: {
        _id: string;
        name: string;
    };
    members: string[];
}

export default function CommunitiesPage() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [joinCode, setJoinCode] = useState('');
    const { user } = useAuthStore();

    const handleJoinByCode = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/communities/join-by-code', { code: joinCode });
            toast.success('Successfully joined community');
            // Refresh communities text
            const res = await api.get('/communities');
            setCommunities(res.data);
            setJoinCode('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to join community');
        }
    };

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const res = await api.get('/communities');
                setCommunities(res.data);
            } catch (error) {
                console.error("Failed to fetch communities", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCommunities();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
                <Link href="/communities/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Community
                    </Button>
                </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Join a Community by Code</h2>
                <form onSubmit={handleJoinByCode} className="flex gap-4">
                    <Input
                        placeholder="Enter 6-character code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="max-w-xs"
                    />
                    <Button type="submit" disabled={joinCode.length < 6}>
                        Join
                    </Button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communities.map((community) => {
                    const isMember = user && community.members.includes(user._id);

                    return (
                        <div key={community._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{community.name}</h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{community.description}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">{community.members.length} Members</span>
                                <Link href={`/communities/${community._id}`}>
                                    <Button variant="outline" size="sm">
                                        View
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
