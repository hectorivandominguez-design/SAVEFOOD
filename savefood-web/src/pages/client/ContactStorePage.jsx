import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getStoreConfig } from '../../services/store/storeConfigService';
import '../../styles/App.css';

const DEFAULT_CONTACT = {
  sede: 'Bosa',
  telefonoTienda: '3242287574',
  whatsappTienda: '3242287574',
  direccion: 'Salchipapería D.C. sede Bosa',
  horarioAtencion: 'Consulta disponibilidad directamente con la tienda.',
};

function sanitizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

export default function ContactStorePage() {
  const { id } = useParams();
  const [store, setStore] = useState(DEFAULT_CONTACT);
  const [loading, setLoading] = useState(true);
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    async function loadStore() {
      setLoading(true);
      setInfoMessage('');

      try {
        const result = await getStoreConfig();
        setStore({
          ...DEFAULT_CONTACT,
          ...result,
          telefonoTienda: result?.telefonoTienda || DEFAULT_CONTACT.telefonoTienda,
          whatsappTienda: result?.whatsappTienda || DEFAULT_CONTACT.whatsappTienda,
          sede: result?.sede || DEFAULT_CONTACT.sede,
        });
      } catch (err) {
        setStore(DEFAULT_CONTACT);
        setInfoMessage(
          'Mostramos el contacto principal de la tienda para que puedas comunicarte sin interrupciones.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadStore();
  }, []);

  const phoneNumber = sanitizePhone(store.telefonoTienda || DEFAULT_CONTACT.telefonoTienda);
  const whatsappNumber = sanitizePhone(store.whatsappTienda || DEFAULT_CONTACT.whatsappTienda);

  const callLink = useMemo(() => `tel:${phoneNumber}`, [phoneNumber]);
  const whatsappLink = useMemo(() => `https://wa.me/57${whatsappNumber}`, [whatsappNumber]);

  if (loading) {
    return (
      <div className="sf-clientSection">
        <div className="sf-clientInfoCard">Cargando información de contacto de la tienda...</div>
      </div>
    );
  }

  return (
    <div className="sf-clientSection">
      <div className="sf-contactCard">
        <div className="sf-contactHeader">
          <div className="sf-contactHeaderCopy">
            <span className="sf-sectionEyebrow">Contacto</span>
            <h1>Contacta la tienda</h1>
            <p className="sf-clientSectionSubtitle">
              Comunicación directa con la sede {store.sede}
              {id ? ` para el pedido ${id}` : ''}.
            </p>
          </div>

          <div className="sf-contactPrimaryPill">
            <span className="sf-contactPrimaryLabel">Número principal</span>
            <strong>{phoneNumber}</strong>
          </div>
        </div>

        <div className="sf-contactIntro">
          <p>
            Puedes llamar o escribir por WhatsApp para resolver dudas sobre recogida,
            horarios, estado general del pedido o confirmación del retiro en tienda.
          </p>
          {infoMessage ? <p className="sf-contactNote">{infoMessage}</p> : null}
        </div>

        <div className="sf-contactInfoGrid">
          <article className="sf-contactInfoCard">
            <span>Sede</span>
            <strong>{store.sede}</strong>
          </article>
          <article className="sf-contactInfoCard">
            <span>Teléfono</span>
            <strong>{phoneNumber}</strong>
          </article>
          <article className="sf-contactInfoCard">
            <span>WhatsApp</span>
            <strong>{whatsappNumber}</strong>
          </article>
          <article className="sf-contactInfoCard">
            <span>Horario</span>
            <strong>{store.horarioAtencion || DEFAULT_CONTACT.horarioAtencion}</strong>
          </article>
        </div>

        <div className="sf-contactActions">
          <a href={callLink} className="sf-contactAction sf-contactAction--call">
            <span className="sf-contactActionIcon" aria-hidden="true">☎</span>
            <span>
              <strong>Llamar a tienda</strong>
              <small>{phoneNumber}</small>
            </span>
          </a>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="sf-contactAction sf-contactAction--whatsapp"
          >
            <span className="sf-contactActionIcon" aria-hidden="true">◉</span>
            <span>
              <strong>Escribir por WhatsApp</strong>
              <small>{whatsappNumber}</small>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
