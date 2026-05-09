import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, LogOut, TrendingUp, ReceiptText, Calendar } from 'lucide-react';
import api from '../api/axios';

interface Cliente {
    numeroDocumento: string;
    nombreRazon: string;
}

interface Usuario {
    nombre: string;
}

interface Venta {
    id: number;
    total: number;
    fechaVenta: string;
    estado: string;
    cliente: Cliente | null;
    usuario: Usuario;
}

export default function HistorialVentas() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const [ventas, setVentas] = useState<Venta[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarVentas = async () => {
            try {
                const respuesta = await api.get('/ventas');
                setVentas(respuesta.data);
            } catch (error) {
                console.error("Error al cargar el historial", error);
            } finally {
                setCargando(false);
            }
        };
        cargarVentas();
    }, []);

    // Matemáticas para los indicadores
    const ingresosTotales = ventas.reduce((suma, venta) => suma + Number(venta.total), 0);
    const cantidadVentas = ventas.length;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* HEADER */}
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Volver a Caja</span>
                    </button>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ReceiptText className="text-blue-600" /> Historial de Ventas
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-600">
                        <span className="font-medium">{user?.nombre}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
              {user?.rol}
            </span>
                    </div>
                    <button onClick={logout} className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Salir</span>
                    </button>
                </div>
            </header>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">

                {/* Tarjetas de Indicadores (KPIs) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="bg-green-100 p-4 rounded-xl text-green-600">
                            <TrendingUp size={32} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-medium text-sm">Ingresos Totales</p>
                            <h2 className="text-3xl font-bold text-slate-800">S/ {ingresosTotales.toFixed(2)}</h2>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
                            <ReceiptText size={32} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-medium text-sm">Ventas Realizadas</p>
                            <h2 className="text-3xl font-bold text-slate-800">{cantidadVentas}</h2>
                        </div>
                    </div>
                </div>

                {/* Tabla de Ventas */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
                    <div className="p-5 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 text-lg">Últimas Transacciones</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                                <th className="px-6 py-4 font-semibold">Nº Venta</th>
                                <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                                <th className="px-6 py-4 font-semibold">Cliente</th>
                                <th className="px-6 py-4 font-semibold">Cajero</th>
                                <th className="px-6 py-4 font-semibold text-right">Total</th>
                                <th className="px-6 py-4 font-semibold text-center">Estado</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {cargando ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                        Cargando historial...
                                    </td>
                                </tr>
                            ) : ventas.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                        No hay ventas registradas aún.
                                    </td>
                                </tr>
                            ) : (
                                ventas.map((venta) => (
                                    <tr key={venta.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            # {String(venta.id).padStart(5, '0')}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                                            <Calendar size={16} className="text-slate-400" />
                                            {new Date(venta.fechaVenta).toLocaleString('es-PE')}
                                        </td>
                                        <td className="px-6 py-4">
                                            {venta.cliente ? (
                                                <div>
                                                    <p className="font-medium text-slate-800">{venta.cliente.nombreRazon}</p>
                                                    <p className="text-xs text-slate-500">{venta.cliente.numeroDocumento}</p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">Venta al paso</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {venta.usuario.nombre}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-800 text-right">
                                            S/ {Number(venta.total).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                          {venta.estado}
                        </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    );
}