import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Product {
    _id: string;
    title: string;
    price: number;
    images: string[];
    createdAt: string;
    community: {
        _id: string;
        name: string;
    };
    seller: {
        _id: string;
        name: string;
    };
    status: string;
}

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    return (
        <Link href={`/products/${product._id}`}>
            <div className="group relative bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-h-4 aspect-w-3 bg-gray-200 sm:aspect-none group-hover:opacity-75 sm:h-56 relative w-full h-48">
                    <Image
                        src={product.images[0] || 'https://via.placeholder.com/300'}
                        alt={product.title}
                        fill
                        className="object-cover object-center"
                    />
                    {product.status === 'Sold' && (
                        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-bold rounded">
                            SOLD
                        </div>
                    )}
                </div>
                <div className="flex-1 p-4 space-y-2 flex flex-col">
                    <h3 className="text-sm font-medium text-gray-900">
                        {product.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{product.community?.name}</p>
                    <div className="flex-1 flex flex-col justify-end">
                        <p className="text-lg font-medium text-gray-900">₹{product.price}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
}
