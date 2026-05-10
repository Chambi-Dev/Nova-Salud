import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, LogOut, Package, Plus, Search, AlertCircle, Calendar, Tags, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

interface Categoria { id: number; nombre: string; }
interface Lote { stockActual: number; activo: boolean; }
interface Producto { id: number; codigo: string; nombre: string; precioVentaActual: number; stockMinimo: number; categoria: Categoria; lotes: Lote[]; }

export default function Inventario() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);

    const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
    const [modalLoteAbierto, setModalLoteAbierto] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

    const [dropdownCategoriaAbierto, setDropdownCategoriaAbierto] = useState(false);
    const [busquedaCategoria, setBusquedaCategoria] = useState('');

    const [formProducto, setFormProducto] = useState({ codigo: '', nombre: '', categoriaId: '', porcentajeGanancia: '', stockMinimo: '' });
    const [formLote, setFormLote] = useState({ codigoLote: '', precioCompra: '', cantidadInicial: '', fechaVencimiento: '' });

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [resProductos, resCategorias] = await Promise.all([
                api.get('/productos'),
                api.get('/categorias')
            ]);
            setProductos(resProductos.data);
            setCategorias(resCategorias.data);
        } catch (error) {
            toast.error("Error al cargar el inventario");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const productosFiltrados = useMemo(() => {
        if (!busqueda) return productos;
        const termino = busqueda.toLowerCase();
        return productos.filter(p => p.nombre.toLowerCase().includes(termino) || p.codigo.includes(termino));
    }, [productos, busqueda]);

    const categoriasFiltradas = useMemo(() => {
        if (!busquedaCategoria) return categorias;
        return categorias.filter(c => c.nombre.toLowerCase().includes(busquedaCategoria.toLowerCase()));
    }, [categorias, busquedaCategoria]);

    const handleCrearProducto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formProducto.categoriaId) {
            toast.error("Por favor, seleccione una categoría.");
            return;
        }

        try {
            await api.post('/productos', {
                codigo: formProducto.codigo,
                nombre: formProducto.nombre,
                categoriaId: Number(formProducto.categoriaId),
                porcentajeGanancia: Number(formProducto.porcentajeGanancia),
                stockMinimo: Number(formProducto.stockMinimo)
            });
            toast.success('Producto registrado correctamente');
            setModalProductoAbierto(false);
            setFormProducto({ codigo: '', nombre: '', categoriaId: '', porcentajeGanancia: '', stockMinimo: '' });
            setBusquedaCategoria('');
            cargarDatos();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al registrar producto");
        }
    };

    const handleCrearLote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productoSeleccionado) return;
        const fechaFormateada = new Date(formLote.fechaVencimiento).toISOString();

        try {
            await api.post('/lotes', {
                productoId: productoSeleccionado.id,
                codigoLote: formLote.codigoLote,
                precioCompra: Number(formLote.precioCompra),
                cantidadInicial: Number(formLote.cantidadInicial),
                fechaVencimiento: fechaFormateada
            });
            toast.success('Lote ingresado. Stock y Precios actualizados.');
            setModalLoteAbierto(false);
            setFormLote({ codigoLote: '', precioCompra: '', cantidadInicial: '', fechaVencimiento: '' });
            setProductoSeleccionado(null);
            cargarDatos();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al ingresar lote");
        }
    };

    const abrirModalLote = (producto: Producto) => {
        setProductoSeleccionado(producto);
        setModalLoteAbierto(true);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-2">
                        <ArrowLeft size={20} />
                        <span className="font-medium">Volver a Caja</span>
                    </button>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="text-blue-600" /> Gestor de Inventario
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-600">
                        <span className="font-medium">{user?.nombre}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">{user?.rol}</span>
                    </div>
                    <button onClick={logout} className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Salir</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar medicamento..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/categorias')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors border border-slate-200"
                        >
                            <Tags size={20} /> Categorías
                        </button>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <button
                            onClick={() => setModalProductoAbierto(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Plus size={20} /> Nuevo Medicamento
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                                <th className="px-6 py-4 font-semibold">Código</th>
                                <th className="px-6 py-4 font-semibold">Medicamento</th>
                                <th className="px-6 py-4 font-semibold">Categoría</th>
                                <th className="px-6 py-4 font-semibold text-right">Precio Venta</th>
                                <th className="px-6 py-4 font-semibold text-center">Stock Actual</th>
                                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {cargando ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Cargando inventario...</td></tr>
                            ) : productosFiltrados.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No se encontraron productos.</td></tr>
                            ) : (
                                productosFiltrados.map((prod) => {
                                    const stockTotal = prod.lotes?.reduce((acc, lote) => acc + lote.stockActual, 0) || 0;
                                    const stockBajo = stockTotal <= prod.stockMinimo;

                                    return (
                                        <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-500">{prod.codigo}</td>
                                            <td className="px-6 py-4 font-medium text-slate-800">{prod.nombre}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{prod.categoria?.nombre || 'Sin categoría'}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800 text-right">S/ {Number(prod.precioVentaActual).toFixed(2)}</td>
                                            <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${stockBajo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {stockBajo && <AlertCircle size={14} />} {stockTotal}
                          </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => abrirModalLote(prod)}
                                                    className="bg-slate-100 hover:bg-slate-200 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 mx-auto"
                                                >
                                                    <Plus size={16} /> Ingresar Lote
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {modalProductoAbierto && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Registrar Medicamento</h2>
                        <form onSubmit={handleCrearProducto} className="space-y-4">
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Código de Barras</label><input required type="text" value={formProducto.codigo} onChange={e => setFormProducto({...formProducto, codigo: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" /></div>
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto</label><input required type="text" value={formProducto.nombre} onChange={e => setFormProducto({...formProducto, nombre: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" /></div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                                <div
                                    className="w-full p-2 border border-slate-300 rounded-lg bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors"
                                    onClick={() => setDropdownCategoriaAbierto(!dropdownCategoriaAbierto)}
                                >
                  <span className={formProducto.categoriaId ? "text-slate-800 font-medium" : "text-slate-500"}>
                    {formProducto.categoriaId
                        ? categorias.find(c => c.id.toString() === formProducto.categoriaId)?.nombre
                        : "Seleccione o busque una..."}
                  </span>
                                    <ChevronDown size={18} className={`text-slate-400 transition-transform ${dropdownCategoriaAbierto ? 'rotate-180' : ''}`} />
                                </div>
                                {dropdownCategoriaAbierto && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden">
                                        <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                                            <Search size={16} className="text-slate-400" />
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Buscar categoría..."
                                                className="w-full bg-transparent outline-none text-sm text-slate-700"
                                                value={busquedaCategoria}
                                                onChange={(e) => setBusquedaCategoria(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                            />
                                        </div>
                                        <ul className="max-h-48 overflow-y-auto">
                                            {categoriasFiltradas.length === 0 ? (
                                                <li className="p-3 text-sm text-slate-500 text-center italic">Categoría no encontrada</li>
                                            ) : (
                                                categoriasFiltradas.map(cat => (
                                                    <li
                                                        key={cat.id}
                                                        className="p-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-slate-50 last:border-0"
                                                        onClick={() => {
                                                            setFormProducto({...formProducto, categoriaId: cat.id.toString()});
                                                            setDropdownCategoriaAbierto(false);
                                                            setBusquedaCategoria('');
                                                        }}
                                                    >
                                                        {cat.nombre}
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1"><label className="block text-sm font-medium text-slate-700 mb-1">% Ganancia</label><input required type="number" min="0" value={formProducto.porcentajeGanancia} onChange={e => setFormProducto({...formProducto, porcentajeGanancia: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" /></div>
                                <div className="flex-1"><label className="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo</label><input required type="number" min="0" value={formProducto.stockMinimo} onChange={e => setFormProducto({...formProducto, stockMinimo: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" /></div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setModalProductoAbierto(false); setDropdownCategoriaAbierto(false); }} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalLoteAbierto && productoSeleccionado && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-1">Ingresar Lote</h2>
                        <p className="text-sm text-slate-500 mb-4 border-b pb-2">{productoSeleccionado.nombre}</p>
                        <form onSubmit={handleCrearLote} className="space-y-4">
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Código de Lote</label><input required type="text" value={formLote.codigoLote} onChange={e => setFormLote({...formLote, codigoLote: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" /></div>
                            <div className="flex gap-4">
                                <div className="flex-1"><label className="block text-sm font-medium text-slate-700 mb-1">Precio Compra</label><input required type="number" step="0.01" min="0" value={formLote.precioCompra} onChange={e => setFormLote({...formLote, precioCompra: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" /></div>
                                <div className="flex-1"><label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label><input required type="number" min="1" value={formLote.cantidadInicial} onChange={e => setFormLote({...formLote, cantidadInicial: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" /></div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input required type="date" value={formLote.fechaVencimiento} onChange={e => setFormLote({...formLote, fechaVencimiento: e.target.value})} className="w-full pl-10 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setModalLoteAbierto(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors">Ingresar Stock</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}