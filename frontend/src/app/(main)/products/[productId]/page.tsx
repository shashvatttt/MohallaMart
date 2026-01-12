'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';

interface Product {
    _id: string;
    title: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    condition: string;
    status: string;
    seller: {
        _id: string;
        name: string;
    };
    community: {
        _id: string;
        name: string;
        image?: string;
    };
    createdAt: string;
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const productId = params.productId as string;

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${productId}`);
                setProduct(res.data);
            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.message || 'Failed to load product');
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    const handleMessageSeller = () => {
        if (!product || !user) return;

        if (product.seller._id === user._id) {
            alert("You cannot message yourself!");
            return;
        }

        router.push(`/chat?userId=${product.seller._id}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <p className="text-red-500 text-lg mb-4">{error || 'Product not found'}</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
                ← Back
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Gallery */}
                <div className="space-y-4">
                    <div className="aspect-w-1 aspect-h-1 w-full relative rounded-lg overflow-hidden bg-gray-100 h-96">
                        <Image
                            src={product.images[selectedImageIndex] || 'https://via.placeholder.com/600'}
                            alt={product.title}
                            fill
                            className="object-contain object-center"
                        />
                        {product.status === 'Sold' && (
                            <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 text-sm font-bold rounded">
                                SOLD
                            </div>
                        )}
                    </div>
                    {product.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImageIndex(idx)}
                                    className={`relative h-20 w-full rounded-md overflow-hidden border-2 transition-colors ${selectedImageIndex === idx ? 'border-blue-500' : 'border-transparent'
                                        }`}
                                >
                                    <Image
                                        src={img}
                                        alt={`${product.title} ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col space-y-6">
                    <div>
                        <div className="flex justify-between items-start">
                            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
                            <p className="text-2xl font-bold text-blue-600">₹{product.price}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Posted {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })} in <span className="font-semibold text-gray-700">{product.community.name}</span>
                        </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Seller</h3>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                    {product.seller.name.charAt(0).toUpperCase()}
                                </div>
                                <p className="font-medium text-gray-900">{product.seller.name}</p>
                            </div>
                            {user?._id !== product.seller._id && (
                                <Button onClick={handleMessageSeller}>
                                    Message Seller
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Description</h3>
                            <p className="mt-2 text-gray-600 whitespace-pre-line">{product.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Category</h4>
                                <p className="mt-1 text-gray-900">{product.category}</p>
                            </div>
                            {product.condition && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Condition</h4>
                                    <p className="mt-1 text-gray-900">{product.condition}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
