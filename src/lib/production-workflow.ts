export const PRODUCTION_STAGES = [
  'Design',
  'Cutting',
  'Polishing',
  'Finishing',
  'Ready',
] as const

export type ProductionStage = typeof PRODUCTION_STAGES[number]

export const PRODUCTION_PRIORITIES = ['standard', 'urgent'] as const

export type ProductionPriority = typeof PRODUCTION_PRIORITIES[number]

export const PRODUCTION_STAGE_LABELS: Record<ProductionStage, string> = {
  Design: 'Design',
  Cutting: 'Cutting',
  Polishing: 'Polishing',
  Finishing: 'Finishing',
  Ready: 'Ready',
}

export const PRODUCTION_PRIORITY_LABELS: Record<ProductionPriority, string> = {
  standard: 'Standard',
  urgent: 'Urgent',
}

export const PRODUCTION_STAGE_ESTIMATES_DAYS: Record<ProductionStage, number> = {
  Design: 2,
  Cutting: 3,
  Polishing: 2,
  Finishing: 2,
  Ready: 1,
}

export const PRODUCTION_METADATA_PATTERN =
  /\[\[(?:production_stage|production_event|production_priority):[^\]]+\]\]/g

const PRODUCTION_STAGE_PATTERN = /\[\[production_stage:([A-Za-z]+)\]\]/g
const PRODUCTION_EVENT_PATTERN = /\[\[production_event:([A-Za-z]+):([^\]]+)\]\]/g
const PRODUCTION_PRIORITY_PATTERN = /\[\[production_priority:(standard|urgent)\]\]/g
const URGENT_ESTIMATE_MULTIPLIER = 0.7
const DAY_MS = 86_400_000

export type ProductionEvent = {
  stage: ProductionStage
  at: string
}

export type ProductionTimelineItem = {
  stage: ProductionStage
  label: string
  status: 'complete' | 'current' | 'upcoming'
  estimatedDays: number
  startedAt: string | null
  completedAt: string | null
  dueAt: string | null
  delayed: boolean
  delayDays: number
}

export type ProductionManagementSummary = {
  stage: ProductionStage
  priority: ProductionPriority
  isUrgent: boolean
  progressPercent: number
  stageStartedAt: string
  daysInCurrentStage: number
  estimatedStageDays: number
  estimatedStageDueAt: string | null
  estimatedCompletionAt: string | null
  isDelayed: boolean
  delayDays: number
  timeline: ProductionTimelineItem[]
}

export function getProductionStageIndex(stage: ProductionStage) {
  return PRODUCTION_STAGES.indexOf(stage)
}

function isProductionStage(value: string | undefined): value is ProductionStage {
  return PRODUCTION_STAGES.includes(value as ProductionStage)
}

function isProductionPriority(value: string | undefined): value is ProductionPriority {
  return PRODUCTION_PRIORITIES.includes(value as ProductionPriority)
}

function safeDate(value: string | Date | null | undefined) {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setTime(next.getTime() + days * DAY_MS)
  return next
}

function daysBetween(start: Date, end = new Date()) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / DAY_MS))
}

function estimateForStage(stage: ProductionStage, priority: ProductionPriority) {
  const base = PRODUCTION_STAGE_ESTIMATES_DAYS[stage]
  if (priority !== 'urgent' || base === 0) return base
  return Math.max(1, Math.ceil(base * URGENT_ESTIMATE_MULTIPLIER))
}

export function productionStageToken(stage: ProductionStage) {
  return `[[production_stage:${stage}]]`
}

export function productionPriorityToken(priority: ProductionPriority) {
  return `[[production_priority:${priority}]]`
}

export function productionEventToken(event: ProductionEvent) {
  return `[[production_event:${event.stage}:${event.at}]]`
}

export function extractProductionStage(notes?: string | null) {
  if (!notes) return null

  const matches = [...notes.matchAll(PRODUCTION_STAGE_PATTERN)]
  const rawStage = matches.at(-1)?.[1]

  return isProductionStage(rawStage) ? rawStage : null
}

export function getProductionPriority(notes?: string | null): ProductionPriority {
  if (!notes) return 'standard'

  const matches = [...notes.matchAll(PRODUCTION_PRIORITY_PATTERN)]
  const rawPriority = matches.at(-1)?.[1]

  return isProductionPriority(rawPriority) ? rawPriority : 'standard'
}

export function extractProductionEvents(notes?: string | null): ProductionEvent[] {
  if (!notes) return []

  return [...notes.matchAll(PRODUCTION_EVENT_PATTERN)]
    .map((match) => {
      const stage = match[1]
      const at = match[2]

      if (!isProductionStage(stage) || !safeDate(at)) return null

      return { stage, at }
    })
    .filter((event): event is ProductionEvent => event !== null)
    .sort((left, right) => new Date(left.at).getTime() - new Date(right.at).getTime())
}

export function getProductionStageFromOrder(order: {
  notes?: string | null
  status?: string | null
}): ProductionStage {
  const storedStage = extractProductionStage(order.notes)
  if (storedStage) return storedStage

  if (order.status === 'shipped' || order.status === 'delivered') return 'Ready'

  return 'Design'
}

export function buildProductionMetadataTokens({
  existingNotes,
  stage,
  priority,
  eventAt,
}: {
  existingNotes?: string | null
  stage: ProductionStage
  priority?: ProductionPriority
  eventAt?: string
}) {
  const resolvedPriority = priority ?? getProductionPriority(existingNotes)
  const previousStage = extractProductionStage(existingNotes)
  const events = extractProductionEvents(existingNotes)
  const shouldAppendEvent = previousStage !== stage || events.length === 0

  const nextEvents = shouldAppendEvent
    ? [...events, { stage, at: eventAt ?? new Date().toISOString() }]
    : events

  return [
    productionStageToken(stage),
    productionPriorityToken(resolvedPriority),
    ...nextEvents.map(productionEventToken),
  ]
}

export function buildProductionManagementSummary(order: {
  notes?: string | null
  status?: string | null
  createdAt?: string | Date | null
}): ProductionManagementSummary {
  const stage = getProductionStageFromOrder(order)
  const priority = getProductionPriority(order.notes)
  const events = extractProductionEvents(order.notes)
  const createdAt = safeDate(order.createdAt) ?? new Date()
  const currentIndex = getProductionStageIndex(stage)
  const now = new Date()
  const stageStartedAt =
    [...events].reverse().find((event) => event.stage === stage)?.at ??
    events.at(-1)?.at ??
    createdAt.toISOString()
  const stageStartedDate = safeDate(stageStartedAt) ?? createdAt
  const estimatedStageDays = estimateForStage(stage, priority)
  const estimatedStageDueAt =
    estimatedStageDays > 0 ? addDays(stageStartedDate, estimatedStageDays).toISOString() : null
  const daysInCurrentStage = daysBetween(stageStartedDate, now)
  const isDelayed =
    order.status !== 'shipped' &&
    order.status !== 'delivered' &&
    estimatedStageDays > 0 &&
    daysInCurrentStage > estimatedStageDays
  const delayDays = isDelayed ? daysInCurrentStage - estimatedStageDays : 0
  const remainingCurrentStageDays = Math.max(0, estimatedStageDays - daysInCurrentStage)
  const remainingFutureDays = PRODUCTION_STAGES.slice(currentIndex + 1).reduce(
    (sum, futureStage) => sum + estimateForStage(futureStage, priority),
    0,
  )
  const estimatedCompletionAt =
    stage === 'Ready'
      ? stageStartedDate.toISOString()
      : addDays(now, remainingCurrentStageDays + remainingFutureDays).toISOString()
  const eventByStage = new Map<ProductionStage, ProductionEvent>()

  for (const event of events) {
    eventByStage.set(event.stage, event)
  }

  const timeline = PRODUCTION_STAGES.map((timelineStage, index) => {
    const event = eventByStage.get(timelineStage)
    const nextEvent = PRODUCTION_STAGES.slice(index + 1)
      .map((nextStage) => eventByStage.get(nextStage))
      .find((item): item is ProductionEvent => Boolean(item))
    const startedAt =
      event?.at ??
      (index === 0 ? createdAt.toISOString() : null)
    const startedDate = safeDate(startedAt)
    const estimatedDays = estimateForStage(timelineStage, priority)
    const dueAt =
      startedDate && estimatedDays > 0 ? addDays(startedDate, estimatedDays).toISOString() : null
    const status: ProductionTimelineItem['status'] =
      index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming'
    const delayed =
      status === 'current' &&
      order.status !== 'shipped' &&
      order.status !== 'delivered' &&
      estimatedDays > 0 &&
      startedDate !== null &&
      daysBetween(startedDate, now) > estimatedDays

    return {
      stage: timelineStage,
      label: PRODUCTION_STAGE_LABELS[timelineStage],
      status,
      estimatedDays,
      startedAt,
      completedAt: nextEvent?.at ?? null,
      dueAt,
      delayed,
      delayDays: delayed && startedDate ? daysBetween(startedDate, now) - estimatedDays : 0,
    }
  })

  return {
    stage,
    priority,
    isUrgent: priority === 'urgent',
    progressPercent: Math.round(((currentIndex + 1) / PRODUCTION_STAGES.length) * 100),
    stageStartedAt: stageStartedDate.toISOString(),
    daysInCurrentStage,
    estimatedStageDays,
    estimatedStageDueAt,
    estimatedCompletionAt,
    isDelayed,
    delayDays,
    timeline,
  }
}
