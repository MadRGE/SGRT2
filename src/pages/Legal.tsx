import { useState } from 'react';
import { ArrowLeft, FileText, Shield, Lock } from 'lucide-react';
import { Page } from '../components/Layout/Layout';

type LegalSection = 'terms' | 'privacy' | 'confidentiality';

interface Props {
  initialSection?: LegalSection;
  onBack: () => void;
}

const TABS: { key: LegalSection; label: string; icon: typeof FileText }[] = [
  { key: 'terms', label: 'Términos de Servicio', icon: FileText },
  { key: 'privacy', label: 'Política de Privacidad', icon: Shield },
  { key: 'confidentiality', label: 'Confidencialidad', icon: Lock },
];

export default function Legal({ initialSection = 'terms', onBack }: Props) {
  const [active, setActive] = useState<LegalSection>(initialSection);

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Volver</span>
      </button>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-8">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              active === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-700">
        {active === 'terms' && <TermsContent />}
        {active === 'privacy' && <PrivacyContent />}
        {active === 'confidentiality' && <ConfidentialityContent />}
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">
        Última actualización: Febrero 2026
      </p>
    </div>
  );
}

function TermsContent() {
  return (
    <>
      <h1>Términos de Servicio</h1>
      <p className="lead">
        Al utilizar SGRT — Sistema de Gestión Regulatoria de Trámites, usted acepta los siguientes
        términos y condiciones de uso.
      </p>

      <h2>1. Definiciones</h2>
      <p>
        <strong>"SGRT"</strong> o <strong>"la Plataforma"</strong> se refiere al Sistema de Gestión Regulatoria de Trámites,
        incluyendo todas sus funcionalidades, módulos y servicios asociados.
      </p>
      <p>
        <strong>"Usuario"</strong> se refiere a toda persona física o jurídica que accede y utiliza la Plataforma,
        ya sea como consultora regulatoria (usuario principal) o como cliente a través del Portal del Cliente.
      </p>

      <h2>2. Objeto del Servicio</h2>
      <p>
        SGRT provee herramientas de gestión para trámites regulatorios ante organismos como ANMAT, INAL, SENASA
        y otros entes reguladores de la República Argentina. La Plataforma facilita:
      </p>
      <ul>
        <li>Gestión y seguimiento de trámites regulatorios</li>
        <li>Administración de clientes y documentación asociada</li>
        <li>Control de vencimientos de registros, habilitaciones y certificados</li>
        <li>Generación de cotizaciones y presupuestos</li>
        <li>Portal de acceso para clientes finales</li>
        <li>Herramientas de inteligencia artificial como apoyo regulatorio</li>
      </ul>

      <h2>3. Propiedad Intelectual</h2>
      <p>
        SGRT, incluyendo su código fuente, diseño, interfaces, bases de datos y documentación, está protegido
        por la Ley N° 11.723 de Propiedad Intelectual de la República Argentina. Queda prohibida la reproducción,
        distribución o modificación total o parcial de la Plataforma sin autorización expresa.
      </p>
      <p>
        Los datos, documentos, fórmulas, fichas técnicas y demás información cargada por el Usuario en la Plataforma
        son de exclusiva propiedad del Usuario. SGRT no adquiere ningún derecho sobre dicho contenido.
      </p>

      <h2>4. Uso de Inteligencia Artificial</h2>
      <p>
        La Plataforma integra herramientas de inteligencia artificial para asistir en el análisis regulatorio.
        Los resultados generados por IA son de carácter <strong>orientativo y no vinculante</strong>. El Usuario
        es responsable de verificar la exactitud de la información antes de utilizarla en presentaciones ante
        organismos reguladores.
      </p>
      <p>
        SGRT no garantiza la exactitud, completitud o vigencia de los resultados generados por herramientas de IA.
        El profesional regulatorio debe siempre validar la información con la normativa vigente.
      </p>

      <h2>5. Responsabilidad</h2>
      <p>
        SGRT es una herramienta de gestión y no reemplaza el asesoramiento profesional regulatorio.
        La Plataforma no se responsabiliza por:
      </p>
      <ul>
        <li>Decisiones tomadas en base a información gestionada a través del sistema</li>
        <li>Resultados de trámites ante organismos reguladores</li>
        <li>Pérdida de datos causada por mal uso del sistema o causas de fuerza mayor</li>
        <li>Consecuencias derivadas de la información generada por herramientas de IA</li>
      </ul>

      <h2>6. Disponibilidad del Servicio</h2>
      <p>
        SGRT se compromete a realizar sus mejores esfuerzos para mantener la disponibilidad del servicio.
        Sin embargo, podrán existir interrupciones programadas por mantenimiento o actualizaciones,
        las cuales serán comunicadas con antelación razonable.
      </p>

      <h2>7. Legislación Aplicable</h2>
      <p>
        Los presentes Términos se rigen por las leyes de la República Argentina. Para cualquier controversia
        derivada del uso de la Plataforma, las partes se someten a la jurisdicción de los tribunales ordinarios
        de la Ciudad Autónoma de Buenos Aires.
      </p>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <h1>Política de Privacidad</h1>
      <p className="lead">
        SGRT se compromete a proteger la privacidad y los datos personales de sus usuarios, en cumplimiento
        de la Ley N° 25.326 de Protección de Datos Personales de la República Argentina.
      </p>

      <h2>1. Datos Recopilados</h2>
      <p>La Plataforma recopila y almacena los siguientes tipos de información:</p>
      <ul>
        <li><strong>Datos de cuenta:</strong> correo electrónico y credenciales de acceso</li>
        <li><strong>Datos de gestión:</strong> información de clientes, trámites, documentación regulatoria y fichas técnicas</li>
        <li><strong>Datos de uso:</strong> registros de actividad, marcas de tiempo y acciones realizadas en la Plataforma</li>
      </ul>

      <h2>2. Finalidad del Tratamiento</h2>
      <p>Los datos son utilizados exclusivamente para:</p>
      <ul>
        <li>Proveer y mantener el servicio de gestión regulatoria</li>
        <li>Gestionar vencimientos y notificaciones</li>
        <li>Generar reportes y estadísticas de uso</li>
        <li>Mejorar la calidad del servicio</li>
      </ul>

      <h2>3. Almacenamiento y Seguridad</h2>
      <p>
        Los datos se almacenan en servidores seguros con cifrado en tránsito y en reposo. Se implementan
        políticas de aislamiento a nivel de fila (Row Level Security) para garantizar que cada usuario acceda
        únicamente a sus propios datos.
      </p>

      <h2>4. Compartición de Datos</h2>
      <p>
        SGRT <strong>no comparte, vende ni transfiere</strong> datos personales o comerciales de los usuarios
        a terceros, salvo requerimiento judicial o de autoridad competente conforme a la legislación argentina.
      </p>
      <p>
        Los datos compartidos a través del Portal del Cliente se limitan estrictamente a la información que
        el usuario consultora haya habilitado expresamente para cada cliente.
      </p>

      <h2>5. Derechos del Titular</h2>
      <p>
        Conforme a la Ley 25.326, el titular de los datos tiene derecho a:
      </p>
      <ul>
        <li>Acceder a sus datos personales almacenados</li>
        <li>Solicitar la rectificación de datos inexactos</li>
        <li>Solicitar la supresión de sus datos</li>
        <li>Oponerse al tratamiento de sus datos</li>
      </ul>

      <h2>6. Retención de Datos</h2>
      <p>
        Los datos se conservan mientras la cuenta del usuario permanezca activa. Tras la baja del servicio,
        los datos serán eliminados en un plazo máximo de 90 días, salvo obligación legal de conservación.
      </p>

      <h2>7. Contacto</h2>
      <p>
        Para ejercer sus derechos o realizar consultas sobre el tratamiento de datos, puede comunicarse
        a través de los canales de soporte habilitados en la Plataforma.
      </p>
    </>
  );
}

function ConfidentialityContent() {
  return (
    <>
      <h1>Acuerdo de Confidencialidad</h1>
      <p className="lead">
        El presente acuerdo establece las obligaciones de confidencialidad que rigen el uso de SGRT
        y la protección de la información sensible gestionada a través de la Plataforma.
      </p>

      <h2>1. Marco Legal</h2>
      <p>
        Este acuerdo se enmarca en las disposiciones del Decreto de Necesidad y Urgencia 274/2019 sobre
        competencia desleal, la Ley 24.766 sobre confidencialidad de información, y las disposiciones
        pertinentes del Código Civil y Comercial de la Nación (Ley 26.994).
      </p>

      <h2>2. Información Confidencial</h2>
      <p>Se considera información confidencial toda aquella que:</p>
      <ul>
        <li>Sea cargada en la Plataforma como parte de la gestión regulatoria</li>
        <li>Incluya fórmulas, composiciones, procesos productivos o fichas técnicas</li>
        <li>Contenga estrategias comerciales, precios o condiciones de negociación</li>
        <li>Sea identificada expresamente como "confidencial" por el usuario</li>
        <li>Por su naturaleza, deba razonablemente considerarse reservada</li>
      </ul>

      <h2>3. Obligaciones de SGRT</h2>
      <p>SGRT se compromete a:</p>
      <ul>
        <li>Mantener la estricta confidencialidad de toda la información almacenada en la Plataforma</li>
        <li>Implementar medidas técnicas de seguridad adecuadas (cifrado, aislamiento de datos, control de acceso)</li>
        <li>No utilizar la información del usuario para fines distintos a la prestación del servicio</li>
        <li>No divulgar información confidencial a terceros sin consentimiento expreso</li>
        <li>Notificar al usuario en caso de incidentes de seguridad que pudieran comprometer sus datos</li>
      </ul>

      <h2>4. Obligaciones del Usuario</h2>
      <p>El usuario se compromete a:</p>
      <ul>
        <li>Mantener la seguridad de sus credenciales de acceso</li>
        <li>No compartir accesos con personas no autorizadas</li>
        <li>Informar inmediatamente cualquier acceso no autorizado detectado</li>
        <li>Utilizar el Portal del Cliente de manera responsable, compartiendo solo la información necesaria</li>
      </ul>

      <h2>5. Portal del Cliente y Terceros</h2>
      <p>
        Al compartir información a través del Portal del Cliente, el usuario consultora es responsable de:
      </p>
      <ul>
        <li>Obtener el consentimiento previo de su cliente para compartir la información seleccionada</li>
        <li>Configurar adecuadamente los permisos de visualización</li>
        <li>Verificar que la información compartida no infrinja acuerdos de confidencialidad con terceros</li>
      </ul>

      <h2>6. Excepciones</h2>
      <p>No se considerará incumplimiento la divulgación de información cuando:</p>
      <ul>
        <li>Sea requerida por autoridad judicial o administrativa competente</li>
        <li>La información sea o se convierta en dominio público por medios legítimos</li>
        <li>Haya sido obtenida lícitamente por fuentes independientes</li>
      </ul>

      <h2>7. Vigencia</h2>
      <p>
        Las obligaciones de confidencialidad se mantienen vigentes durante la relación contractual
        y por un período de <strong>cinco (5) años</strong> posteriores a la terminación del servicio,
        conforme a la práctica habitual en materia de secretos comerciales e información regulatoria
        en la República Argentina.
      </p>

      <h2>8. Nota sobre Protección Regulatoria</h2>
      <p>
        <strong>Importante:</strong> En la República Argentina, ANMAT e INPI operan de manera independiente.
        El registro de un producto ante ANMAT <strong>no otorga protección de propiedad intelectual</strong>.
        Argentina no cuenta con un sistema de data exclusivity robusto (Ley 24.766 brinda protección limitada).
        Por lo tanto, la confidencialidad de la información almacenada en esta Plataforma constituye una
        línea de defensa fundamental para proteger los secretos comerciales y la información propietaria del usuario.
      </p>
      <p>
        Se recomienda complementar el uso de SGRT con el registro de marcas ante INPI y la protección
        de patentes cuando corresponda.
      </p>
    </>
  );
}
