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
        '@GoMarketPlace:products',
      );

      if (productsStoraged) {
        setProducts(JSON.parse(productsStoraged));
      } else {
        setProducts([]);
      }
    }
    loadProducts();
  }, []);

  useEffect(() => {
    async function saveStorageProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    }
    saveStorageProducts();
  }, [products]);

  const increment = useCallback(
    async id => {
      const checkProductExists = products.find(product => product.id === id);

      if (!checkProductExists) {
        throw new Error('Cannot increment an inexistent product');
      }

      checkProductExists.quantity += 1;

      const oldProducts = products.filter(product => product.id !== id);

      setProducts([...oldProducts, checkProductExists]);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const checkProductInCart = products.find(
        productFilter => productFilter.id === product.id,
      );

      const newArrayProducts = [...products, product];

      if (!checkProductInCart) {
        setProducts(newArrayProducts);
      } else {
        increment(checkProductInCart.id);
      }
    },
    [increment, products],
  );

  const decrement = useCallback(
    async id => {
      const checkProductExists = products.find(product => product.id === id);

      if (!checkProductExists) {
        throw new Error('Cannot decrement an inexistent product');
      }

      const oldProducts = products.filter(product => product.id !== id);

      if (checkProductExists.quantity === 1) {
        setProducts(oldProducts);
      } else {
        checkProductExists.quantity -= 1;
        setProducts([...oldProducts, checkProductExists]);
      }
    },
    [products],
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
