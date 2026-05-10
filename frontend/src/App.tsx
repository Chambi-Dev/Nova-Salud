import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HistorialVentas from './pages/HistorialVentas';
import Inventario from './pages/Inventario';
import Categorias from './pages/Categorias';
import Usuarios from './pages/Usuarios';
import { useAuthStore } from './store/authStore';

const RutaProtegida = ({ children }: { children: JSX.Element }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const RutaAdmin = ({ children }: { children: JSX.Element }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
    const user = useAuthStore((state) => state.user);

    if (!isAuthenticated) return <Navigate to="/login" />;
    if (user?.rol !== 'ADMIN') return <Navigate to="/dashboard" />;

    return children;
};

function App() {
    return (
        <BrowserRouter>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 2500,
                    style: {
                        background: '#0f172a',
                        color: '#fff',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        letterSpacing: '0.5px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    },
                    success: {
                        style: {
                            border: '1px solid #10b981',
                            boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
                            color: '#34d399',
                        },
                        iconTheme: { primary: '#10b981', secondary: '#0f172a' },
                    },
                    error: {
                        style: {
                            border: '1px solid #ef4444',
                            boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                        },
                        iconTheme: { primary: '#ef4444', secondary: '#0f172a' },
                    },
                }}
            />

            <Routes>
                <Route path="/login" element={<Login />} />

                {/* Acceso para Cajeros y Admin */}
                <Route path="/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />

                {/* RUTAS ADMINISTRATIVAS RESTRINGIDAS */}
                <Route path="/historial" element={<RutaAdmin><HistorialVentas /></RutaAdmin>} />
                <Route path="/inventario" element={<RutaAdmin><Inventario /></RutaAdmin>} />
                <Route path="/categorias" element={<RutaAdmin><Categorias /></RutaAdmin>} />
                <Route path="/usuarios" element={<RutaAdmin><Usuarios /></RutaAdmin>} />

                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;