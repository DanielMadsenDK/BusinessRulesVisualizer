import React, { useState, useEffect, useRef } from 'react'
import { Autocomplete, Button, Group, Alert, Title, ActionIcon, Container, Menu, Tooltip, Switch, TextInput, SegmentedControl, Stack, Text, Anchor } from '@mantine/core'
import { IconSettings, IconAlertCircle, IconSearch, IconHistory, IconTrash } from '@tabler/icons-react'
import { searchTables, TableSuggestion } from '../services/BusinessRuleService'

interface TableSelectorProps {
    loading: boolean
    error: string | null
    recentTables: string[]
    onVisualize: (tableName: string) => void
    onDeleteRecentTable: (tableName: string) => void
    onDismissError: () => void
    hideInherited: boolean
    onToggleHideInherited: () => void
    hideActive: boolean
    onToggleHideActive: () => void
    hideInactive: boolean
    onToggleHideInactive: () => void
    scriptSearchQuery: string
    onScriptSearchQueryChange: (query: string) => void
}

/**
 * Header bar containing:
 * - Autocomplete input for table name (ready for SN table suggestions)
 * - Recent tables history menu
 * - "Visualize" button
 * - Visibility filter chips
 * - Error alert
 */
export default function TableSelector({
    loading,
    error,
    recentTables,
    onVisualize,
    onDeleteRecentTable,
    onDismissError,
    hideInherited,
    onToggleHideInherited,
    hideActive,
    onToggleHideActive,
    hideInactive,
    onToggleHideInactive,
    scriptSearchQuery,
    onScriptSearchQueryChange,
}: TableSelectorProps) {
    const [searchMode, setSearchMode] = useState<'table' | 'code'>('table')
    const [inputValue, setInputValue] = useState('')
    const [suggestions, setSuggestions] = useState<TableSuggestion[]>([])
    const inputRef = useRef<HTMLInputElement>(null)

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    // Debounce search
    useEffect(() => {
        if (!inputValue.trim()) {
            setSuggestions([])
            return
        }
        const timer = setTimeout(() => {
            searchTables(inputValue.trim()).then(setSuggestions).catch(console.error)
        }, 300)
        return () => clearTimeout(timer)
    }, [inputValue])

    function extractTableName(val: string): string {
        const match = val.match(/\(([^)]+)\)$/)
        return match ? match[1] : val
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (searchMode === 'code') return
        const table = extractTableName(inputValue.trim())
        if (table) onVisualize(table)
    }

    function handleOptionSubmit(val: string) {
        setInputValue(val)
        const table = extractTableName(val)
        onVisualize(table)
    }

    return (
        <Container fluid px="md" h="100%">
            <Group wrap="nowrap" align="center" w="100%" h="100%">
                {/* Left: Brand */}
                <Group gap="md" wrap="nowrap" style={{ flex: 1 }}>
                    <ActionIcon variant="light" radius="md" color="blue" aria-hidden="true" style={{ width: 54, height: 54 }}>
                        <IconSettings size={32} />
                    </ActionIcon>
                    <Stack gap={2}>
                        <Title order={3} style={{ whiteSpace: 'nowrap', lineHeight: 1.1 }}>Business Rules Visualizer</Title>
                        <Text size="sm" c="dimmed" style={{ lineHeight: 1.2 }}>Visualize ServiceNow business rules execution order</Text>
                        <Text size="xs" c="dimmed" fs="italic" style={{ lineHeight: 1.2 }}>
                            Created by <Anchor href="https://www.linkedin.com/in/danielaagrenmadsen/" target="_blank" fs="italic">Daniel Aagren Seehartrai Madsen</Anchor> • ServiceNow Rising Star 2025
                        </Text>
                    </Stack>
                </Group>

                {/* Center: Search Form & History */}
                <form onSubmit={handleSubmit} role="search" style={{ flex: 2, maxWidth: 700, margin: 0 }}>
                    <Group wrap="nowrap" gap="sm" align="center">
                        <Menu shadow="md" width={200} position="bottom-start">
                            <Menu.Target>
                                <Tooltip label="Recent tables">
                                    <ActionIcon variant="default" style={{ width: 36, height: 36 }} aria-label="Recent tables">
                                        <IconHistory size={20} />
                                    </ActionIcon>
                                </Tooltip>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>Recent Tables</Menu.Label>
                                {recentTables.length > 0 ? (
                                    recentTables.map(t => (
                                        <Menu.Item
                                            key={t}
                                            onClick={() => handleOptionSubmit(t)}
                                            rightSection={
                                                <ActionIcon
                                                    size="xs"
                                                    variant="subtle"
                                                    color="gray"
                                                    aria-label={`Remove ${t} from history`}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onDeleteRecentTable(t)
                                                    }}
                                                >
                                                    <IconTrash size={12} />
                                                </ActionIcon>
                                            }
                                        >
                                            {t}
                                        </Menu.Item>
                                    ))
                                ) : (
                                    <Menu.Item disabled>No recent tables</Menu.Item>
                                )}
                            </Menu.Dropdown>
                        </Menu>

                        <SegmentedControl
                            value={searchMode}
                            onChange={(val) => setSearchMode(val as 'table' | 'code')}
                            data={[
                                { label: 'Table', value: 'table' },
                                { label: 'Code', value: 'code' }
                            ]}
                            size="sm"
                        />

                        {searchMode === 'table' ? (
                            <>
                                <Autocomplete
                                    ref={inputRef}
                                    placeholder="Enter table name (e.g. incident)"
                                    data={suggestions.map(s => s.label)}
                                    value={inputValue}
                                    onChange={setInputValue}
                                    onOptionSubmit={handleOptionSubmit}
                                    disabled={loading}
                                    aria-label="ServiceNow table name"
                                    autoComplete="off"
                                    spellCheck={false}
                                    style={{ flex: 1 }}
                                    leftSection={<IconSearch size={16} />}
                                    maxDropdownHeight={280}
                                />
                                <Button 
                                    type="submit" 
                                    loading={loading} 
                                    disabled={!inputValue.trim()}
                                    style={{ height: 36 }}
                                >
                                    Visualize
                                </Button>
                            </>
                        ) : (
                            <TextInput
                                placeholder="Filter by script/name..."
                                value={scriptSearchQuery}
                                onChange={(e) => onScriptSearchQueryChange(e.currentTarget.value)}
                                leftSection={<IconSearch size={16} />}
                                style={{ flex: 1 }}
                                autoFocus
                            />
                        )}
                    </Group>
                </form>

                {/* Right: Filters */}
                <Group gap="md" wrap="nowrap" justify="flex-end" style={{ flex: 1 }}>
                    <Switch
                        label="Hide inherited"
                        checked={hideInherited}
                        onChange={() => onToggleHideInherited()}
                        size="sm"
                        styles={{ label: { whiteSpace: 'nowrap' } }}
                    />
                    <Switch
                        label="Hide active"
                        checked={hideActive}
                        onChange={() => onToggleHideActive()}
                        size="sm"
                        styles={{ label: { whiteSpace: 'nowrap' } }}
                    />
                    <Switch
                        label="Hide inactive"
                        checked={hideInactive}
                        onChange={() => onToggleHideInactive()}
                        size="sm"
                        styles={{ label: { whiteSpace: 'nowrap' } }}
                    />
                </Group>
            </Group>

            {error && (
                <Alert 
                    icon={<IconAlertCircle size={16} />} 
                    title="Error" 
                    color="red" 
                    withCloseButton 
                    onClose={onDismissError}
                    variant="light"
                    style={{ position: 'absolute', top: 100, right: 20, zIndex: 1000, maxWidth: 400, boxShadow: 'var(--mantine-shadow-md)' }}
                >
                    {error}
                </Alert>
            )}
        </Container>
    )
}
