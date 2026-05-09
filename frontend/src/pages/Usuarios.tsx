import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, LogOut, Users, Plus, Edit, ShieldCheck, UserCircle } from 'lucide-react';
import api from '../api/axios';

interface Usuario {
    id: number;
    nombre: string;
    usuario: string;
    rol: string;
    activo: boolean;
}

export default function Usuarios() {
    const userAuth = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [cargando, setCargando] = useState(true);

    // Estados del Modal
    const [modalAbierto, setModalAbierto] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

    // Formulario
    const [form, setForm] = useState({
        nombre: '',
        usuario: '',
        password: '',
        rol: 'CAJERO'
    });

    const cargarUsuarios = async () => {
        setCargando(true);
        try {
            const respuesta = await api.get('/usuarios'); // Asumiendo que tienes este endpoint en NestJS
            setUsuarios(respuesta.data);
        } catch (error) {
            console.error("Error al cargar usuarios", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const abrirModalCrear = () => {
        setUsuarioEditando(null);
        setForm({ nombre: '', usuario: '', password: '', rol: 'CAJERO' });
        setModalAbierto(true);
    };

    const abrirModalEditar = (usr: Usuario) => {
        setUsuarioEditando(usr);
        setForm({ nombre: usr.nombre, usuario: usr.usuario, password: '', rol: usr.rol });
        setModalAbierto(true);
    };

    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (usuarioEditando) {
                // Al editar, si el password está vacío, no lo enviamos para no sobreescribirlo
                const dataAEnviar = form.password ? form : { nombre: form.nombre, usuario: form.usuario, rol: form.rol };
                await api.patch(`/usuarios/${usuarioEditando.id}`, dataAEnviar);
                alert('Usuario actualizado con éxito');
            } else {
                if (!form.password) {
                    alert('La contraseña es obligatoria para nuevos usuarios');
                    return;
                }
                await api.post('/usuarios', form);
                alert('Usuario creado con éxito');
            }
            setModalAbierto(false);
            cargarUsuarios();
        } catch (error: any) {
            alert("❌ " + (error.response?.data?.message || "Error al guardar el usuario"));
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* HEADER */}
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-2">
                        <ArrowLeft size={20} />
                        <span className="font-medium">Volver a Caja</span>
                    </button>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="text-blue-600" /> Gestión de Personal
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-600">
                        <UserCircle size={18} />
                        <span className="font-medium">{userAuth?.nombre}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">{userAuth?.rol}</span>
                    </div>
                    <button onClick={logout} className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Salir</span>
                    </button>
                </div>
            </header>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">

                {/* Barra de Herramientas */}
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 font-medium">Administra los accesos y roles de tu equipo</p>
                    <button
                        onClick={abrirModalCrear}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} /> Nuevo Usuario
                    </button>
                </div>

                {/* Tabla de Usuarios */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                            <th className="px-6 py-4 font-semibold">Nombre Completo</th>
                            <th className="px-6 py-4 font-semibold">Usuario (Login)</th>
                            <th className="px-6 py-4 font-semibold text-center">Rol</th>
                            <th className="px-6 py-4 font-semibold text-center">Estado</th>
                            <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {cargando ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Cargando personal...</td></tr>
                        ) : usuarios.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No hay usuarios registrados.</td></tr>
                        ) : (
                            usuarios.map((usr) => (
                                <tr key={usr.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                                        <UserCircle className="text-slate-400" size={20} />
                                        {usr.nombre}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">{usr.usuario}</td>
                                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${usr.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {usr.rol}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${usr.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {usr.activo ? 'Activo' : 'Inactivo'}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => abrirModalEditar(usr)}
                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="Editar Usuario"
                                        >
                                            <Edit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

            </main>

            {/* MODAL CREAR / EDITAR */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                            <Users className="text-blue-600" />
                            {usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </h2>
                        <form onSubmit={handleGuardar} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                                <input
                                    required
                                    type="text"
                                    value={form.nombre}
                                    onChange={e => setForm({...form, nombre: e.target.value})}
                                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de Usuario</label>
                                    <input
                                        required
                                        type="text"
                                        value={form.usuario}
                                        onChange={e => setForm({...form, usuario: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                                        placeholder="Ej: jperez"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                                    <select
                                        value={form.rol}
                                        onChange={e => setForm({...form, rol: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                                    >
                                        <option value="CAJERO">CAJERO</option>
                                        <option value="ADMIN">ADMINISTRADOR</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Contraseña {usuarioEditando && <span className="text-slate-400 font-normal">(Dejar en blanco para no cambiarla)</span>}
                                </label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={e => setForm({...form, password: e.target.value})}
                                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setModalAbierto(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}