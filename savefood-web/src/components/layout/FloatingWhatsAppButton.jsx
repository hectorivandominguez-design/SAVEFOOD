import whatsappIcon from '../../assets/WhatsApp.png';

const WHATSAPP_NUMBER = '3242287574';
const WHATSAPP_MESSAGE = 'Hola, quiero ayuda con SAVE FOOD.';

export default function FloatingWhatsAppButton() {
  const whatsappLink = `https://wa.me/57${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noreferrer"
      className="sf-whatsappFloat"
      aria-label="Contáctanos por WhatsApp"
    >
      <span className="sf-whatsappFloatIconWrap" aria-hidden="true">
        <img
          src={whatsappIcon}
          alt=""
          className="sf-whatsappFloatIcon"
        />
      </span>
      <span className="sf-whatsappFloatText">
        Contáctanos
      </span>
    </a>
  );
}
