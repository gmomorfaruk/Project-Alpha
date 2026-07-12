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
    hasOffer?: boolean;
    offerText?: string;
    offerColor?: string;
}

export const defaultProducts: Product[] = [
    {
        id: '1',
        name: 'Smartphone Pro Max',
        category: 'mobile',
        price: 52500,
        previousPrice: 75000,
        returnRate: 15,
        duration: 30,
        stock: 50,
        minUnits: 1,
        description: 'Latest flagship smartphone with advanced triple-lens camera, titanium body, dynamic island, and high-performance processor.',
        image: 'fa-mobile-alt',
        active: true,
        colors: ['Midnight Black', 'Deep Purple', 'Titanium Gray'],
        hasOffer: true,
        offerText: '30% OFF',
        offerColor: '#ef4444',
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Laptop EliteBook Ultra',
        category: 'computer',
        price: 90000,
        previousPrice: 120000,
        returnRate: 18,
        duration: 45,
        stock: 25,
        minUnits: 1,
        description: 'Ultra-slim laptop featuring a gorgeous 4K display, 32GB RAM, 1TB SSD, and 12-hour battery life for high-productivity professionals.',
        image: 'fa-laptop',
        active: true,
        colors: ['Space Gray', 'Silver Metallic'],
        hasOffer: true,
        offerText: '25% OFF',
        offerColor: '#2563eb',
        createdAt: new Date().toISOString()
    },
    {
        id: '3',
        name: 'Smart Watch Pro',
        category: 'accessories',
        price: 5000,
        previousPrice: 10000,
        returnRate: 12,
        duration: 20,
        stock: 100,
        minUnits: 1,
        description: 'Advanced fitness smart watch with real-time heart rate monitoring, built-in GPS, sleep analysis, and water resistance.',
        image: 'fa-clock',
        active: true,
        colors: ['Obsidian Black', 'Rose Gold', 'Ocean Blue'],
        hasOffer: true,
        offerText: '50% OFF',
        offerColor: '#d97706',
        createdAt: new Date().toISOString()
    },
    {
        id: '4',
        name: 'Noise-Canceling Headphones',
        category: 'electronics',
        price: 12000,
        previousPrice: 20000,
        returnRate: 14,
        duration: 25,
        stock: 40,
        minUnits: 1,
        description: 'Premium over-ear wireless headphones with active noise cancellation, high-fidelity sound, and 40 hours of continuous playback.',
        image: 'fa-headphones',
        active: true,
        colors: ['Matte Black', 'Silver'],
        hasOffer: true,
        offerText: '40% OFF',
        offerColor: '#7c3aed',
        createdAt: new Date().toISOString()
    },
    {
        id: '5',
        name: 'Gaming Console X',
        category: 'electronics',
        price: 45500,
        previousPrice: 70000,
        returnRate: 20,
        duration: 60,
        stock: 15,
        minUnits: 1,
        description: 'Next-generation gaming console featuring ray-tracing graphics, 8K support, custom ultra-fast SSD, and immersive wireless controllers.',
        image: 'fa-gamepad',
        active: true,
        colors: ['Carbon Black', 'White Edition'],
        hasOffer: true,
        offerText: '35% OFF',
        offerColor: '#10b981',
        createdAt: new Date().toISOString()
    },
    {
        id: '6',
        name: 'Smart Home Blender Set',
        category: 'home',
        price: 10000,
        previousPrice: 12500,
        returnRate: 16,
        duration: 35,
        stock: 30,
        minUnits: 1,
        description: 'High-powered smart kitchen blender with automated touch presets, multiple cup attachments, and easy self-cleaning cycle.',
        image: 'fa-blender',
        active: true,
        colors: ['Stainless Steel', 'Crimson Red'],
        hasOffer: true,
        offerText: '20% OFF',
        offerColor: '#db2777',
        createdAt: new Date().toISOString()
    }
];
