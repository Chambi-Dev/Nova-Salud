import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, LogOut, Tags, Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

interface Categoria { id: number; nombre: string; }

export default function Categorias() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [cargando, setCargando] = useState(true);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
    const [nombreForm, setNombreForm] = useState('');

    const cargarCategorias = async () => {
        setCargando(true);
        try {
            const respuesta = await api.get('/categorias');
            setCategorias(respuesta.data);
        } catch (error) {
            toast.error("Error al cargar las categorías");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarCategorias(); }, []);

    const abrirModalCrear = () => {
        setCategoriaEditando(null);
        setNombreForm('');
        setModalAbierto(true);
    };

    const abrirModalEditar = (categoria: Categoria) => {
        setCategoriaEditando(categoria);
        setNombreForm(categoria.nombre);
        setModalAbierto(true);
    };

    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (categoriaEditando) {
                await api.patch(`/categorias/${categoriaEditando.id}`, { nombre: nombreForm });
                toast.success('Categoría actualizada con éxito');
            } else {
                await api.post('/categorias', { nombre: nombreForm });
                toast.success('Categoría creada con éxito');
            }
            setModalAbierto(false);
            cargarCategorias();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al guardar la categoría");
        }
    };

    const handleEliminar = async (id: number, nombre: string) => {
        if (window.confirm(`¿Estás seguro de eliminar la categoría "${nombre}"? \n\nAtención: Si esta categoría tiene productos asignados, el sistema podría rechazar la eliminación.`)) {
            try {
                await api.delete(`/categorias/${id}`);
                toast.success('Categoría eliminada con éxito');
                cargarCategorias();
            } catch (error: any) {
                toast.error("No se puede eliminar. Es probable que haya medicamentos usándola.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/inventario')} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-2">
                        <ArrowLeft size={20} />
                        <span className="font-medium">Volver a Inventario</span>
                    </button>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Tags className="text-blue-600" /> Gestión de Categorías
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

            <main className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 font-medium">Administra las clasificaciones de tus medicamentos</p>
                    <button
                        onClick={abrirModalCrear}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} /> Nueva Categoría
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                            <th className="px-6 py-4 font-semibold w-24">ID</th>
                            <th className="px-6 py-4 font-semibold">Nombre de la Categoría</th>
                            <th className="px-6 py-4 font-semibold text-center w-48">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {cargando ? (
                            <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">Cargando categorías...</td></tr>
                        ) : categorias.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">No hay categorías registradas.</td></tr>
                        ) : (
                            categorias.map((cat) => (
                                <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">{cat.id}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{cat.nombre}</td>
                                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                                        <button onClick={() => abrirModalEditar(cat)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Editar"><Edit size={18} /></button>
                                        <button onClick={() => handleEliminar(cat.id, cat.nombre)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </main>

            {modalAbierto && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">
                            {categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
                        </h2>
                        <form onSubmit={handleGuardar} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                                <input required type="text" autoFocus placeholder="Ej: Antibióticos" value={nombreForm} onChange={e => setNombreForm(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setModalAbierto(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}