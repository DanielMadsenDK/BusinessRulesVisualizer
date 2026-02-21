import React, { useState, useCallback, useEffect, useRef } from 'react'
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
import SectionLabelNode, { type SectionLabelNodeData } from './components/SectionLabelNode.js'
import DetailPanel from './components/DetailPanel.js'

import {
    type BusinessRule,
    getBusinessRulesForTable,
    getRecentTables,
    saveTablePreference,
} from './services/BusinessRuleService.js'

// ── Layout constants ───────────────────────────────────────────────────────────

const NODE_WIDTH        = 220
const NODE_HEIGHT       = 120
const NODE_GAP          = 20
const GROUP_HEADER      = 70
const GROUP_PADDING_X   = 20
const GROUP_WIDTH       = NODE_WIDTH + GROUP_PADDING_X * 2
const SECTION_LABEL_H   = 36   // height of each section label node
const TOP_ROW_Y         = SECTION_LABEL_H + 44  // 80 — first row of groups (extra breathing room)
const ROW_GAP           = 60   // vertical gap between the two pipeline rows
const SECTION_LABEL_W   = 1250 // spans from COLUMN_X.before(50) to end of async(1040+260)

const COLUMN_X = { before: 50, db: 390, after: 630, async: 1040 }
const DB_WIDTH  = 160
const DB_HEIGHT = 160
const COLLAPSED_H = 52   // Group height when folded to header only

// ── Custom node types ──────────────────────────────────────────────────────────

const nodeTypes: NodeTypes = {
    groupNode:        GroupNode,
    businessRuleNode: BusinessRuleNode,
    databaseNode:     DatabaseNode,
    sectionLabelNode: SectionLabelNode,
}

// ── Flow builder ───────────────────────────────────────────────────────────────

/**
 * Transforms a flat list of BusinessRule records into React Flow nodes + edges.
 *
 * Layout (two independent rows):
 *
 *   ── Record Write Pipeline ───────────────────────────────────────────
 *   [Before]  →  [DB Node]  →  [After]    [Async]
 *
 *   ── Form Load Pipeline ──────────────────────────────────────────────
 *   [Display]
 *
 * - Rules within each phase are sorted by `order` and connected sequentially.
 * - Last Before rule → DB node → First After rule via animated connector edges.
 * - Async rules are in the top row but not connected to the DB pipeline.
 * - Display rules appear in a separate second row with no DB connection.
 * - Group containers (parentId parents) are pushed to the front of the array
 *   so React Flow processes them before their children.
 * - When a group is in collapsedGroups its children are omitted entirely and
 *   the group shrinks to COLLAPSED_H so inter-phase edges connect via the
 *   group's own handles.
 */
function buildFlowElements(
    tableName: string,
    rules: BusinessRule[],
    collapsedGroups: ReadonlySet<string>,
    onToggleGroup: (groupId: string) => void,
    selectedRuleId: string | null = null
): { nodes: Node[]; edges: Edge[] } {
    const before  = rules.filter(r => r.when === 'before').sort((a, b) => a.order - b.order)
    const after   = rules.filter(r => r.when === 'after').sort((a, b) => a.order - b.order)
    const async_  = rules.filter(r => r.when === 'async').sort((a, b) => a.order - b.order)
    const display = rules.filter(r => r.when === 'display').sort((a, b) => a.order - b.order)

    const groupHeight = (count: number) =>
        Math.max(140, GROUP_HEADER + count * (NODE_HEIGHT + NODE_GAP) + 20)

    const effectiveH = (groupId: string, count: number) =>
        collapsedGroups.has(groupId) ? COLLAPSED_H : groupHeight(count)

    // Top row height = tallest group among before / after / async
    const topGroupH = Math.max(
        effectiveH('group-before', before.length),
        effectiveH('group-after',  after.length),
        async_.length > 0 ? effectiveH('group-async', async_.length) : 0
    )

    // Y positions
    // Clamp dbY so the DB node never rises above the group row, even when all
    // groups are collapsed (topGroupH < DB_HEIGHT would otherwise produce a
    // negative offset that overlaps the section label).
    const dbY              = Math.max(TOP_ROW_Y, TOP_ROW_Y + topGroupH / 2 - DB_HEIGHT / 2)
    const displaySectionY  = TOP_ROW_Y + topGroupH + ROW_GAP
    const displayRowY      = displaySectionY + SECTION_LABEL_H + 20

    const groupNodes: Node[] = []
    const ruleNodes:  Node[] = []
    const edges:      Edge[] = []

    // ── Section label helper ───────────────────────────────────────────────────
    function addSectionLabel(id: string, label: string, sublabel: string, y: number, width = SECTION_LABEL_W) {
        groupNodes.push({
            id,
            type:       'sectionLabelNode',
            position:   { x: COLUMN_X.before, y },
            style:      { width, height: SECTION_LABEL_H },
            data:       { label, sublabel } satisfies SectionLabelNodeData,
            selectable: false,
            draggable:  false,
            connectable: false,
        })
    }

    // ── Phase group + children helper ─────────────────────────────────────────
    function addPhase(
        phaseRules: BusinessRule[],
        groupId: string,
        phase: 'before' | 'after' | 'async' | 'display',
        label: string,
        colX: number,
        rowY: number
    ) {
        const isCollapsed = collapsedGroups.has(groupId)
        const h = isCollapsed ? COLLAPSED_H : groupHeight(phaseRules.length)

        groupNodes.push({
            id:       groupId,
            type:     'groupNode',
            position: { x: colX, y: rowY },
            style:    { width: GROUP_WIDTH, height: h },
            data:     {
                label,
                phase,
                ruleCount:  phaseRules.length,
                collapsed:  isCollapsed,
                onToggle:   () => onToggleGroup(groupId),
            } satisfies GroupNodeData,
            // NOTE: do NOT set selectable:false here — React Flow v11 applies
            // pointer-events:none to the whole node wrapper when selectable is
            // false, which prevents the collapse toggle button from firing.
            draggable:  false,
        })

        // Skip children and intra-group edges when collapsed
        if (isCollapsed) return

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
                data:     { ...rule, isDetailOpen: rule.sys_id === selectedRuleId },
                draggable: false,
            })

            // Sequential edge to the next rule in the same phase
            if (idx < phaseRules.length - 1) {
                const nextId = `br-${phaseRules[idx + 1].sys_id}`
                edges.push({
                    id:        `seq-${nodeId}-${nextId}`,
                    source:    nodeId,
                    target:    nextId,
                    type:      'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed },
                    style:     { stroke: '#94a3b8' },
                })
            }
        })
    }

    // ── Top row: Record Write Pipeline ────────────────────────────────────────
    addSectionLabel('label-write', 'Record Write Pipeline',
        'before → database operation → after  ·  async (fire & forget)', 0)

    addPhase(before, 'group-before', 'before', 'Before', COLUMN_X.before, TOP_ROW_Y)
    addPhase(after,  'group-after',  'after',  'After',  COLUMN_X.after,  TOP_ROW_Y)
    if (async_.length > 0) {
        addPhase(async_, 'group-async', 'async', 'Async', COLUMN_X.async, TOP_ROW_Y)
    }

    // DB node — group containers must appear before their children in the array
    ruleNodes.push({
        id:       'db-node',
        type:     'databaseNode',
        position: { x: COLUMN_X.db, y: dbY },
        style:    { width: DB_WIDTH, height: DB_HEIGHT },
        data:     { tableName } satisfies DatabaseNodeData,
        draggable: false,
    })

    // Inter-phase edges: Before → DB
    // When the Before group is collapsed, route from the group handle directly.
    const isBeforeCollapsed = collapsedGroups.has('group-before')
    const lastBeforeId = (!isBeforeCollapsed && before.length > 0)
        ? `br-${before[before.length - 1].sys_id}`
        : null
    edges.push({
        id:       'edge-before-db',
        source:   lastBeforeId ?? 'group-before',
        ...(lastBeforeId ? {} : { sourceHandle: 'group-source' }),
        target:   'db-node',
        type:     'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        label:    (!lastBeforeId && !isBeforeCollapsed) ? 'No Before rules' : undefined,
        style:    { stroke: '#3b82f6', strokeWidth: 2 },
    })

    // Inter-phase edges: DB → After
    // When the After group is collapsed, route into the group handle directly.
    const isAfterCollapsed = collapsedGroups.has('group-after')
    const firstAfterId = (!isAfterCollapsed && after.length > 0)
        ? `br-${after[0].sys_id}`
        : null
    edges.push({
        id:       'edge-db-after',
        source:   'db-node',
        target:   firstAfterId ?? 'group-after',
        ...(firstAfterId ? {} : { targetHandle: 'group-target' }),
        type:     'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        label:    (!firstAfterId && !isAfterCollapsed) ? 'No After rules' : undefined,
        style:    { stroke: '#22c55e', strokeWidth: 2 },
    })

    // ── Bottom row: Form Load Pipeline (Display rules only) ───────────────────
    if (display.length > 0) {
        addSectionLabel('label-display', 'Form Load Pipeline',
            'display rules run before a record is rendered in the form — no database write',
            displaySectionY, GROUP_WIDTH)
        addPhase(display, 'group-display', 'display', 'Display', COLUMN_X.before, displayRowY)
    }

    // Group containers MUST appear before children in the array
    return { nodes: [...groupNodes, ...ruleNodes], edges }
}

// ── App component ──────────────────────────────────────────────────────────────

export default function App() {
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [loading, setLoading]         = useState(false)
    const [error, setError]             = useState<string | null>(null)
    const [recentTables, setRecentTables] = useState<string[]>([])
    const [selectedRule, setSelectedRule] = useState<BusinessRule | null>(null)

    // Tracks current table+rules without triggering re-renders on load
    const currentTableRef = useRef<{ name: string; rules: BusinessRule[] } | null>(null)

    // Which phase groups are currently folded
    const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(new Set())

    const handleToggleGroup = useCallback((groupId: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev)
            if (next.has(groupId)) next.delete(groupId)
            else next.add(groupId)
            return next
        })
    }, [])

    const selectedRuleId = selectedRule?.sys_id ?? null

    const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        if (node.type !== 'businessRuleNode') return
        setSelectedRule(node.data as BusinessRule)
    }, [])

    const handlePanelClose = useCallback(() => setSelectedRule(null), [])

    // Rebuild flow whenever collapsed state or selected rule changes
    useEffect(() => {
        if (!currentTableRef.current) return
        const { name, rules } = currentTableRef.current
        const { nodes: n, edges: e } = buildFlowElements(
            name, rules, collapsedGroups, handleToggleGroup, selectedRuleId
        )
        setNodes(n)
        setEdges(e)
    }, [collapsedGroups, handleToggleGroup, selectedRuleId, setNodes, setEdges])

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
        currentTableRef.current = null

        try {
            const rules = await getBusinessRulesForTable(tableName)

            if (rules.length === 0) {
                setError(`No business rules found on table "${tableName}". Check the table name and try again.`)
            } else {
                currentTableRef.current = { name: tableName, rules }
                setSelectedRule(null)
                // Start with all groups collapsed — the group IDs are deterministic.
                // Any ID that has no matching group node is simply ignored.
                setCollapsedGroups(new Set(['group-before', 'group-after', 'group-async', 'group-display']))
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
                    onNodeClick={handleNodeClick}
                    onPaneClick={handlePanelClose}
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
                                return phase === 'before'  ? '#3b82f6'
                                    :  phase === 'after'   ? '#22c55e'
                                    :  phase === 'async'   ? '#f59e0b'
                                    :  phase === 'display' ? '#a855f7'
                                    :  '#94a3b8'
                            }
                            if (node.type === 'databaseNode') return '#475569'
                            if (node.type === 'sectionLabelNode') return 'transparent'
                            return '#cbd5e1'
                        }}
                        maskColor="rgba(255,255,255,0.6)"
                    />
                </ReactFlow>

                <DetailPanel rule={selectedRule} onClose={handlePanelClose} />
            </div>
        </div>
    )
}
