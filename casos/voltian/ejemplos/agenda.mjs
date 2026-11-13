/**
 * Ejemplo didáctico con visitas ficticias.
 * Cada hora es un instante ISO con zona horaria explícita.
 */
export function visitasEnConflicto(visita, agenda) {
  const inicio = Date.parse(visita.inicio)
  const fin = Date.parse(visita.fin)

  if (!(inicio < fin)) throw new RangeError('La visita debe tener un intervalo válido')

  return agenda.filter(otra => {
    if (visita.id === otra.id || visita.equipo !== otra.equipo) return false

    const otroInicio = Date.parse(otra.inicio)
    const otroFin = Date.parse(otra.fin)

    // Dos visitas consecutivas pueden compartir la hora de salida y entrada.
    return otroInicio < otroFin && otroInicio < fin && inicio < otroFin
  })
}

const visita = {
  id: 'DEMO-1', equipo: 'Equipo A',
  inicio: '2026-11-18T09:00:00+01:00', fin: '2026-11-18T10:15:00+01:00',
}

export const ejemplo = visitasEnConflicto(visita, [
  { id: 'DEMO-2', equipo: 'Equipo A', inicio: '2026-11-18T10:00:00+01:00', fin: '2026-11-18T11:00:00+01:00' },
  { id: 'DEMO-3', equipo: 'Equipo A', inicio: '2026-11-18T10:15:00+01:00', fin: '2026-11-18T11:15:00+01:00' },
  { id: 'DEMO-4', equipo: 'Equipo B', inicio: '2026-11-18T09:00:00+01:00', fin: '2026-11-18T10:00:00+01:00' },
])
// Resultado: [DEMO-2].
