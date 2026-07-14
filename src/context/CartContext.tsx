'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Storage from '@/lib/storage';
import { Product } from '@/lib/products';

export interface CartItem {
    product: Product;
    quantity: number;
    color?: string;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: Product, quantity: number, color?: string) => void;
    removeFromCart: (productId: string, color?: string) => void;
    updateQuantity: (productId: string, quantity: number, color?: string) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [mounted, setMounted] = useState(false);

    // Initialize from storage on mount
    useEffect(() => {
        const storedCart = Storage.get('cart');
        if (storedCart) {
            setCartItems(storedCart);
        }
        setMounted(true);
    }, []);

    // Save to storage when cart changes
    useEffect(() => {
        if (mounted) {
            Storage.set('cart', cartItems);
        }
    }, [cartItems, mounted]);

    const addToCart = (product: Product, quantity: number, color?: string) => {
        setCartItems(prev => {
            const existingIndex = prev.findIndex(
                item => item.product.id === product.id && item.color === color
            );

            if (existingIndex > -1) {
                const newCart = [...prev];
                const newQty = newCart[existingIndex].quantity + quantity;
                newCart[existingIndex].quantity = product.stock ? Math.min(product.stock, newQty) : newQty;
                return newCart;
            } else {
                return [...prev, { product, quantity, color }];
            }
        });
    };

    const removeFromCart = (productId: string, color?: string) => {
        setCartItems(prev => prev.filter(
            item => !(item.product.id === productId && item.color === color)
        ));
    };

    const updateQuantity = (productId: string, quantity: number, color?: string) => {
        if (quantity <= 0) {
            removeFromCart(productId, color);
            return;
        }

        setCartItems(prev => prev.map(item => {
            if (item.product.id === productId && item.color === color) {
                const maxQty = item.product.stock || 999;
                return { ...item, quantity: Math.min(maxQty, quantity) };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartCount,
            cartTotal
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
