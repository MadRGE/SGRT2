// Fee calculation system: FIJO, PORCENTAJE, VARIABLE

export interface FeeResult {
  concepto: string;
  tipo: "arancel" | "honorario";
  monto: number;
  moneda: string;
}

export interface TramiteTipoFee {
  nombre: string;
  costoOrganismo: number | null;
  moneda: string;
  honorarios: number | null;
}

export function calcularArancelesExpediente(tipo: TramiteTipoFee): FeeResult[] {
  const results: FeeResult[] = [];

  if (tipo.costoOrganismo) {
    results.push({
      concepto: `Arancel ${tipo.nombre}`,
      tipo: "arancel",
      monto: tipo.costoOrganismo,
      moneda: tipo.moneda || "ARS",
    });
  }

  if (tipo.honorarios) {
    results.push({
      concepto: `Honorarios ${tipo.nombre}`,
      tipo: "honorario",
      monto: tipo.honorarios,
      moneda: "ARS",
    });
  }

  return results;
}

export function calcularTotalGestion(
  expedientes: Array<{ tramiteTipo: TramiteTipoFee }>
): { totalOrganismo: number; totalHonorarios: number; total: number } {
  let totalOrganismo = 0;
  let totalHonorarios = 0;

  for (const exp of expedientes) {
    totalOrganismo += exp.tramiteTipo.costoOrganismo || 0;
    totalHonorarios += exp.tramiteTipo.honorarios || 0;
  }

  return { totalOrganismo, totalHonorarios, total: totalOrganismo + totalHonorarios };
}
