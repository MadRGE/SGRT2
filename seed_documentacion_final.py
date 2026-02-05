"""
SEED DE DOCUMENTACION - VERSION FINAL
Mapea documentacion por patron de nombre del tramite
"""

from supabase import create_client
import json
import re

SUPABASE_URL = "https://qisowxnfjpvlkbdxmykb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc293eG5manB2bGtiZHhteWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NjAyNjQsImV4cCI6MjA4NDEzNjI2NH0.Rd92jxhAZSa2Vlm8lsU01RvdZlMvy-ukeg3f4CP3Mrs"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# Documentacion base por tipo de tramite
DOCS_BASE = {
    # Productos Medicos
    "pm_clase_i": [
        {"nombre": "Formulario de Solicitud ANMAT", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificado de Libre Venta (CFS)", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Manual de Usuario en espanol", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Rotulo propuesto", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Declaracion Jurada de Fabricante", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Poder del Importador", "obligatorio": True, "formato": "PDF"},
    ],
    "pm_clase_ii": [
        {"nombre": "Formulario de Solicitud ANMAT", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificado de Libre Venta (CFS)", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificado ISO 13485", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Manual de Usuario en espanol", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Instrucciones de Uso (IFU)", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Analisis de Riesgos", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Ficha Tecnica", "obligatorio": True, "formato": "PDF"},
    ],
    "pm_clase_iii_iv": [
        {"nombre": "Formulario de Solicitud ANMAT", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificado de Libre Venta (CFS)", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificado ISO 13485", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificado CE/FDA", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Estudios Clinicos", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Biocompatibilidad ISO 10993", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Analisis de Riesgos ISO 14971", "obligatorio": True, "formato": "PDF"},
    ],
    "ivd": [
        {"nombre": "Formulario de Solicitud ANMAT IVD", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificado de Libre Venta (CFS)", "obligatorio": True, "formato": "PDF"},
        {"nombre": "ISO 13485", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Estudios de Performance Analitica", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Estudios de Estabilidad", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Instrucciones de Uso", "obligatorio": True, "formato": "PDF"},
    ],
    
    # Cosmeticos
    "cosm_grado1": [
        {"nombre": "Formulario de Solicitud", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Formula cualicuantitativa", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Metodo de elaboracion", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Especificaciones de producto terminado", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Rotulo propuesto", "obligatorio": True, "formato": "PDF"},
    ],
    "cosm_grado2": [
        {"nombre": "Formulario de Solicitud", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Formula cualicuantitativa", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Estudios de Eficacia", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Estudios de Seguridad", "obligatorio": True, "formato": "PDF"},
        {"nombre": "FPS si corresponde", "obligatorio": False, "formato": "PDF"},
    ],
    
    # Domisanitarios
    "domisanitario": [
        {"nombre": "Formulario de Solicitud", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Formula cualicuantitativa", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Especificaciones fisico-quimicas", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Hoja de Seguridad (MSDS)", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Rotulo propuesto", "obligatorio": True, "formato": "PDF"},
    ],
    
    # Alimentos INAL
    "rnpa": [
        {"nombre": "Formulario de Solicitud INAL", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificado de Libre Venta (CFS)", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Analisis Bromatologico", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Ficha Tecnica del producto", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Rotulo nutricional propuesto", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Habilitacion RNE vigente", "obligatorio": True, "formato": "PDF"},
    ],
    "rne": [
        {"nombre": "Formulario de Solicitud RNE", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Habilitacion municipal/provincial", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Plano del establecimiento", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Manual de BPM", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Plan HACCP", "obligatorio": True, "formato": "PDF"},
    ],
    "suplemento": [
        {"nombre": "Formulario de Solicitud", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Formula cualicuantitativa", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Analisis de producto terminado", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Estudios de estabilidad", "obligatorio": True, "formato": "PDF"},
        {"nombre": "GMP del fabricante", "obligatorio": True, "formato": "PDF"},
    ],
    
    # SENASA
    "senasa_producto": [
        {"nombre": "Formulario SENASA", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificado Sanitario de origen", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Habilitacion del establecimiento origen", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Protocolo de analisis", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Ficha tecnica", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Rotulo propuesto", "obligatorio": True, "formato": "PDF"},
    ],
    "senasa_habilitacion": [
        {"nombre": "Formulario de Habilitacion", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Estatuto social", "obligatorio": True, "formato": "PDF"},
        {"nombre": "CUIT/Constancia AFIP", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Habilitacion municipal", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Plano del establecimiento", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Manual de BPM", "obligatorio": True, "formato": "PDF"},
    ],
    "fitosanitario": [
        {"nombre": "Solicitud de Permiso Fitosanitario", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificado Fitosanitario de origen", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Factura Proforma", "obligatorio": True, "formato": "PDF"},
    ],
    
    # ENACOM
    "enacom_homologacion": [
        {"nombre": "Formulario de Solicitud ENACOM", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Informe de Ensayos de Laboratorio", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Manual de Usuario", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Especificaciones Tecnicas", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Declaracion de Conformidad", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Fotografias del equipo", "obligatorio": True, "formato": "Imagen"},
    ],
    
    # SIC
    "sic_licencia": [
        {"nombre": "Formulario SIMI", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Factura Proforma", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificados tecnicos segun producto", "obligatorio": True, "formato": "PDF"},
    ],
    "seg_electrica": [
        {"nombre": "Solicitud de Certificacion", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Informe de Ensayos IRAM", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Manual de Usuario en espanol", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Especificaciones Tecnicas", "obligatorio": True, "formato": "PDF"},
    ],
    
    # RENPRE
    "renpre_inscripcion": [
        {"nombre": "Formulario de Inscripcion RENPRE", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Estatuto social", "obligatorio": True, "formato": "PDF"},
        {"nombre": "DNI de representantes", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Habilitacion municipal", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Listado de sustancias a operar", "obligatorio": True, "formato": "Excel"},
        {"nombre": "Antecedentes penales de responsables", "obligatorio": True, "formato": "PDF"},
    ],
    "renpre_autorizacion": [
        {"nombre": "Solicitud de Autorizacion", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificado RENPRE vigente", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Factura Proforma", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificado de uso final", "obligatorio": True, "formato": "PDF"},
    ],
    
    # CITES
    "cites_permiso": [
        {"nombre": "Formulario de Solicitud CITES", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Permiso CITES del pais origen/destino", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Documentacion del origen legal", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Fotos de los especimenes", "obligatorio": True, "formato": "Imagen"},
    ],
    
    # INTI
    "inti_certificacion": [
        {"nombre": "Solicitud de Certificacion", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Especificaciones Tecnicas", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Muestras para ensayo", "obligatorio": True, "formato": "Otro"},
    ],
    
    # ANMaC
    "anmac_armas": [
        {"nombre": "Formulario ANMaC", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Credencial de Legitimo Usuario", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Factura Proforma", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Especificaciones tecnicas", "obligatorio": True, "formato": "PDF"},
    ],
    
    # Generico modificacion/reinscripcion
    "modificacion": [
        {"nombre": "Formulario de Modificacion", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificado vigente a modificar", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Justificacion del cambio", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Documentacion de soporte", "obligatorio": True, "formato": "PDF"},
    ],
    "reinscripcion": [
        {"nombre": "Formulario de Reinscripcion", "obligatorio": True, "formato": "PDF"},
        {"nombre": "Certificado vigente", "obligatorio": True, "formato": "PDF"},
        {"nombre": "CFS actualizado", "obligatorio": False, "formato": "PDF"},
        {"nombre": "Declaracion de cambios", "obligatorio": True, "formato": "PDF"},
    ],
}


def detectar_tipo_documentacion(codigo, nombre):
    """Detecta que tipo de documentacion corresponde al tramite"""
    codigo_lower = codigo.lower()
    nombre_lower = nombre.lower()
    
    # Modificaciones
    if 'modif' in codigo_lower or 'modificacion' in nombre_lower:
        return "modificacion"
    
    # Reinscripciones
    if 'reinsc' in codigo_lower or 'reval' in codigo_lower or 'reinscripcion' in nombre_lower:
        return "reinscripcion"
    
    # Productos Medicos por clase
    if 'pm-' in codigo_lower or codigo_lower.startswith('pm'):
        if 'clase i' in nombre_lower and 'ii' not in nombre_lower:
            return "pm_clase_i"
        elif 'clase ii' in nombre_lower and 'iii' not in nombre_lower:
            return "pm_clase_ii"
        elif 'clase iii' in nombre_lower or 'clase iv' in nombre_lower:
            return "pm_clase_iii_iv"
        elif 'ivd' in nombre_lower or 'diagnostico' in nombre_lower:
            return "ivd"
        return "pm_clase_ii"  # default PM
    
    # Cosmeticos
    if 'cosm' in codigo_lower:
        if 'grado 2' in nombre_lower or 'grado ii' in nombre_lower:
            return "cosm_grado2"
        return "cosm_grado1"
    
    # Domisanitarios
    if 'dom' in codigo_lower:
        return "domisanitario"
    
    # INAL/Alimentos
    if codigo_lower.startswith('inal') or codigo_lower.startswith('ali'):
        if 'rne' in nombre_lower or 'establecimiento' in nombre_lower:
            return "rne"
        if 'suplemento' in nombre_lower:
            return "suplemento"
        return "rnpa"
    
    # SENASA
    if 'senasa' in codigo_lower or codigo_lower.startswith('sen'):
        if 'habilitacion' in nombre_lower or 'inscripcion' in nombre_lower:
            return "senasa_habilitacion"
        if 'fitosanitario' in nombre_lower:
            return "fitosanitario"
        return "senasa_producto"
    
    # ENACOM
    if 'enacom' in codigo_lower or codigo_lower.startswith('ena') or codigo_lower.startswith('enc'):
        return "enacom_homologacion"
    
    # SIC
    if 'sic' in codigo_lower or codigo_lower.startswith('sic'):
        if 'electric' in nombre_lower or 'seguridad' in nombre_lower:
            return "seg_electrica"
        return "sic_licencia"
    
    # RENPRE
    if 'renpre' in codigo_lower or codigo_lower.startswith('ren'):
        if 'inscripcion' in nombre_lower:
            return "renpre_inscripcion"
        return "renpre_autorizacion"
    
    # CITES
    if 'cit' in codigo_lower:
        return "cites_permiso"
    
    # INTI
    if 'inti' in codigo_lower:
        return "inti_certificacion"
    
    # ANMaC
    if 'anmac' in codigo_lower:
        return "anmac_armas"
    
    # INASE (ya tienen docs)
    if 'inase' in codigo_lower:
        return None
    
    return None


def main():
    print("\n" + "="*60)
    print("SEED DOCUMENTACION - ASIGNACION POR PATRON")
    print("="*60)
    
    # Obtener todos los tramites
    print("\n1. Obteniendo tramites...")
    resp = supabase.table("tramites_catalogo").select("id, codigo, nombre, notas").execute()
    tramites = resp.data
    print(f"   Total: {len(tramites)} tramites")
    
    # Asignar documentacion
    print("\n2. Asignando documentacion...")
    actualizados = 0
    sin_docs = 0
    ya_tienen = 0
    
    for tramite in tramites:
        # Verificar si ya tiene documentacion
        if tramite.get("notas"):
            try:
                data = json.loads(tramite["notas"])
                if data.get("documentacion_requerida"):
                    ya_tienen += 1
                    continue
            except:
                pass
        
        # Detectar tipo
        tipo = detectar_tipo_documentacion(tramite["codigo"], tramite["nombre"])
        
        if tipo and tipo in DOCS_BASE:
            docs = DOCS_BASE[tipo]
            docs_con_id = [
                {"id": i+1, "orden": i+1, **doc}
                for i, doc in enumerate(docs)
            ]
            notas_json = json.dumps({"documentacion_requerida": docs_con_id}, ensure_ascii=False)
            
            try:
                supabase.table("tramites_catalogo").update({
                    "notas": notas_json
                }).eq("id", tramite["id"]).execute()
                print(f"   OK {tramite['codigo']}: {tipo} ({len(docs)} docs)")
                actualizados += 1
            except Exception as e:
                print(f"   ERROR {tramite['codigo']}: {e}")
        else:
            sin_docs += 1
    
    print(f"\n   Actualizados: {actualizados}")
    print(f"   Ya tenian docs: {ya_tienen}")
    print(f"   Sin asignar: {sin_docs}")
    
    # Resumen final
    print("\n" + "="*60)
    print("RESUMEN FINAL")
    print("="*60)
    
    org_resp = supabase.table("organismos").select("id, codigo").execute()
    tramites_resp = supabase.table("tramites_catalogo").select("organismo_id, notas").execute()
    
    total_docs = 0
    for org in org_resp.data:
        org_tramites = [t for t in tramites_resp.data if t["organismo_id"] == org["id"]]
        count = len(org_tramites)
        
        docs = 0
        for t in org_tramites:
            if t.get("notas"):
                try:
                    data = json.loads(t["notas"])
                    docs += len(data.get("documentacion_requerida", []))
                except:
                    pass
        
        total_docs += docs
        print(f"   {org['codigo']:12} | {count:3} tramites | {docs:4} docs")
    
    print("-" * 45)
    total = len(tramites_resp.data)
    print(f"   {'TOTAL':12} | {total:3} tramites | {total_docs:4} docs")
    
    print("\nSEED COMPLETADO")


if __name__ == "__main__":
    main()
