const examples = [
  {
    id: 'DEMO-042', title: 'Revisión de la unidad de climatización', site: 'Taller de ejemplo Norte',
    status: 'review', assignment: 'Equipo técnico A', date: '18 nov · 09:30',
    report: 'Se limpió el filtro, se comprobó la presión y se dejó el equipo operativo. La prueba final de funcionamiento quedó registrada.',
    signature: 'Conformidad registrada en la simulación.',
  },
  {
    id: 'DEMO-043', title: 'Ajuste del cuadro de ventilación', site: 'Edificio de ejemplo Este',
    status: 'progress', assignment: 'Equipo técnico B', date: '18 nov · 11:00',
    report: 'Se verificaron las conexiones. Queda pendiente la prueba con el sistema a plena carga.',
    signature: 'Conformidad pendiente.',
  },
  {
    id: 'DEMO-039', title: 'Sustitución de sonda de retorno', site: 'Nave de ejemplo Sur',
    status: 'closed', assignment: 'Equipo técnico A', date: '16 nov · 12:15',
    report: 'Se sustituyó la sonda y se comparó su lectura con el ensayo de referencia. La medición se mantuvo estable.',
    signature: 'Conformidad registrada en la simulación.',
  },
  {
    id: 'DEMO-044', title: 'Comprobación de bomba de circulación', site: 'Taller de ejemplo Oeste',
    status: 'review', assignment: 'Equipo técnico C', date: '18 nov · 13:00',
    report: 'Se revisaron ruidos y posibles fugas. El equipo arrancó correctamente en tres pruebas consecutivas.',
    signature: 'Conformidad registrada en la simulación.',
  },
]

const statuses = {
  review: {
    label: 'Por cerrar', icon: '!', heading: 'El parte está listo para revisión',
    note: 'Consulta el parte y confirma el cierre cuando hayas revisado el trabajo.',
    report: 'Parte enviado',
  },
  progress: {
    label: 'En curso', icon: '…', heading: 'Hay una intervención en curso',
    note: 'El equipo técnico está completando las comprobaciones. Aquí puedes consultar las notas registradas.',
    report: 'Notas del técnico',
  },
  closed: {
    label: 'Cerrado', icon: '✓', heading: 'Trabajo cerrado',
    note: 'El parte y la conformidad siguen disponibles en la ficha.',
    report: 'Parte archivado',
  },
}

const get = id => document.getElementById(id)
const workspace = get('workspace')
const search = get('search')
const list = get('work-list')
const detail = get('detail')
const detailTitle = get('detail-title')
const closeWork = get('close-work')
const confirmation = get('confirm')
const report = get('report')
const filterButtons = [...document.querySelectorAll('[data-filter]')]

let jobs
let selectedId
let activeFilter
let mobileDetailOpen

function normalize(text) {
  return text.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '').trim()
}

function findMatches() {
  const tokens = normalize(search.value).split(/\s+/).filter(Boolean)
  return jobs.filter(job => {
    const text = normalize(`${job.title} ${job.site} ${job.id}`)
    return tokens.every(term => text.includes(term))
  })
}

function element(tag, className, content) {
  const node = document.createElement(tag)
  node.className = className
  if (content) node.textContent = content
  return node
}

function jobRow(job) {
  const row = document.createElement('li')
  const button = element('button', 'work-button')
  button.type = 'button'
  button.dataset.jobId = job.id
  button.dataset.status = job.status
  button.setAttribute('aria-controls', 'detail')
  if (job.id === selectedId) button.setAttribute('aria-current', 'true')

  const main = element('span', 'work-info')
  main.append(element('strong', '', job.title), element('small', '', job.site))
  const label = element('span', 'badge', statuses[job.status].label)
  const chevron = element('span', 'row-chevron')
  chevron.setAttribute('aria-hidden', 'true')
  button.append(main, label, chevron)
  row.append(button)
  return row
}

function renderDetail(job) {
  detail.hidden = !job
  if (!job) return
  const status = statuses[job.status]
  detail.dataset.status = job.status
  detailTitle.textContent = job.title
  get('detail-id').textContent = job.id
  get('detail-state').textContent = status.label
  get('detail-site').textContent = job.site
  get('detail-assignment').textContent = job.assignment
  get('detail-date').textContent = job.date
  get('focus-icon').textContent = status.icon
  get('action-title').textContent = status.heading
  get('action-copy').textContent = status.note
  get('report-status').textContent = status.report
  get('report-text').textContent = job.report
  get('report-signature').textContent = job.signature
  closeWork.hidden = job.status !== 'review'
}

function render() {
  const matches = findMatches()
  const visibleJobs = matches.filter(job => activeFilter === 'all' || job.status === activeFilter)
  selectedId = visibleJobs.find(job => job.id === selectedId)?.id ?? visibleJobs[0]?.id
  const selected = visibleJobs.find(job => job.id === selectedId)

  for (const button of filterButtons) {
    const filter = button.dataset.filter
    const count = filter === 'all' ? matches.length : matches.filter(job => job.status === filter).length
    button.setAttribute('aria-pressed', String(filter === activeFilter))
    button.querySelector('span').textContent = count
  }

  get('result-count').textContent = visibleJobs.length === 1 ? '1 trabajo' : `${visibleJobs.length} trabajos`
  get('empty').hidden = visibleJobs.length > 0
  list.replaceChildren(...visibleJobs.map(jobRow))
  workspace.classList.toggle('show-detail', mobileDetailOpen && Boolean(selected))
  renderDetail(selected)
}

function showList() {
  mobileDetailOpen = false
  render()
  const currentRow = [...list.querySelectorAll('[data-job-id]')].find(row => row.dataset.jobId === selectedId)
  const target = currentRow ?? search
  target.focus()
}

function clearFilters() {
  search.value = ''
  activeFilter = 'all'
  report.open = false
  mobileDetailOpen = false
  render()
  search.focus()
}

function resetDemo(announce = false) {
  jobs = examples.map(job => ({ ...job }))
  selectedId = jobs[0].id
  activeFilter = 'all'
  mobileDetailOpen = false
  search.value = ''
  report.open = false
  render()
  if (announce) get('announcement').textContent = 'Demo reiniciada.'
}

list.addEventListener('click', event => {
  const button = event.target.closest('[data-job-id]')
  if (!button) return
  selectedId = button.dataset.jobId
  mobileDetailOpen = true
  report.open = false
  render()
  detailTitle.focus()
})

for (const button of filterButtons) {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter
    report.open = false
    render()
  })
}

search.addEventListener('input', () => {
  report.open = false
  render()
})
get('back').addEventListener('click', showList)
get('clear').addEventListener('click', clearFilters)
get('reset').addEventListener('click', () => resetDemo(true))
closeWork.addEventListener('click', () => {
  confirmation.returnValue = 'cancel'
  confirmation.showModal()
})

confirmation.addEventListener('close', () => {
  if (confirmation.returnValue !== 'close') return
  const job = jobs.find(item => item.id === selectedId)
  if (job?.status !== 'review') return

  job.status = 'closed'
  if (activeFilter === 'review') activeFilter = 'all'
  render()
  get('announcement').textContent = `${job.title}. Trabajo cerrado.`
  detailTitle.focus()
})

resetDemo()
