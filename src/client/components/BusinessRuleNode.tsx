import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import type { BusinessRule } from '../services/BusinessRuleService.js'

export type BusinessRuleNodeData = BusinessRule & {
    /** True when this rule's detail panel is currently open */
    isDetailOpen?: boolean
}

/** Builds a compact comma-separated list of triggered operations */
function buildActionLabel(rule: BusinessRule): string {
    const ops: string[] = []
    if (rule.action_insert) ops.push('Insert')
    if (rule.action_update) ops.push('Update')
    if (rule.action_delete) ops.push('Delete')
    if (rule.action_query) ops.push('Query')
    return ops.length > 0 ? ops.join(' · ') : 'No operations'
}

/**
 * Individual Business Rule card rendered inside a GroupNode container.
 * Displays name, order badge, active status, triggered operations, and
 * an optional "aborts" warning.
 */
export default function BusinessRuleNode({ data }: NodeProps<BusinessRuleNodeData>) {
    const actionLabel = buildActionLabel(data)

    return (
        <div className={`br-node${!data.active ? ' br-node--inactive' : ''}${data.isDetailOpen ? ' br-node--open' : ''}`}>
            <Handle type="target" position={Position.Top} className="br-node__handle" />

            <div className="br-node__header">
                <span className="br-node__order">#{data.order}</span>
                {!data.active && (
                    <span className="br-node__badge br-node__badge--inactive">Inactive</span>
                )}
                {data.abort_action && (
                    <span className="br-node__badge br-node__badge--abort">Aborts</span>
                )}
            </div>

            <div className="br-node__name" title={data.name}>{data.name}</div>

            <div className="br-node__ops">{actionLabel}</div>

            {data.description && (
                <div className="br-node__desc" title={data.description}>
                    {data.description.length > 60
                        ? data.description.slice(0, 57) + '…'
                        : data.description}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="br-node__handle" />
        </div>
    )
}
