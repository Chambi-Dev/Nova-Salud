import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, Search, ShoppingCart, User as UserIcon } from 'lucide-react';
import api from '../api/axios';

// Interfaces basadas en tu Backend
interface Producto {
    id: number;
    codigo: string;
    nombre: string;
    precioVentaActual: number;
}

interface ItemCarrito extends Producto {
    cantidad: number;
    subtotal: number;
}

export default function Dashboard() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const [productos, setProductos] = useState<Producto[]>([]);
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [busqueda, setBusqueda] = useState('');

    // Cargar productos al iniciar la pantalla
    useEffect(() => {
        const cargarProductos = async () => {
            try {
                const respuesta = await api.get('/productos');
                setProductos(respuesta.data);
            } catch (error) {
                console.error("Error al cargar productos", error);
            }
        };
        cargarProductos();
    }, []);

    // Función temporal para agregar al carrito (la mejoraremos luego)
    const agregarAlCarrito = (producto: Producto) => {
        console.log("Agregando:", producto.nombre);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* HEADER / BARRA SUPERIOR */}
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                        <ShoppingCart size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">Nova Salud POS</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-600">
                        <UserIcon size={18} />
                        <span className="font-medium">{user?.nombre}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {user?.rol}
            </span>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Salir</span>
                    </button>
                </div>
            </header>

            {/* CONTENIDO PRINCIPAL: Pantalla Dividida */}
            <main className="flex-1 flex overflow-hidden p-4 gap-4">

                {/* PANEL IZQUIERDO: Catálogo de Productos */}
                <section className="w-2/3 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por código o nombre del medicamento..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Cuadrícula de Productos */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-3 gap-4">
                            {productos.map((prod) => (
                                <button
                                    key={prod.id}
                                    onClick={() => agregarAlCarrito(prod)}
                                    className="bg-white border border-slate-200 p-4 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between h-32"
                                >
                                    <div>
                                        <span className="text-xs text-slate-400 block mb-1">{prod.codigo}</span>
                                        <h3 className="font-semibold text-slate-800 line-clamp-2 leading-tight">
                                            {prod.nombre}
                                        </h3>
                                    </div>
                                    <div className="text-lg font-bold text-blue-600">
                                        S/ {Number(prod.precioVentaActual).toFixed(2)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* PANEL DERECHO: El Ticket / Carrito */}
                <section className="w-1/3 bg-white rounded-xl shadow-sm flex flex-col">
                    <div className="p-4 border-b bg-slate-50 rounded-t-xl">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            Detalle de Venta
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-slate-400">
                        {carrito.length === 0 ? (
                            <>
                                <ShoppingCart size={48} className="mb-4 opacity-20" />
                                <p>El carrito está vacío</p>
                            </>
                        ) : (
                            <p>Aquí irán los items</p>
                        )}
                    </div>

                    <div className="p-4 border-t bg-slate-50 rounded-b-xl">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold text-slate-600">Total a Pagar</span>
                            <span className="text-2xl font-bold text-slate-800">S/ 0.00</span>
                        </div>
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
                            Cobrar
                        </button>
                    </div>
                </section>

            </main>
        </div>
    );
}