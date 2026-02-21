import React from 'react'
import { type NodeProps } from 'reactflow'

export interface SectionLabelNodeData {
    label: string
    sublabel?: string
}

/**
 * Non-interactive section divider node.
 * Renders a horizontal rule with a centred label — used to separate the
 * "Record Write Pipeline" row from the "Form Load Pipeline" row.
 */
export default function SectionLabelNode({ data }: NodeProps<SectionLabelNodeData>) {
    return (
        <div className="section-label-node">
            <div className="section-label-node__line" />
            <div className="section-label-node__content">
                <span className="section-label-node__text">{data.label}</span>
                {data.sublabel && (
                    <span className="section-label-node__sub">{data.sublabel}</span>
                )}
            </div>
            <div className="section-label-node__line" />
        </div>
    )
}
