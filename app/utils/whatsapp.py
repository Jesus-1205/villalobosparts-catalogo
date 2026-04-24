from urllib.parse import quote
from app.config import settings
from typing import List, Optional


def generar_mensaje_whatsapp(
    items: List[dict],
    nombre_cliente: Optional[str] = None
) -> str:
    """
    Genera el texto del mensaje de WhatsApp con el pedido.
    
    items: Lista de dicts con keys: nombre, numero_parte, cantidad, precio
    """
    lineas = []
    lineas.append(f"🛒 *Nuevo Pedido - {settings.COMPANY_NAME}*")
    lineas.append("")

    if nombre_cliente:
        lineas.append(f"👤 *Cliente:* {nombre_cliente}")
        lineas.append("")

    lineas.append("📋 *Productos:*")

    total = 0
    for i, item in enumerate(items, 1):
        subtotal = float(item["precio"]) * int(item["cantidad"])
        total += subtotal
        lineas.append(
            f"{i}. {item['nombre']}\n"
            f"   Parte: {item['numero_parte']} | "
            f"Cant: {item['cantidad']} | "
            f"${float(item['precio']):,.2f} c/u"
        )

    lineas.append("")
    lineas.append(f"💰 *Total estimado: ${total:,.2f}*")
    lineas.append("")
    lineas.append("¡Hola! Me interesa realizar la compra de estos productos. ¿Podrían confirmar disponibilidad y opciones de envío?")

    return "\n".join(lineas)


def generar_link_whatsapp(
    items: List[dict],
    nombre_cliente: Optional[str] = None
) -> str:
    """Genera el link completo de wa.me con el mensaje codificado."""
    mensaje = generar_mensaje_whatsapp(items, nombre_cliente)
    mensaje_encoded = quote(mensaje)
    return f"https://wa.me/{settings.WHATSAPP_NUMBER}?text={mensaje_encoded}"
