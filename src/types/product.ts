// src/types/product.ts
export interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  rating: number;
  features: string[];
  reviews: number;
  category: string;
  image: string;
  popularity: number;
  date: string;
  discount?: number;
  originalPrice?: number;
  inStock?: boolean;
  stock?: number;
}

export interface Category {
  slug: string;
  name: string;
}

export interface PriceRange {
  min: number;
  max: number;
  label: string;
}