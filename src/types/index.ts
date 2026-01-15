export type Cliente = {
    id_cliente: string;
    nombres: string;
    celular: string;
    email: string;
    zona: string;
    fecha_registro: string; // YYYY-MM-DD
};

export type DevolucionStatus = 'pendiente' | 'en_proceso' | 'resuelto';
export type DevolucionMotivo = 'defecto' | 'daño' | 'arrepentimiento' | 'otro';
export type DevolucionResolucion = 'reparación' | 'cambio' | 'reembolso' | 'cupón';

export type Devolucion = {
    id_devolucion: string;
    id_cliente: string;
    producto: string;
    categoria: string;
    motivo: DevolucionMotivo;
    estado: DevolucionStatus;
    fecha_solicitud: string; // YYYY-MM-DD
    fecha_cierre: string | null; // YYYY-MM-DD or null
    costo: number;
    resolucion?: DevolucionResolucion; // Optional or strictly one of the enum if closed
};

export type RowError = {
    sheet: 'clientes' | 'devoluciones';
    rowNumber: number;
    column?: string;
    message: string;
};

export type ImportResult = {
    ok: boolean;
    summary: {
        clientes: { total: number; valid: number; invalid: number };
        devoluciones: { total: number; valid: number; invalid: number };
    };
    preview: { clientes: any[]; devoluciones: any[] };
    validData: { clientes: Cliente[]; devoluciones: Devolucion[] };
    errors: RowError[];
    globalErrors: string[];
};
