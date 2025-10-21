"use client";
import Link from "next/link";
import Image from "next/image";
import { Bars3Icon, XMarkIcon, ShoppingCartIcon, InformationCircleIcon, HomeIcon, PhoneIcon, } from "@heroicons/react/24/outline";
import { useSelector, useDispatch } from "react-redux";
import { openCart } from "@/redux/slices/cartSlice";
import { useState, useRef } from "react";
import MiniCartPreview from "./MiniCartPreview";
import ThemeToggle from "./ThemeToggle";
import MobileMenuToggle from "./MobileMenuToggle";
import MobileMenu from "./MobileMenu";
export default function Navbar({ onCartClick }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dispatch = useDispatch();
    const totalQuantity = useSelector((state) =>
        state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
    );
    const [hoveringCart, setHoveringCart] = useState(false);
    const hoverTimeoutRef = useRef(null);
    const handleMouseEnter = () => {
        clearTimeout(hoverTimeoutRef.current);
        setHoveringCart(true);
    };
    const handleMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveringCart(false);
        }, 250);
    };
    return (
        <div className="w-full absolute top-0 z-20 px-6 py-4 flex justify-between items-center bg-transparent sm:px-6">
            <div className="flex w-full justify-between items-center sm:w-auto">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/assets/images/logo/logo_image.png"
                        alt="Shell Stories Logo"
                        width={40}
                        height={40}
                        className="rounded-full border shadow hover:scale-105 transition"
                    />

                    <span className="text-indigo-600 font-playfair font-bold tracking-wide leading-tight">
                        <span className="block text-xl sm:text-2xl">Shell Stories</span>
                        <span className="block text-xl sm:text-2xl">Studio</span>
                    </span>
                </Link>
            </div>
            <MobileMenuToggle isOpen={isMobileMenuOpen} toggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden" />
                <nav className="hidden md:flex ml-auto flex items-center gap-2 md:gap-4">
                    <ThemeToggle /> {/* 👈 Move this here, before nav links */}
                    <Link href="/" className="font-poppins flex items-center gap-1 text-gray-700 hover:text-indigo-600">
                        <HomeIcon className="w-5 h-5" />
                        Home
                    </Link>
                    <Link href="/products" className="font-poppins flex items-center gap-1 text-gray-700 hover:text-indigo-600">
                        🐚Products
                    </Link>
                    <Link href="/about" className="font-poppins flex items-center gap-1 text-gray-700 hover:text-indigo-600">
                        <InformationCircleIcon className="w-5 h-5" />
                        About
                    </Link>
                    <Link href="/contact" className="font-poppins flex items-center gap-1 text-gray-700 hover:text-indigo-600">
                        <PhoneIcon className="w-5 h-5" />
                        Contact
                    </Link>
                    {/* 🛒 Cart Button + MiniCart Preview */}
                    <div
                        className="relative group inline-block"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button
                            onClick={() => dispatch(openCart())}
                            className="relative flex items-center gap-2 text-gray-700 hover:text-indigo-600"
                        >
                            <div className="relative flex items-center gap-1">
                                <ShoppingCartIcon className="w-5 h-5" />
                                <span className="font-poppins">Cart</span>
                            </div>

                            {totalQuantity > 0 && (
                                <span className="font-inter ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {totalQuantity}
                                </span>
                            )}
                        </button>

                        {/* ▼ Cart Preview Triangle */}

                        {/* ✅ Show MiniCart on hover */}
                        {hoveringCart && (
                            <div
                                className="absolute top-full right-0 mt-3 w-64 max-h-64 overflow-y-auto shadow-xl border 
                                   rounded-lg bg-white z-50 transition-all duration-200 transform scale-100"
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <MiniCartPreview onCartClick={() => dispatch(openCart())} />
                            </div>
                        )}
                    </div>
                </nav >
                {/* Mobile Dropdown Navigation */}
                
                <MobileMenu 
                isOpen={isMobileMenuOpen}
                setIsOpen={setIsMobileMenuOpen}
                totalQuantity={totalQuantity}
                />
            
            </div>
    );
}

