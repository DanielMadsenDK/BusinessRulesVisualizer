import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

export interface DatabaseNodeData {
    tableName: string
}

/**
 * Central "Database Operation" node placed between the Before and After phase
 * groups. Represents the actual SQL DML operation (INSERT / UPDATE / DELETE).
 */
export default function DatabaseNode({ data }: NodeProps<DatabaseNodeData>) {
    return (
        <div className="db-node">
            <Handle type="target" position={Position.Top} className="db-node__handle" />

            <div className="db-node__icon" aria-hidden="true">
                {/* Simple cylinder-style SVG */}
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="16" cy="8" rx="12" ry="4" fill="#64748b" />
                    <rect x="4" y="8" width="24" height="16" fill="#475569" />
                    <ellipse cx="16" cy="24" rx="12" ry="4" fill="#334155" />
                    <ellipse cx="16" cy="8" rx="12" ry="4" fill="#94a3b8" fillOpacity="0.5" />
                </svg>
            </div>

            <div className="db-node__label">Database Operation</div>
            <div className="db-node__table">{data.tableName}</div>

            <Handle type="source" position={Position.Bottom} className="db-node__handle" />
        </div>
    )
}
