import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

export interface FormNodeData {
    tableName: string
}

/**
 * Central "Form" node placed after the Display phase group.
 * Represents the UI form rendering.
 */
export default function FormNode({ data }: NodeProps<FormNodeData>) {
    return (
        <div className="form-node">
            <Handle type="target" position={Position.Top} className="form-node__handle" />

            <div className="form-node__icon" aria-hidden="true">
                {/* Simple form-style SVG */}
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="24" height="24" rx="2" fill="#64748b" />
                    <rect x="8" y="8" width="16" height="4" rx="1" fill="#94a3b8" />
                    <rect x="8" y="14" width="16" height="2" rx="1" fill="#475569" />
                    <rect x="8" y="18" width="10" height="2" rx="1" fill="#475569" />
                    <rect x="8" y="22" width="14" height="2" rx="1" fill="#475569" />
                </svg>
            </div>

            <div className="form-node__label">Form Render</div>
            <div className="form-node__table"><span className="form-node__table-prefix">Table: </span>{data.tableName}</div>

            <Handle type="source" position={Position.Bottom} className="form-node__handle" />
        </div>
    )
}
