import React, { useState, useEffect, useRef } from 'react'
import { Autocomplete, Button, Group, Alert, Title, ActionIcon, Container, Menu, Tooltip, Switch } from '@mantine/core'
import { IconSettings, IconAlertCircle, IconSearch, IconHistory } from '@tabler/icons-react'

interface TableSelectorProps {
    loading: boolean
    error: string | null
    recentTables: string[]
    onVisualize: (tableName: string) => void
    onDismissError: () => void
    hideInherited: boolean
    onToggleHideInherited: () => void
    hideActive: boolean
    onToggleHideActive: () => void
    hideInactive: boolean
    onToggleHideInactive: () => void
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
    onDismissError,
    hideInherited,
    onToggleHideInherited,
    hideActive,
    onToggleHideActive,
    hideInactive,
    onToggleHideInactive,
}: TableSelectorProps) {
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const table = inputValue.trim()
        if (table) onVisualize(table)
    }

    function handleOptionSubmit(val: string) {
        setInputValue(val)
        onVisualize(val)
    }

    return (
        <Container fluid px="md" h="100%">
            <Group wrap="nowrap" align="center" w="100%" h="100%">
                {/* Left: Brand */}
                <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
                    <ActionIcon variant="light" size="lg" radius="md" color="blue" aria-hidden="true">
                        <IconSettings size={20} />
                    </ActionIcon>
                    <Title order={4} style={{ whiteSpace: 'nowrap' }}>Business Rules Visualizer</Title>
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
                                        <Menu.Item key={t} onClick={() => handleOptionSubmit(t)}>
                                            {t}
                                        </Menu.Item>
                                    ))
                                ) : (
                                    <Menu.Item disabled>No recent tables</Menu.Item>
                                )}
                            </Menu.Dropdown>
                        </Menu>

                        <Autocomplete
                            ref={inputRef}
                            placeholder="Enter table name (e.g. incident)"
                            data={[]} // Ready for ServiceNow table suggestions
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
                    style={{ position: 'absolute', top: 70, right: 20, zIndex: 1000, maxWidth: 400, boxShadow: 'var(--mantine-shadow-md)' }}
                >
                    {error}
                </Alert>
            )}
        </Container>
    )
}
