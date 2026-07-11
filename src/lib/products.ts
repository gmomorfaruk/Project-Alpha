export interface Product {
    id: string;
    name: string;
    category: 'electronics' | 'fashion' | 'home' | 'health' | 'mobile' | 'computer' | 'accessories' | 'other';
    price: number;            // Offered Price
    previousPrice?: number;   // Previous Price
    returnRate: number;       // Auto-sell Return Rate
    duration: number;         // Duration in days
    stock: number;
    description: string;
    image?: string;           // icon/image
    active: boolean;
    colors?: string[];        // Color options
    createdAt?: string;
    minUnits?: number;
}

export const defaultProducts: Product[] = [
    {
        id: '1',
        name: 'Smartphone Pro Max',
        category: 'mobile',
        price: 50000,
        previousPrice: 60000,
        returnRate: 15,
        duration: 30,
        stock: 50,
        minUnits: 1,
        description: 'Latest flagship smartphone with advanced triple-lens camera, titanium body, dynamic island, and high-performance processor.',
        image: 'fa-mobile-alt',
        active: true,
        colors: ['Midnight Black', 'Deep Purple', 'Titanium Gray'],
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Laptop EliteBook Ultra',
        category: 'computer',
        price: 85000,
        previousPrice: 95000,
        returnRate: 18,
        duration: 45,
        stock: 25,
        minUnits: 1,
        description: 'Ultra-slim laptop featuring a gorgeous 4K display, 32GB RAM, 1TB SSD, and 12-hour battery life for high-productivity professionals.',
        image: 'fa-laptop',
        active: true,
        colors: ['Space Gray', 'Silver Metallic'],
        createdAt: new Date().toISOString()
    },
    {
        id: '3',
        name: 'Smart Watch Pro',
        category: 'accessories',
        price: 5000,
        previousPrice: 7500,
        returnRate: 12,
        duration: 20,
        stock: 100,
        minUnits: 1,
        description: 'Advanced fitness smart watch with real-time heart rate monitoring, built-in GPS, sleep analysis, and water resistance.',
        image: 'fa-clock',
        active: true,
        colors: ['Obsidian Black', 'Rose Gold', 'Ocean Blue'],
        createdAt: new Date().toISOString()
    },
    {
        id: '4',
        name: 'Noise-Canceling Headphones',
        category: 'electronics',
        price: 12000,
        previousPrice: 15000,
        returnRate: 14,
        duration: 25,
        stock: 40,
        minUnits: 1,
        description: 'Premium over-ear wireless headphones with active noise cancellation, high-fidelity sound, and 40 hours of continuous playback.',
        image: 'fa-headphones',
        active: true,
        colors: ['Matte Black', 'Silver'],
        createdAt: new Date().toISOString()
    },
    {
        id: '5',
        name: 'Gaming Console X',
        category: 'electronics',
        price: 45000,
        previousPrice: 55000,
        returnRate: 20,
        duration: 60,
        stock: 15,
        minUnits: 1,
        description: 'Next-generation gaming console featuring ray-tracing graphics, 8K support, custom ultra-fast SSD, and immersive wireless controllers.',
        image: 'fa-gamepad',
        active: true,
        colors: ['Carbon Black', 'White Edition'],
        createdAt: new Date().toISOString()
    },
    {
        id: '6',
        name: 'Smart Home Blender Set',
        category: 'home',
        price: 8000,
        previousPrice: 10000,
        returnRate: 16,
        duration: 35,
        stock: 30,
        minUnits: 1,
        description: 'High-powered smart kitchen blender with automated touch presets, multiple cup attachments, and easy self-cleaning cycle.',
        image: 'fa-blender',
        active: true,
        colors: ['Stainless Steel', 'Crimson Red'],
        createdAt: new Date().toISOString()
    }
];
