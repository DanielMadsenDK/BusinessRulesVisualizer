import React from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'

const initialNodes = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Before Business Rule' } },
    { id: '2', position: { x: 0, y: 100 }, data: { label: 'After Business Rule' } },
]
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }]

export default function App() {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow nodes={initialNodes} edges={initialEdges}>
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    )
}
