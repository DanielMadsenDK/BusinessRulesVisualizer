import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { Drawer, Badge, Group, Text, ActionIcon, Stack, ScrollArea, Code, Loader, Alert, Tooltip, Anchor } from '@mantine/core'
import { IconCopy, IconCheck, IconAlertCircle, IconExternalLink } from '@tabler/icons-react'
import type { BusinessRule } from '../services/BusinessRuleService.js'
import { getScriptForRule } from '../services/BusinessRuleService.js'

export interface DetailPanelProps {
    rule: BusinessRule | null
    onClose: () => void
}

const PHASE_COLORS: Record<string, { bg: string; text: string }> = {
    before:  { bg: '#dbeafe', text: '#1d4ed8' },
    after:   { bg: '#dcfce7', text: '#15803d' },
    async:   { bg: '#fef3c7', text: '#b45309' },
    display:         { bg: '#f3e8ff', text: '#7e22ce' },
    before_display:  { bg: '#f3e8ff', text: '#7e22ce' },
}

export default function DetailPanel({ rule, onClose }: DetailPanelProps) {
    const [script, setScript]           = useState<string | null>(null)
    const [scriptLoading, setScriptLoading] = useState(false)
    const [scriptError, setScriptError]     = useState<string | null>(null)
    const [copied, setCopied]           = useState(false)
    const copyTimerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Fetch script whenever a new rule is selected
    useEffect(() => {
        setScript(null)
        setScriptError(null)
        setCopied(false)

        if (!rule) return

        setScriptLoading(true)
        getScriptForRule(rule.sys_id)
            .then(data => setScript(data.script))
            .catch(err => setScriptError(err instanceof Error ? err.message : 'Failed to load script'))
            .finally(() => setScriptLoading(false))
    }, [rule?.sys_id])   // eslint-disable-line react-hooks/exhaustive-deps

    // Clean up copy timer on unmount
    useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current) }, [])

    const handleCopy = useCallback(() => {
        if (!script) return
        navigator.clipboard.writeText(script)
            .then(() => {
                setCopied(true)
                if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
                copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
            })
            .catch(() => {})
    }, [script])

    const isOpen = rule !== null
    const phaseStyle = rule ? PHASE_COLORS[rule.when] ?? { bg: '#f1f5f9', text: '#475569' } : null

    const ops = rule ? [
        { label: 'Insert', active: rule.action_insert },
        { label: 'Update', active: rule.action_update },
        { label: 'Delete', active: rule.action_delete },
        { label: 'Query',  active: rule.action_query  },
    ] : []

    return (
        <Drawer
            opened={isOpen}
            onClose={onClose}
            position="right"
            size="lg"
            padding="md"
            title={
                <Group gap="sm">
                    {rule && phaseStyle && (
                        <Badge 
                            variant="filled" 
                            style={{ backgroundColor: phaseStyle.bg, color: phaseStyle.text }}
                        >
                            {rule.when}
                        </Badge>
                    )}
                    <Text fw={600} size="lg" truncate style={{ maxWidth: 300 }}>
                        {rule?.name ?? ''}
                    </Text>
                </Group>
            }
            styles={{
                header: { borderBottom: '1px solid var(--mantine-color-gray-3)', paddingBottom: 'var(--mantine-spacing-sm)' },
                body: { padding: 0, height: 'calc(100vh - 90px)' }
            }}
        >
            {rule && (
                <ScrollArea h="100%" p="md">
                    <Stack gap="xl">
                        {/* Metadata row */}
                        <Group gap="xs">
                            <Badge variant="light" color="gray">Order: {rule.order}</Badge>
                            <Badge variant="light" color="gray">Priority: {rule.priority}</Badge>
                            {rule.inherited_from && (
                                <Badge variant="light" color="blue">Inherited: {rule.inherited_from}</Badge>
                            )}
                            <Badge variant="light" color={rule.active ? 'green' : 'red'}>
                                {rule.active ? 'Active' : 'Inactive'}
                            </Badge>
                            {rule.abort_action && (
                                <Badge variant="filled" color="red">⚠ Aborts transaction</Badge>
                            )}
                        </Group>

                        {/* Triggers on */}
                        <Stack gap="xs">
                            <Text size="sm" fw={600} c="dimmed" tt="uppercase">Triggers on</Text>
                            <Group gap="xs">
                                {ops.map(op => (
                                    <Badge 
                                        key={op.label} 
                                        variant={op.active ? 'filled' : 'outline'} 
                                        color={op.active ? 'blue' : 'gray'}
                                    >
                                        {op.label}
                                    </Badge>
                                ))}
                            </Group>
                        </Stack>

                        {/* Description */}
                        {rule.description && (
                            <Stack gap="xs">
                                <Text size="sm" fw={600} c="dimmed" tt="uppercase">Description</Text>
                                <Text size="sm">{rule.description}</Text>
                            </Stack>
                        )}

                        {/* Condition (simple) */}
                        {rule.condition && (
                            <Stack gap="xs">
                                <Text size="sm" fw={600} c="dimmed" tt="uppercase">Condition</Text>
                                <Code block>{rule.condition}</Code>
                            </Stack>
                        )}

                        {/* Filter condition (raw encoded query string) */}
                        {rule.filter_condition && (
                            <Stack gap="xs">
                                <Text size="sm" fw={600} c="dimmed" tt="uppercase">Filter condition</Text>
                                <Code block>{rule.filter_condition}</Code>
                            </Stack>
                        )}

                        {/* Script */}
                        <Stack gap="xs" style={{ flex: 1 }}>
                            <Group justify="space-between">
                                <Text size="sm" fw={600} c="dimmed" tt="uppercase">Script</Text>
                                {script && !scriptLoading && (
                                    <Tooltip label={copied ? 'Copied!' : 'Copy script'} withArrow position="left">
                                        <ActionIcon 
                                            variant="light" 
                                            color={copied ? 'teal' : 'gray'} 
                                            onClick={handleCopy}
                                        >
                                            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                            </Group>

                            {scriptLoading && (
                                <Group justify="center" p="xl">
                                    <Loader size="sm" />
                                    <Text size="sm" c="dimmed">Loading script...</Text>
                                </Group>
                            )}

                            {scriptError && !scriptLoading && (
                                <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" variant="light">
                                    {scriptError}
                                </Alert>
                            )}

                            {script !== null && !scriptLoading && !scriptError && (
                                script.trim() ? (
                                    <Highlight theme={themes.vsDark} code={script} language="javascript">
                                        {({ style, tokens, getLineProps, getTokenProps }) => (
                                            <pre style={{ ...style, padding: '1rem', borderRadius: '4px', overflowX: 'auto', fontSize: '13px', margin: 0 }}>
                                                {tokens.map((line, i) => (
                                                    <div key={i} {...getLineProps({ line })}>
                                                        {line.map((token, key) => (
                                                            <span key={key} {...getTokenProps({ token })} />
                                                        ))}
                                                    </div>
                                                ))}
                                            </pre>
                                        )}
                                    </Highlight>
                                ) : (
                                    <Text size="sm" c="dimmed" fs="italic">No script content.</Text>
                                )
                            )}
                        </Stack>

                        {/* sys_id */}
                        <Group justify="space-between" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                            <Text size="xs" c="dimmed">sys_id: {rule.sys_id}</Text>
                            <Anchor 
                                href={`${window.location.origin}/sys_script.do?sys_id=${rule.sys_id}`}
                                target="_blank"
                                size="xs"
                            >
                                <Group gap={4}>
                                    Open in ServiceNow <IconExternalLink size={12} />
                                </Group>
                            </Anchor>
                        </Group>
                    </Stack>
                </ScrollArea>
            )}
        </Drawer>
    )
}
