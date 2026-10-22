import { describe, expect, it } from 'vitest'
import {
  computePosition,
  dropPosition,
  filterAndSortTasks,
  nextTaskCode,
  statusForStage,
  type TaskStatus,
} from './tasks'

const at = (...positions: number[]) => positions.map(position => ({ position }))

describe('computePosition', () => {
  it('starts an empty column at 1', () => {
    expect(computePosition([], 0)).toBe(1)
  })

  it('goes one below the first card when inserted at the top', () => {
    expect(computePosition(at(5, 6), 0)).toBe(4)
  })

  it('goes one above the last card when inserted at the end', () => {
    expect(computePosition(at(1, 2, 3), 3)).toBe(4)
  })

  it('clamps an index past the end to the end', () => {
    expect(computePosition(at(1, 2), 10)).toBe(3)
  })

  it('takes the midpoint between its neighbours', () => {
    expect(computePosition(at(1, 2, 3), 1)).toBe(1.5)
    expect(computePosition(at(1, 1.5, 2), 2)).toBe(1.75)
  })
})

describe('dropPosition', () => {
  const column = [
    { id: 'a', position: 1 },
    { id: 'b', position: 2 },
    { id: 'c', position: 3 },
  ]

  it('places a card from another column between its new neighbours', () => {
    expect(dropPosition(column, 'x', 1)).toBe(1.5)
  })

  it('places a card at the top of its own column', () => {
    expect(dropPosition(column, 'c', 0)).toBe(0)
  })

  // Known bug: the drop index is measured against the rendered column, which
  // still contains the dragged card, but the position is computed without it.
  // Dragging "a" to just above "c" (index 2) lands it after "c" instead.
  it.fails('places a card dragged down its own column above the card it was dropped on', () => {
    expect(dropPosition(column, 'a', 2)).toBe(2.5)
  })
})

describe('statusForStage', () => {
  it.each([
    ['done',    'complete'],
    ['doing',   'on-track'],
    ['todo',    'default'],
    ['backlog', 'default'],
  ])('%s → %s', (stage, status) => {
    expect(statusForStage(stage)).toBe(status)
  })
})

describe('nextTaskCode', () => {
  it('starts at T001 for a project with no tasks', () => {
    expect(nextTaskCode('EDC-001', [])).toBe('EDC-T001')
  })

  it('continues from the highest existing number', () => {
    expect(nextTaskCode('EDC-001', ['EDC-T004', 'EDC-T010', 'EDC-T002'])).toBe('EDC-T011')
  })

  it('ignores codes from other prefixes and non-numeric suffixes', () => {
    expect(nextTaskCode('EDC-001', ['NVT-T099', 'EDC-Tabc'])).toBe('EDC-T001')
  })

  it('handles project codes without a number', () => {
    expect(nextTaskCode('DMT', ['DMT-T007'])).toBe('DMT-T008')
  })
})

describe('filterAndSortTasks', () => {
  const task = (name: string, code: string, status: TaskStatus, owner_id: string | null) =>
    ({ name, code, status, owner_id })

  const tasks = [
    task('Write docs',   'EDC-T003', 'default',     'u2'),
    task('Audit app',    'EDC-T001', 'overdue',     null),
    task('Build button', 'EDC-T002', 'approaching', 'u1'),
  ]
  const members = [
    { id: 'u1', name: 'Zoe',  email: 'zoe@example.com' },
    { id: 'u2', name: null,   email: 'amy@example.com' },
  ]

  it('keeps the original order when sorting manually', () => {
    expect(filterAndSortTasks(tasks, '', 'manual', members)).toEqual(tasks)
  })

  it('filters by name or code, ignoring case', () => {
    expect(filterAndSortTasks(tasks, 'AUDIT', 'manual', members).map(t => t.code)).toEqual(['EDC-T001'])
    expect(filterAndSortTasks(tasks, 't002', 'manual', members).map(t => t.code)).toEqual(['EDC-T002'])
  })

  it('sorts alphabetically by name', () => {
    expect(filterAndSortTasks(tasks, '', 'alphabetical', members).map(t => t.name))
      .toEqual(['Audit app', 'Build button', 'Write docs'])
  })

  it('sorts by urgency, overdue first', () => {
    expect(filterAndSortTasks(tasks, '', 'status', members).map(t => t.status))
      .toEqual(['overdue', 'approaching', 'default'])
  })

  it('sorts by assignee name or email, unassigned last', () => {
    expect(filterAndSortTasks(tasks, '', 'assignee', members).map(t => t.owner_id))
      .toEqual(['u2', 'u1', null])
  })

  it('does not mutate the input', () => {
    const copy = [...tasks]
    filterAndSortTasks(tasks, '', 'alphabetical', members)
    expect(tasks).toEqual(copy)
  })
})
