"use client";

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

interface Community {
    _id: string;
    name: string;
}

export default function CreateProductPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('Other');
    const [communityId, setCommunityId] = useState('');
    const [images, setImages] = useState<FileList | null>(null);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedCommunityId = searchParams.get('communityId');

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                // Fetch joined communities to populate dropdown
                // Since we don't have a direct "get my communities" API, we can use /communities and filter on frontend or add endpoint. 
                // Wait, /communities returns all. We can filter by "members includes me" but the response might not have full member list or be huge.
                // Best to have /auth/me return joinedCommunities or a dedicated endpoint. 
                // /auth/me returns joinedCommunities IDs.
                // Or /communities filters.
                // Let's use /communities for now assuming the count isn't massive for MVP.
                const res = await api.get('/communities');
                const userRes = await api.get('/auth/me');
                const myCommunityIds = userRes.data.joinedCommunities.map((c: any) => typeof c === 'string' ? c : c._id);

                const myCommunities = res.data.filter((c: any) => myCommunityIds.includes(c._id));
                setCommunities(myCommunities);

                if (preselectedCommunityId) {
                    setCommunityId(preselectedCommunityId);
                } else if (myCommunities.length > 0) {
                    setCommunityId(myCommunities[0]._id);
                }
            } catch (error) {
                console.error("Failed to load communities", error);
            }
        };
        fetchCommunities();
    }, [preselectedCommunityId]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!communityId) {
            toast.error("Please join a community first");
            return;
        }
        if (!images || images.length === 0) {
            toast.error("Please upload at least one image");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('category', category);
        formData.append('communityId', communityId);

        for (let i = 0; i < images.length; i++) {
            formData.append('images', images[i]);
        }

        try {
            await api.post('/products', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Product posted successfully');
            router.push(`/communities/${communityId}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to post product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Sell an Item</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Community</label>
                        <select
                            value={communityId}
                            onChange={(e) => setCommunityId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            required
                        >
                            <option value="" disabled>Select a community</option>
                            {communities.map((c) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                        {communities.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">You must join a community to post.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="What are you selling?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                        <Input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                            placeholder="0.00"
                            min="0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        >
                            <option>Other</option>
                            <option>Electronics</option>
                            <option>Furniture</option>
                            <option>Clothing</option>
                            <option>Books</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={4}
                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
                            placeholder="Describe the condition, age, etc."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Images</label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setImages(e.target.files)}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">First image will be the cover.</p>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Posting...' : 'Post Item'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
