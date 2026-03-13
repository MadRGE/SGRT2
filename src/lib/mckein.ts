// Integración SGRT2 → Mckein
// Cuando se crea un cliente en SGRT2, se crea un nodo en Mckein automáticamente

const MCKEIN_URL = import.meta.env.VITE_MCKEIN_URL || "https://mckein.com";
const MCKEIN_SECRET = import.meta.env.VITE_MCKEIN_WEBHOOK_SECRET || "mckein_wh_2026";

interface MckeinResult {
  ok: boolean;
  nodeId?: string;
  tramiteId?: string;
  error?: string;
}

export async function syncClientToMckein(client: {
  razon_social: string;
  email?: string | null;
  cuit?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  localidad?: string | null;
  provincia?: string | null;
}): Promise<MckeinResult> {
  if (!client.email) return { ok: false, error: "Sin email — no se sincroniza" };

  try {
    const res = await fetch(`${MCKEIN_URL}/api/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": MCKEIN_SECRET,
      },
      body: JSON.stringify({
        event: "client.created",
        source: "sgrt2",
        name: client.razon_social,
        email: client.email,
        cuit: client.cuit || undefined,
        phone: client.telefono || undefined,
        address: [client.direccion, client.localidad, client.provincia].filter(Boolean).join(", ") || undefined,
        type: "importador",
        types: ["importador"],
      }),
    });

    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return { ok: true, nodeId: data.data?.nodeId };
  } catch (err) {
    console.error("[mckein] Sync failed:", err);
    return { ok: false, error: String(err) };
  }
}

export async function syncTramiteToMckein(tramite: {
  organism: string;
  type: string;
  title: string;
  description?: string;
  product?: string;
  applicant?: string;
  priority?: string;
  reference?: string;
}): Promise<MckeinResult> {
  try {
    const res = await fetch(`${MCKEIN_URL}/api/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": MCKEIN_SECRET,
      },
      body: JSON.stringify({
        event: "tramite.created",
        source: "sgrt2",
        gestorEmail: "max@rge.com",
        nodeEmail: "max@rge.com",
        ...tramite,
      }),
    });

    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return { ok: true, tramiteId: data.data?.tramiteId };
  } catch (err) {
    console.error("[mckein] Tramite sync failed:", err);
    return { ok: false, error: String(err) };
  }
}
