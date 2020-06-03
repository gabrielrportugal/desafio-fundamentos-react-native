import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStoraged = await AsyncStorage.getItem(
        '@GoMarketPlace:product',
      );

      if (productsStoraged) {
        setProducts([...JSON.parse(productsStoraged)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = [...products];
      const productIndex = products.findIndex(product => product.id === id);

      if (productIndex > -1) {
        newProducts[productIndex].quantity += 1;

        setProducts(newProducts);
      }

      await AsyncStorage.setItem('@GoMarketPlace', JSON.stringify(newProducts));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      let newProducts = [...products];
      const productIndex = products.findIndex(product => product.id === id);

      if (productIndex > -1) {
        if (products[productIndex].quantity === 1) {
          newProducts = products.filter(product => product.id !== id);
          setProducts(newProducts);
        } else {
          newProducts[productIndex].quantity -= 1;

          setProducts(newProducts);
        }
      }

      await AsyncStorage.setItem('@GoMarketPlace', JSON.stringify(newProducts));
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const productIndex = products.findIndex(p => p.id === product.id);

      if (productIndex < 0) {
        setProducts(prevState => [...prevState, { ...product, quantity: 1 }]);
        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify([...products, { ...product, quantity: 1 }]),
        );
      } else {
        increment(product.id);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
