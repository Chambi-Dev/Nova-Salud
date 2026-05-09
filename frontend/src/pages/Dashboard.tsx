import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Search, ShoppingCart, User as UserIcon, Plus, Minus, Trash2, ChartBar, Package, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <-- IMPORTACIÓN CORREGIDA PARA VITE
import api from '../api/axios';
import CobroModal from '../components/CobroModal';

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
    const navigate = useNavigate();

    const [productos, setProductos] = useState<Producto[]>([]);
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [busqueda, setBusqueda] = useState('');

    const [modalAbierto, setModalAbierto] = useState(false);

    useEffect(() => {
        const cargarProductos = async () => {
            try {
                const respuesta = await api.get('/productos');
                setProductos(respuesta.data);
            } catch (error) {
                toast.error("Error al cargar el catálogo de productos");
            }
        };
        cargarProductos();
    }, []);

    const productosFiltrados = useMemo(() => {
        if (!busqueda) return productos;
        const termino = busqueda.toLowerCase();
        return productos.filter(p =>
            p.nombre.toLowerCase().includes(termino) || p.codigo.includes(termino)
        );
    }, [productos, busqueda]);

    const agregarAlCarrito = (producto: Producto) => {
        setCarrito((prev) => {
            const existe = prev.find((item) => item.id === producto.id);
            if (existe) {
                return prev.map((item) =>
                    item.id === producto.id
                        ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * Number(item.precioVentaActual) }
                        : item
                );
            }
            return [...prev, { ...producto, cantidad: 1, subtotal: Number(producto.precioVentaActual) }];
        });
    };

    const modificarCantidad = (id: number, delta: number) => {
        setCarrito((prev) => {
            return prev.map((item) => {
                if (item.id === id) {
                    const nuevaCantidad = item.cantidad + delta;
                    if (nuevaCantidad <= 0) return null;
                    return {
                        ...item,
                        cantidad: nuevaCantidad,
                        subtotal: nuevaCantidad * Number(item.precioVentaActual)
                    };
                }
                return item;
            }).filter(Boolean) as ItemCarrito[];
        });
    };

    const totalAPagar = carrito.reduce((suma, item) => suma + item.subtotal, 0);

    // LOGICA DEL PDF CORREGIDA
    const generarTicketPDF = (clienteNombre: string) => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 250]
        });

        // Cabecera
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('NOVA SALUD POS', 40, 10, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('RUC: 20123456789', 40, 15, { align: 'center' });
        doc.text('Av. Principal 123 - Arequipa', 40, 19, { align: 'center' });

        doc.text('--------------------------------------------------', 40, 24, { align: 'center' });

        // Datos Venta
        doc.text(`Fecha: ${new Date().toLocaleString('es-PE')}`, 5, 29);
        doc.text(`Cajero: ${user?.nombre || 'Admin'}`, 5, 33);
        doc.text(`Cliente: ${clienteNombre}`, 5, 37);

        const tableData = carrito.map(item => [
            item.cantidad.toString(),
            item.nombre.substring(0, 15),
            item.subtotal.toFixed(2)
        ]);

        // USO CORRECTO DE AUTOTABLE PARA VITE
        autoTable(doc, {
            startY: 42,
            head: [['Cant', 'Descrip', 'Total']],
            body: tableData,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 1 },
            headStyles: { fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 40 },
                2: { cellWidth: 15, halign: 'right' }
            },
            margin: { left: 5, right: 5 }
        });

        const finalY = (doc as any).lastAutoTable.finalY || 50;

        doc.text('--------------------------------------------------', 40, finalY + 4, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL: S/ ${totalAPagar.toFixed(2)}`, 75, finalY + 10, { align: 'right' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text('¡Gracias por su compra!', 40, finalY + 20, { align: 'center' });
        doc.text('Conserve su ticket.', 40, finalY + 24, { align: 'center' });

        doc.save(`Ticket_NovaSalud_${new Date().getTime()}.pdf`);
    };

    const procesarVentaFinal = async (clienteId: number | null, clienteNombre: string) => {
        try {
            const detallesVenta = carrito.map(item => ({
                productoId: item.id,
                cantidad: item.cantidad
            }));

            // 1. Guardar en Base de Datos
            await api.post('/ventas', {
                clienteId: clienteId,
                detalles: detallesVenta
            });

            // 2. Imprimir el Ticket
            generarTicketPDF(clienteNombre);

            // 3. Limpiar y notificar
            setModalAbierto(false);
            setCarrito([]);
            toast.success("¡Venta exitosa! Generando ticket...");

            const respuesta = await api.get('/productos');
            setProductos(respuesta.data);

        } catch (error: any) {
            console.error("Error al procesar la venta:", error);
            // Si el error es del backend, mostramos su mensaje. Si es del PDF, mostramos un error genérico.
            const mensajeError = error.response?.data?.message || "Error interno al generar la venta o el PDF";
            toast.error(mensajeError);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                        <ShoppingCart size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">Nova Salud POS</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/inventario')}
                            className="flex items-center gap-2 text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors font-medium border border-slate-200"
                        >
                            <Package size={18} />
                            <span>Inventario</span>
                        </button>
                        <button
                            onClick={() => navigate('/historial')}
                            className="flex items-center gap-2 text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors font-medium border border-slate-200"
                        >
                            <ChartBar size={18} />
                            <span>Historial</span>
                        </button>
                        {user?.rol === 'ADMIN' && (
                            <button
                                onClick={() => navigate('/usuarios')}
                                className="flex items-center gap-2 text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg transition-colors font-medium border border-purple-200"
                            >
                                <Users size={18} />
                                <span>Usuarios</span>
                            </button>
                        )}
                    </div>
                    <div className="h-6 w-px bg-slate-300 mx-1"></div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <UserIcon size={18} />
                        <span className="font-medium">{user?.nombre}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${user?.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {user?.rol}
            </span>
                    </div>
                    <button onClick={logout} className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Salir</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden p-4 gap-4">
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
                    <div className="flex-1 overflow-y-auto p-4">
                        {productosFiltrados.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                No se encontraron medicamentos.
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4">
                                {productosFiltrados.map((prod) => (
                                    <button
                                        key={prod.id}
                                        onClick={() => agregarAlCarrito(prod)}
                                        className="bg-white border border-slate-200 p-4 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between h-32 group"
                                    >
                                        <div>
                                            <span className="text-xs text-slate-400 block mb-1">{prod.codigo}</span>
                                            <h3 className="font-semibold text-slate-800 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">
                                                {prod.nombre}
                                            </h3>
                                        </div>
                                        <div className="text-lg font-bold text-blue-600">
                                            S/ {Number(prod.precioVentaActual).toFixed(2)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="w-1/3 bg-white rounded-xl shadow-sm flex flex-col">
                    <div className="p-4 border-b bg-slate-50 rounded-t-xl">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            Detalle de Venta
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {carrito.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <ShoppingCart size={48} className="mb-4 opacity-20" />
                                <p>El carrito está vacío</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {carrito.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{item.nombre}</h4>
                                            <div className="text-xs text-slate-500">S/ {Number(item.precioVentaActual).toFixed(2)} c/u</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
                                                <button onClick={() => modificarCantidad(item.id, -1)} className="p-1 text-slate-500 hover:bg-slate-100 rounded-l-lg transition-colors"><Minus size={16}/></button>
                                                <span className="w-8 text-center text-sm font-bold text-slate-700">{item.cantidad}</span>
                                                <button onClick={() => modificarCantidad(item.id, 1)} className="p-1 text-slate-500 hover:bg-slate-100 rounded-r-lg transition-colors"><Plus size={16}/></button>
                                            </div>
                                            <div className="font-bold text-blue-600 w-16 text-right">
                                                S/ {item.subtotal.toFixed(2)}
                                            </div>
                                            <button onClick={() => modificarCantidad(item.id, -item.cantidad)} className="text-red-400 hover:text-red-600 p-1 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t bg-slate-50 rounded-b-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold text-slate-600 text-lg">Total a Pagar</span>
                            <span className="text-3xl font-bold text-slate-800">S/ {totalAPagar.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={() => setModalAbierto(true)}
                            disabled={carrito.length === 0}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-md text-lg"
                        >
                            Cobrar Venta
                        </button>
                    </div>
                </section>
            </main>

            <CobroModal
                isOpen={modalAbierto}
                onClose={() => setModalAbierto(false)}
                total={totalAPagar}
                onConfirmar={procesarVentaFinal}
            />
        </div>
    );
}