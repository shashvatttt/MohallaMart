"use client";

import { useState } from 'react';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function CreateCommunityPage() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [createdCode, setCreatedCode] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/communities', { name, description, isPrivate });
            toast.success('Community created successfully');
            setCreatedCode(res.data.code);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create community');
        }
    };

    if (createdCode) {
        return (
            <div className="max-w-md mx-auto mt-10">
                <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Created!</h2>
                    <p className="text-gray-600 mb-6">Values your community code. Share this with others to let them join.</p>

                    <div className="bg-gray-100 p-4 rounded-md mb-6 relative group">
                        <p className="text-3xl font-mono font-bold text-indigo-600 tracking-wider select-all">{createdCode}</p>
                        <p className="text-xs text-gray-400 mt-2">Click code to select</p>
                    </div>

                    <div className="space-y-3">
                        <Button
                            className="w-full"
                            onClick={() => router.push('/communities')}
                        >
                            Go to Communities
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a New Community</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Community Name</label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-1"
                            placeholder="e.g., Tech Park Residents"
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={4}
                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
                            placeholder="Describe your community..."
                        />
                    </div>
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="isPrivate"
                                type="checkbox"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="isPrivate" className="font-bold text-gray-900">Private Community</label>
                            <p className="text-gray-500">Private communities will not appear in the "Browse Communities" list. Users can only join if they have the unique code.</p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit">Create Community</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
