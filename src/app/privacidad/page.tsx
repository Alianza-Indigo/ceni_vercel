import type { Metadata } from "next";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = { title: "Aviso de privacidad" };

/*
 * Simple privacy notice based on the LFPDPPP template. The pending legal
 * review is disclosed to users as a visible note at the end of the page.
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Aviso de privacidad" }]} />
      <PageInfo>
        Esta página contiene el aviso de privacidad de la plataforma CENI: qué datos
        personales se recaban, para qué se usan y cómo ejercer tus derechos ARCO. Es una
        página informativa; no hay formularios.
      </PageInfo>

      <h1 className="text-3xl font-bold text-indigo">Aviso de privacidad</h1>
      <div className="calm-stack mt-6 max-w-prose leading-relaxed">
        <p>
          <strong>Responsable.</strong> Alianza Índigo Neurodivergente A.C. es
          responsable del tratamiento de los datos personales recabados a través de
          esta plataforma, conforme a la Ley Federal de Protección de Datos Personales
          en Posesión de los Particulares (LFPDPPP).
        </p>
        <p>
          <strong>Datos que recabamos.</strong> Datos de contacto de la persona
          representante (nombre, correo, teléfono), datos de la organización (razón
          social, domicilio, ubicación geográfica, RFC opcional) y las evidencias que
          la organización decide subir a su expediente.
        </p>
        <p>
          <strong>Finalidades.</strong> Gestionar el proceso de certificación CENI:
          registro, autoevaluación, revisión documental, auditoría, dictamen, emisión y
          verificación pública de certificados. No usamos los datos con fines
          publicitarios ni los compartimos con terceros ajenos al proceso.
        </p>
        <p>
          <strong>Publicación en el directorio.</strong> El directorio público muestra
          únicamente: nombre comercial, ciudad y estado, línea certificada, nivel,
          vigencia y folio. Nunca publica correos electrónicos ni teléfonos.
        </p>
        <p>
          <strong>Derechos ARCO.</strong> Puedes solicitar acceso, rectificación,
          cancelación u oposición escribiendo a la dirección de contacto de Alianza
          Índigo Neurodivergente A.C. Responderemos en los plazos que marca la ley.
        </p>
        <p>
          <strong>Conservación y seguridad.</strong> Las contraseñas se almacenan con
          hash Argon2id; las evidencias se guardan en almacenamiento controlado y solo
          son visibles para tu organización y el Comité de Certificación.
        </p>
        <p className="rounded-lg border border-status-warn/40 bg-status-warn/10 p-4 text-sm">
          Nota: este aviso es una plantilla operativa y está pendiente de revisión por
          asesoría legal antes del lanzamiento público.
        </p>
      </div>
    </div>
  );
}
