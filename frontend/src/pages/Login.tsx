import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { Pill } from 'lucide-react'; // Un ícono representativo para la botica

export default function Login() {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const respuesta = await api.post('/auth/login', { usuario, password });

            // Guardamos en Zustand y LocalStorage
            login(respuesta.data.access_token, respuesta.data.usuario);

            // Redirigimos al Dashboard
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
        <div className="bg-blue-600 p-3 rounded-full text-white mb-4">
        <Pill size={32} />
    </div>
    <h1 className="text-2xl font-bold text-slate-800">Nova Salud</h1>
    <p className="text-slate-500 text-sm mt-1">Ingresa a tu punto de venta</p>
    </div>

    {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
            {error}
            </div>
    )}

    <form onSubmit={handleLogin} className="space-y-4">
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
        <input
    type="text"
    value={usuario}
    onChange={(e) => setUsuario(e.target.value)}
    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
    placeholder="Ej: admin"
    required
    />
    </div>

    <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
        <input
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
    placeholder="••••••••"
    required
    />
    </div>

    <button
    type="submit"
    disabled={loading}
    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
        {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
        </form>
        </div>
        </div>
);
}