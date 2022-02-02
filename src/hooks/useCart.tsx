import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}


interface CartContextData {
  cart: Product[];
  addProduct: (product: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const updateStorage = (data: any) => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(data))
  }



  const addProduct = async (productId: number) => {
    try {
      let newcart = [...cart];
      const itemSelected: any = cart.filter(i => i.id == productId)[0];

      const restant = cart.filter(i => i.id != productId);
      const { data: product } = await api.get(`products/${productId}`);
      const { data: stock } = await api.get(`stock/${productId}`)

      if (itemSelected && itemSelected.amount >= stock.amount || stock.amount == 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (itemSelected) {
        newcart = [...restant, { ...itemSelected, amount: itemSelected.amount + 1 }];
      } else {
        newcart = [...restant, { ...product, amount: 1 }];
      }
      setCart(newcart);
      updateStorage(newcart);

    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const exists = cart.filter(item => item.id == productId)[0];
      if (!exists) {
        throw new Error();
      }
      const restant = cart.filter(item => item.id != productId);

      setCart(restant);
      updateStorage(restant);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount <= 0) {
        return;
      }

      const productIndex = cart.findIndex(item => item.id == productId);


      const { data: stock } = await api.get(`stock/${productId}`);

      if (cart[productIndex].amount >= stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updateCart = [...cart];
      updateCart[productIndex].amount = amount;

      setCart(updateCart);
      updateStorage(updateCart);

    } catch {

      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
