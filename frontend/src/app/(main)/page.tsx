"use client";

import { useEffect, useState } from 'react';
import api from '@/services/api';
import ProductCard from '@/components/ProductCard';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/products');
                setProducts(res.data);
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchProducts();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to MohallaMart</h1>
                <p className="text-lg text-gray-600 mb-8">
                    Your local community marketplace. Join communities, buy, sell, and chat!
                </p>
                <div className="space-x-4">
                    <Link href="/login">
                        <Button size="lg">Get Started</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="text-center py-10">Loading feed...</div>;
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-gray-900">No products found</h2>
                <p className="text-gray-600 mt-2">Join more communities or post a product!</p>
                <Link href="/communities">
                    <Button className="mt-4" variant="outline">Browse Communities</Button>
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Latest Finds</h2>
                {/* Could add a filter or post button here */}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product: any) => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>
        </div>
    );
}
