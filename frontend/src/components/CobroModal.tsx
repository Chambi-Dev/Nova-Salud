import { useState } from 'react';
import { X, Search, UserCheck, AlertCircle } from 'lucide-react';
import api from '../api/axios';

interface CobroModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    onConfirmar: (clienteId: number | null, clienteNombre: string) => Promise<void>;
}

export default function CobroModal({ isOpen, onClose, total, onConfirmar }: CobroModalProps) {
    const [documento, setDocumento] = useState('');
    const [cliente, setCliente] = useState<{ id: number; nombreRazon: string } | null>(null);
    const [buscando, setBuscando] = useState(false);
    const [error, setError] = useState('');
    const [procesandoVenta, setProcesandoVenta] = useState(false);

    if (!isOpen) return null;

    const buscarCliente = async () => {
        if (documento.length !== 8 && documento.length !== 11) {
            setError('El documento debe tener 8 (DNI) o 11 (RUC) dígitos');
            return;
        }

        setError('');
        setBuscando(true);
        setCliente(null);

        try {
            const resp = await api.get(`/clientes/consulta/${documento}`);
            setCliente(resp.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al buscar cliente');
        } finally {
            setBuscando(false);
        }
    };

    const handleCobrar = async () => {
        setProcesandoVenta(true);
        try {
            // Pasamos tanto el ID como el Nombre (o 'Público General' si no hay cliente)
            await onConfirmar(
                cliente ? cliente.id : null,
                cliente ? cliente.nombreRazon : 'Público General'
            );
            setDocumento('');
            setCliente(null);
        } catch (error) {
            // Error manejado en el componente padre
        } finally {
            setProcesandoVenta(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
                    <h2 className="text-xl font-bold">Completar Venta</h2>
                    <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                        <p className="text-slate-500 text-sm font-medium mb-1">Monto a Cobrar</p>
                        <p className="text-4xl font-bold text-slate-800">S/ {total.toFixed(2)}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Cliente (DNI / RUC) - <span className="text-slate-400 font-normal">Opcional</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={documento}
                                onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ''))}
                                placeholder="Ingrese documento..."
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                                maxLength={11}
                            />
                            <button
                                onClick={buscarCliente}
                                disabled={buscando || documento.length === 0}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 rounded-lg transition-colors border border-slate-300 disabled:opacity-50"
                            >
                                {buscando ? <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/> : <Search size={20} />}
                            </button>
                        </div>

                        {error && (
                            <p className="flex items-center gap-1 text-red-600 text-sm mt-2 font-medium">
                                <AlertCircle size={14} /> {error}
                            </p>
                        )}

                        {cliente && (
                            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
                                <div className="bg-green-100 p-2 rounded-full text-green-700 shrink-0">
                                    <UserCheck size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-0.5">Cliente Encontrado</p>
                                    <p className="text-sm font-semibold text-slate-800 leading-tight">{cliente.nombreRazon}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCobrar}
                        disabled={procesandoVenta}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors shadow-sm flex justify-center items-center gap-2"
                    >
                        {procesandoVenta ? (
                            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> Procesando...</>
                        ) : (
                            'Confirmar Pago'
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}