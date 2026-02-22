import { useRef } from 'react';
import { FileText, Download, Printer, X } from 'lucide-react';
import { EnvasesANMATData } from '../../services/EspecificacionService';

interface FichaTecnicaGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  productoNombre: string;
  productoMarca?: string;
  clienteData: {
    razon_social: string;
    cuit: string;
    direccion?: string;
  };
  especificacion: {
    fabricante: string;
    pais_fabricacion: string;
    datos_tecnicos: EnvasesANMATData;
  };
}

export function FichaTecnicaGenerator({
  isOpen,
  onClose,
  productoNombre,
  productoMarca,
  clienteData,
  especificacion
}: FichaTecnicaGeneratorProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Ficha Técnica - ${productoNombre}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                  color: #333;
                }
                .header {
                  border-bottom: 3px solid #2563eb;
                  padding-bottom: 15px;
                  margin-bottom: 20px;
                }
                .title {
                  font-size: 24px;
                  font-weight: bold;
                  color: #1e40af;
                  margin-bottom: 5px;
                }
                .subtitle {
                  font-size: 14px;
                  color: #64748b;
                }
                .section {
                  margin-bottom: 25px;
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  padding: 15px;
                }
                .section-title {
                  font-size: 16px;
                  font-weight: bold;
                  color: #1e40af;
                  margin-bottom: 10px;
                  padding-bottom: 8px;
                  border-bottom: 2px solid #dbeafe;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 10px;
                }
                th, td {
                  border: 1px solid #cbd5e1;
                  padding: 10px;
                  text-align: left;
                }
                th {
                  background-color: #f1f5f9;
                  font-weight: 600;
                }
                .check-mark {
                  color: #059669;
                  font-weight: bold;
                  font-size: 18px;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 10px;
                }
                .info-item {
                  padding: 8px;
                  background-color: #f8fafc;
                  border-radius: 4px;
                }
                .info-label {
                  font-size: 12px;
                  color: #64748b;
                  margin-bottom: 2px;
                }
                .info-value {
                  font-size: 14px;
                  font-weight: 600;
                  color: #1e293b;
                }
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 2px solid #e2e8f0;
                  font-size: 12px;
                  color: #64748b;
                }
                .signature-box {
                  border: 1px solid #cbd5e1;
                  height: 80px;
                  margin-top: 30px;
                  padding: 10px;
                }
                @media print {
                  body { margin: 0; }
                  .section { page-break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    handlePrint();
  };

  if (!isOpen) return null;

  const { datos_tecnicos } = especificacion;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ficha Técnica de Envase</h2>
              <p className="text-sm text-blue-100">{productoNombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-3 mb-6">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar PDF
            </button>
          </div>

          <div ref={printRef} className="bg-white p-8 border border-slate-200 rounded-lg">
            <div className="header">
              <div className="title">FICHA TÉCNICA DE ENVASES Y MATERIALES</div>
              <div className="subtitle">Materiales en Contacto con Alimentos - Disposición ANMAT</div>
            </div>

            <div className="section">
              <div className="section-title">Información del Producto</div>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Producto</div>
                  <div className="info-value">{productoNombre}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Marca</div>
                  <div className="info-value">{productoMarca || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Fabricante</div>
                  <div className="info-value">{especificacion.fabricante}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">País de Fabricación</div>
                  <div className="info-value">{especificacion.pais_fabricacion}</div>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-title">Datos del Importador/Solicitante</div>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Razón Social</div>
                  <div className="info-value">{clienteData.razon_social}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">CUIT</div>
                  <div className="info-value">{clienteData.cuit}</div>
                </div>
                {clienteData.direccion && (
                  <div className="info-item" style={{ gridColumn: 'span 2' }}>
                    <div className="info-label">Dirección</div>
                    <div className="info-value">{clienteData.direccion}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="section">
              <div className="section-title">1. Materiales Constitutivos</div>
              <table>
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Materiales Utilizados</th>
                  </tr>
                </thead>
                <tbody>
                  {datos_tecnicos.materiales.plasticos.length > 0 && (
                    <tr>
                      <td><strong>Plásticos</strong></td>
                      <td>{datos_tecnicos.materiales.plasticos.join(', ')}</td>
                    </tr>
                  )}
                  {datos_tecnicos.materiales.celulosas.length > 0 && (
                    <tr>
                      <td><strong>Celulosas</strong></td>
                      <td>{datos_tecnicos.materiales.celulosas.join(', ')}</td>
                    </tr>
                  )}
                  {datos_tecnicos.materiales.elastomeros.length > 0 && (
                    <tr>
                      <td><strong>Elastómeros</strong></td>
                      <td>{datos_tecnicos.materiales.elastomeros.join(', ')}</td>
                    </tr>
                  )}
                  {datos_tecnicos.materiales.metales.length > 0 && (
                    <tr>
                      <td><strong>Metales</strong></td>
                      <td>{datos_tecnicos.materiales.metales.join(', ')}</td>
                    </tr>
                  )}
                  {datos_tecnicos.materiales.vidrio && (
                    <tr>
                      <td><strong>Vidrio</strong></td>
                      <td>Sí</td>
                    </tr>
                  )}
                  {datos_tecnicos.materiales.otros && (
                    <tr>
                      <td><strong>Otros</strong></td>
                      <td>{datos_tecnicos.materiales.otros}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="section">
              <div className="section-title">2. Clasificación de Riesgo</div>
              <table>
                <tbody>
                  <tr>
                    <td style={{ width: '50%' }}><strong>Nivel de Riesgo</strong></td>
                    <td style={{
                      backgroundColor:
                        datos_tecnicos.clasificacion_riesgo === 'bajo' ? '#dcfce7' :
                        datos_tecnicos.clasificacion_riesgo === 'medio' ? '#fef9c3' :
                        '#fee2e2',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {datos_tecnicos.clasificacion_riesgo}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="section">
              <div className="section-title">3. Condiciones de Uso</div>
              <table>
                <thead>
                  <tr>
                    <th>Condición</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Aplica</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Heladera (0-8°C)</td>
                    <td style={{ textAlign: 'center' }}>
                      {datos_tecnicos.condiciones_uso.heladera ? <span className="check-mark">✓</span> : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td>Freezer (-18°C)</td>
                    <td style={{ textAlign: 'center' }}>
                      {datos_tecnicos.condiciones_uso.freezer ? <span className="check-mark">✓</span> : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td>Microondas</td>
                    <td style={{ textAlign: 'center' }}>
                      {datos_tecnicos.condiciones_uso.microondas ? <span className="check-mark">✓</span> : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td>Hornalla/Horno</td>
                    <td style={{ textAlign: 'center' }}>
                      {datos_tecnicos.condiciones_uso.hornalla ? <span className="check-mark">✓</span> : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td>Llenado en Caliente</td>
                    <td style={{ textAlign: 'center' }}>
                      {datos_tecnicos.condiciones_uso.llenado_caliente ? <span className="check-mark">✓</span> : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="section">
              <div className="section-title">4. Tipos de Alimentos Compatibles</div>
              <table>
                <thead>
                  <tr>
                    <th>Tipo de Alimento</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Compatible</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Alimentos Acuosos</td>
                    <td style={{ textAlign: 'center' }}>
                      {datos_tecnicos.tipos_alimentos.acuosos ? <span className="check-mark">✓</span> : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td>Alimentos Ácidos</td>
                    <td style={{ textAlign: 'center' }}>
                      {datos_tecnicos.tipos_alimentos.acidos ? <span className="check-mark">✓</span> : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td>Bebidas Alcohólicas</td>
                    <td style={{ textAlign: 'center' }}>
                      {datos_tecnicos.tipos_alimentos.alcoholicos ? <span className="check-mark">✓</span> : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td>Alimentos Grasos</td>
                    <td style={{ textAlign: 'center' }}>
                      {datos_tecnicos.tipos_alimentos.grasos ? <span className="check-mark">✓</span> : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td>Alimentos Secos</td>
                    <td style={{ textAlign: 'center' }}>
                      {datos_tecnicos.tipos_alimentos.secos ? <span className="check-mark">✓</span> : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="signature-box">
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                Firma y Sello del Responsable Técnico
              </div>
              <div style={{ borderTop: '1px solid #cbd5e1', marginTop: '40px', paddingTop: '5px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Aclaración y Matrícula Profesional
                </div>
              </div>
            </div>

            <div className="footer">
              <div>Fecha de emisión: {new Date().toLocaleDateString('es-AR')}</div>
              <div>Documento generado por Sistema de Gestión de Trámites Regulatorios v8</div>
              <div style={{ marginTop: '10px', fontStyle: 'italic' }}>
                Este documento es una declaración técnica y debe ser presentado junto con la documentación complementaria requerida por ANMAT.
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-slate-300 rounded-lg hover:bg-white transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
