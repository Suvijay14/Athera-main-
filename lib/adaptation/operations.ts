import type { Operation } from './types'

export function describe(op: Operation): string {
  switch (op.op) {
    case 'create_field':
      return `Add a '${op.field.label}' field`
    case 'delete_field':
      return `Remove the '${op.key}' field`
    case 'set_field_visibility':
      return op.visible
        ? `Show the '${op.key}' field`
        : `Hide the '${op.key}' field`
    case 'update_field':
      return `Update the '${op.key}' field`
    case 'create_entity':
      return `Add ${op.entity.kind} “${op.entity.name}”`
    case 'delete_entity':
      return 'Remove an entity'
    case 'create_view': {
      const grouped =
        op.view.type !== 'list' && op.view.groupByField
          ? `, grouped by ${op.view.groupByField}`
          : ''
      return `Add a '${op.view.name}' view${grouped}`
    }
    case 'delete_view':
      return 'Remove a view'
    case 'backfill_field': {
      const count = Object.keys(op.values).length
      return `Fill in '${op.key}' for ${count} item${count === 1 ? '' : 's'}`
    }
    case 'create_recurrence_rule': {
      const title =
        typeof op.rule.templateItem.title === 'string' ? op.rule.templateItem.title : 'item'
      const every = op.rule.intervalCount === 2 ? 'every 2 weeks' : 'weekly'
      return `Make '${title}' repeat ${every}`
    }
    case 'delete_recurrence_rule':
      return 'Remove a recurrence rule'
    case 'set_recurrence_exception':
      return `Skip recurrence on ${op.date}`
    case 'end_recurrence_rule':
      return `End recurrence on ${op.endsOn}`
    case 'remove_recurrence_exception':
      return `Restore recurrence on ${op.date}`
    case 'restore_recurrence_ends_on':
      return 'Restore recurrence end date'
    case 'clear_item_recurrence':
      return 'Unlink items from recurrence'
    case 'link_items_recurrence':
      return 'Link items to recurrence'
    case 'archive_entity':
      return 'Archive this contact and their open undated items'
    case 'unarchive_entity':
      return 'Restore this contact'
    case 'create_followup_item':
      return `Add follow-up “${op.title}”`
    case 'delete_work_item':
      return 'Remove a follow-up item'
    case 'restore_work_item':
      return 'Restore a removed follow-up item'
    case 'create_draft':
      return `Save a ${op.channel} check-in draft`
    case 'delete_draft':
      return 'Remove a draft message'
    case 'create_space':
      return `Create space “${op.space.name}”`
    case 'delete_space':
      return 'Remove a space created by Athera'
    case 'move_work_item_space':
      return 'Move a work item to another space'
    case 'move_entity_space':
      return 'Move an entity to another space'
    default: {
      const _exhaustive: never = op
      return _exhaustive
    }
  }
}
