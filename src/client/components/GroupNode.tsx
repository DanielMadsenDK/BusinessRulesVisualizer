import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

export interface GroupNodeData {
    label: string
    /** 'before' | 'after' | 'async' */
    phase: 'before' | 'after' | 'async'
    ruleCount: number
}

/**
 * Phase container node rendered as a labelled group box.
 * Child BusinessRuleNodes are positioned inside this node by React Flow's
 * parent/child (parentId + extent:'parent') mechanism.
 */
export default function GroupNode({ data }: NodeProps<GroupNodeData>) {
    return (
        <div className={`group-node group-node--${data.phase}`}>
            <div className="group-node__header">
                <span className="group-node__label">{data.label}</span>
                <span className="group-node__count">{data.ruleCount} rule{data.ruleCount !== 1 ? 's' : ''}</span>
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
