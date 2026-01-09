"use client";

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductDetailsPage() {
    const { id } = useParams();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();
    const router = useRouter();
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${id}`);
                setProduct(res.data);
            } catch (error: any) {
                console.error("Failed to fetch product", error);
                if (error.response?.status === 403) {
                    toast.error("You must be a member of the community to view this product");
                    router.push('/communities');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, router]);

    const handleMarkSold = async () => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.put(`/products/${id}/sold`);
            toast.success('Marked as sold');
            setProduct({ ...product, status: 'Sold' });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!product) return <div>Product not found</div>;

    const isSeller = user && product.seller._id === user._id;

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="md:flex">
                {/* Image Gallery */}
                <div className="md:w-1/2 bg-gray-100">
                    <div className="aspect-w-1 aspect-h-1 w-full relative h-[400px]">
                        <Image
                            src={product.images[activeImage]}
                            alt={product.title}
                            fill
                            className="object-contain"
                        />
                    </div>
                    {product.images.length > 1 && (
                        <div className="flex p-2 space-x-2 overflow-x-auto">
                            {product.images.map((img: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={`relative w-16 h-16 border-2 rounded-md overflow-hidden flex-shrink-0 ${activeImage === idx ? 'border-indigo-600' : 'border-transparent'}`}
                                >
                                    <Image src={img} alt="" fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
                    <div className="flex justify-between items-start">
                        <div>
                            <Link href={`/communities/${product.community._id}`} className="text-sm text-indigo-600 hover:underline">
                                {product.community.name}
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.title}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Posted {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                        {product.status === 'Sold' && (
                            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">Sold</span>
                        )}
                    </div>

                    <div className="mt-6">
                        <h2 className="sr-only">Product description</h2>
                        <p className="text-base text-gray-700 whitespace-pre-wrap">{product.description}</p>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-200 flex-1 flex flex-col justify-end">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <p className="text-sm text-gray-500">Price</p>
                                <p className="text-3xl font-bold text-gray-900">₹{product.price}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                    {product.seller.name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{product.seller.name}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {isSeller ? (
                                product.status !== 'Sold' && (
                                    <Button onClick={handleMarkSold} className="w-full" variant="outline">
                                        Mark as Sold
                                    </Button>
                                )
                            ) : (
                                <Link href={`/chat?userId=${product.seller._id}`}>
                                    <Button className="w-full" disabled={product.status === 'Sold'}>
                                        Chat with Seller
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
