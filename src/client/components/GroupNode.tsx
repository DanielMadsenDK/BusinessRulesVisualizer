import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

export interface GroupNodeData {
    label: string
    /** 'before' | 'after' | 'async' | 'display' */
    phase: 'before' | 'after' | 'async' | 'display'
    ruleCount: number
    /** Whether the group is currently collapsed (children hidden) */
    collapsed: boolean
    /** Callback to toggle collapsed state — wired up in app.tsx */
    onToggle: () => void
}

/**
 * Phase container node rendered as a labelled group box.
 * Child BusinessRuleNodes are positioned inside this node by React Flow's
 * parent/child (parentId + extent:'parent') mechanism.
 *
 * The header includes a collapse/expand toggle button. When collapsed the
 * group shrinks to header-only height and all child rule nodes are omitted
 * from the flow (handled in buildFlowElements).
 */
export default function GroupNode({ data }: NodeProps<GroupNodeData>) {
    return (
        <div className={`group-node group-node--${data.phase}`}>
            <div className="group-node__header">
                <span className="group-node__label">{data.label}</span>
                <div className="group-node__header-right">
                    <span className="group-node__count">
                        {data.ruleCount} rule{data.ruleCount !== 1 ? 's' : ''}
                    </span>
                    <button
                        className="group-node__toggle"
                        onClick={(e) => { e.stopPropagation(); data.onToggle() }}
                        title={data.collapsed ? 'Expand group' : 'Collapse group'}
                        aria-label={data.collapsed ? 'Expand group' : 'Collapse group'}
                    >
                        <span className={`group-node__toggle-icon ${data.collapsed ? 'group-node__toggle-icon--collapsed' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Source handle at the bottom — connects to DB node (before phase) or nothing */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="group-source"
                className="group-node__handle"
            />
            {/* Target handle at the top — DB node connects into after/async phases */}
            <Handle
                type="target"
                position={Position.Top}
                id="group-target"
                className="group-node__handle"
            />
        </div>
    )
}
