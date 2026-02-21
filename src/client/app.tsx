import React, { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    type Node,
    type Edge,
    type NodeTypes,
    useNodesState,
    useEdgesState,
    MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './app.css'

import TableSelector from './components/TableSelector.js'
import GroupNode, { type GroupNodeData } from './components/GroupNode.js'
import BusinessRuleNode from './components/BusinessRuleNode.js'
import DatabaseNode, { type DatabaseNodeData } from './components/DatabaseNode.js'

import {
    type BusinessRule,
    getBusinessRulesForTable,
    getRecentTables,
    saveTablePreference,
} from './services/BusinessRuleService.js'

// ── Layout constants ───────────────────────────────────────────────────────────

const NODE_WIDTH      = 220
const NODE_HEIGHT     = 120
const NODE_GAP        = 20
const GROUP_HEADER    = 70
const GROUP_PADDING_X = 20
const GROUP_WIDTH     = NODE_WIDTH + GROUP_PADDING_X * 2

const COLUMN_X = { before: 50, db: 390, after: 630, async: 1040 }
const DB_WIDTH  = 160
const DB_HEIGHT = 160

// ── Custom node types ──────────────────────────────────────────────────────────

const nodeTypes: NodeTypes = {
    groupNode:        GroupNode,
    businessRuleNode: BusinessRuleNode,
    databaseNode:     DatabaseNode,
}

// ── Flow builder ───────────────────────────────────────────────────────────────

/**
 * Transforms a flat list of BusinessRule records into React Flow nodes + edges.
 *
 * Layout:
 *   [Before Group]  →  [DB Node]  →  [After Group]    [Async Group]
 *
 * - Rules within each phase are sorted by `order` and connected sequentially.
 * - Last Before rule → DB node → First After rule via animated connector edges.
 * - Async rules are laid out separately with no DB connection.
 * - Group containers (parentId parents) are pushed to the front of the array
 *   so React Flow processes them before their children.
 */
function buildFlowElements(
    tableName: string,
    rules: BusinessRule[]
): { nodes: Node[]; edges: Edge[] } {
    const before = rules.filter(r => r.when === 'before').sort((a, b) => a.order - b.order)
    const after  = rules.filter(r => r.when === 'after').sort((a, b) => a.order - b.order)
    const async_ = rules.filter(r => r.when === 'async').sort((a, b) => a.order - b.order)

    const groupHeight = (count: number) =>
        Math.max(140, GROUP_HEADER + count * (NODE_HEIGHT + NODE_GAP) + 20)

    const maxGroupH = Math.max(groupHeight(before.length), groupHeight(after.length))
    const dbY = 100 + maxGroupH / 2 - DB_HEIGHT / 2

    const groupNodes: Node[] = []
    const ruleNodes:  Node[] = []
    const edges:      Edge[] = []

    // Build a group container + its child rule nodes for one phase
    function addPhase(
        phaseRules: BusinessRule[],
        groupId: string,
        phase: 'before' | 'after' | 'async',
        label: string,
        colX: number
    ) {
        groupNodes.push({
            id:       groupId,
            type:     'groupNode',
            position: { x: colX, y: 100 },
            style:    { width: GROUP_WIDTH, height: groupHeight(phaseRules.length) },
            data:     { label, phase, ruleCount: phaseRules.length } satisfies GroupNodeData,
            selectable: false,
            draggable:  false,
        })

        phaseRules.forEach((rule, idx) => {
            const nodeId = `br-${rule.sys_id}`
            ruleNodes.push({
                id:       nodeId,
                type:     'businessRuleNode',
                parentId: groupId,
                extent:   'parent',
                position: {
                    x: GROUP_PADDING_X,
                    y: GROUP_HEADER + idx * (NODE_HEIGHT + NODE_GAP),
                },
                style:    { width: NODE_WIDTH, height: NODE_HEIGHT },
                data:     { ...rule },
                draggable: false,
            })

            // Sequential edge to next rule in same phase
            if (idx < phaseRules.length - 1) {
                const nextId = `br-${phaseRules[idx + 1].sys_id}`
                edges.push({
                    id:     `seq-${nodeId}-${nextId}`,
                    source: nodeId,
                    target: nextId,
                    type:   'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed },
                    style: { stroke: '#94a3b8' },
                })
            }
        })
    }

    addPhase(before, 'group-before', 'before', 'Before', COLUMN_X.before)
    addPhase(after,  'group-after',  'after',  'After',  COLUMN_X.after)
    if (async_.length > 0) {
        addPhase(async_, 'group-async', 'async', 'Async', COLUMN_X.async)
    }

    // DB node — parent nodes must come before children, so push after groups
    ruleNodes.push({
        id:       'db-node',
        type:     'databaseNode',
        position: { x: COLUMN_X.db, y: dbY },
        style:    { width: DB_WIDTH, height: DB_HEIGHT },
        data:     { tableName } satisfies DatabaseNodeData,
        draggable: false,
    })

    // Inter-phase edges: Before → DB
    const lastBeforeId = before.length > 0 ? `br-${before[before.length - 1].sys_id}` : null
    edges.push({
        id:     'edge-before-db',
        source: lastBeforeId ?? 'group-before',
        ...(lastBeforeId ? {} : { sourceHandle: 'group-source' }),
        target: 'db-node',
        type:   'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        label:  lastBeforeId ? undefined : 'No Before rules',
        style:  { stroke: '#3b82f6', strokeWidth: 2 },
    })

    // Inter-phase edges: DB → After
    const firstAfterId = after.length > 0 ? `br-${after[0].sys_id}` : null
    edges.push({
        id:     'edge-db-after',
        source: 'db-node',
        target: firstAfterId ?? 'group-after',
        ...(firstAfterId ? {} : { targetHandle: 'group-target' }),
        type:   'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        label:  firstAfterId ? undefined : 'No After rules',
        style:  { stroke: '#22c55e', strokeWidth: 2 },
    })

    // Group containers MUST appear before children in the array
    return { nodes: [...groupNodes, ...ruleNodes], edges }
}

// ── App component ──────────────────────────────────────────────────────────────

export default function App() {
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [loading, setLoading]     = useState(false)
    const [error, setError]         = useState<string | null>(null)
    const [recentTables, setRecentTables] = useState<string[]>([])

    // Load recent tables on mount
    useEffect(() => {
        getRecentTables()
            .then(setRecentTables)
            .catch(() => { /* silent — preferences are non-critical */ })
    }, [])

    const handleVisualize = useCallback(async (tableName: string) => {
        setLoading(true)
        setError(null)
        setNodes([])
        setEdges([])

        try {
            const rules = await getBusinessRulesForTable(tableName)

            if (rules.length === 0) {
                setError(`No business rules found on table "${tableName}". Check the table name and try again.`)
            } else {
                const { nodes: n, edges: e } = buildFlowElements(tableName, rules)
                setNodes(n)
                setEdges(e)
            }

            // Persist preference fire-and-forget
            saveTablePreference(tableName)
                .then(() => getRecentTables().then(setRecentTables))
                .catch(() => { /* silent */ })

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            setError(`Failed to load business rules: ${msg}`)
        } finally {
            setLoading(false)
        }
    }, [setNodes, setEdges])

    const showEmpty = nodes.length === 0 && !loading && !error

    return (
        <div className="brvApp">
            <TableSelector
                loading={loading}
                error={error}
                recentTables={recentTables}
                onVisualize={handleVisualize}
                onDismissError={() => setError(null)}
            />

            <div className="brvApp__canvas">
                {showEmpty && (
                    <div className="brvApp__empty">
                        <div className="brvApp__empty-icon" aria-hidden="true">⚙</div>
                        <div className="brvApp__empty-title">Ready to visualize</div>
                        <div className="brvApp__empty-hint">
                            Enter a ServiceNow table name above and click{' '}
                            <strong>Visualize</strong>
                        </div>
                    </div>
                )}

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={true}
                    attributionPosition="bottom-left"
                    minZoom={0.2}
                    maxZoom={2}
                >
                    <Background color="#e2e8f0" gap={24} />
                    <Controls />
                    <MiniMap
                        nodeColor={(node) => {
                            if (node.type === 'groupNode') {
                                const phase = (node.data as GroupNodeData).phase
                                return phase === 'before' ? '#3b82f6'
                                    : phase === 'after'  ? '#22c55e'
                                    : '#f59e0b'
                            }
                            if (node.type === 'databaseNode') return '#475569'
                            return '#cbd5e1'
                        }}
                        maskColor="rgba(255,255,255,0.6)"
                    />
                </ReactFlow>
            </div>
        </div>
    )
}
