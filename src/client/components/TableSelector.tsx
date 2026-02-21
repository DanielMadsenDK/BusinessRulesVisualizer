import React, { useState, useEffect, useRef } from 'react'

interface TableSelectorProps {
    loading: boolean
    error: string | null
    recentTables: string[]
    onVisualize: (tableName: string) => void
    onDismissError: () => void
    hideInherited: boolean
    onToggleHideInherited: () => void
}

/**
 * Header bar containing:
 * - Text input for table name with autocomplete suggestions
 * - Recent-table chips
 * - "Visualize" button (NDS now-button)
 * - Loading overlay (NDS now-loader)
 * - Error alert (NDS now-alert)
 */
export default function TableSelector({
    loading,
    error,
    recentTables,
    onVisualize,
    onDismissError,
    hideInherited,
    onToggleHideInherited,
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

    function handleChipClick(table: string) {
        setInputValue(table)
        onVisualize(table)
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            const table = inputValue.trim()
            if (table) onVisualize(table)
        }
    }

    return (
        <div className="table-selector">
            <div className="table-selector__top">
                <div className="table-selector__brand">
                    <span className="table-selector__logo" aria-hidden="true">⚙</span>
                    <span className="table-selector__title">Business Rules Visualizer</span>
                </div>

                <form className="table-selector__form" onSubmit={handleSubmit} role="search">
                    <div className="table-selector__input-wrap">
                        <input
                            ref={inputRef}
                            className="table-selector__input"
                            type="text"
                            placeholder="Enter table name (e.g. incident)"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            aria-label="ServiceNow table name"
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </div>
                    {/* NDS now-button */}
                    <now-button
                        label={loading ? 'Loading…' : 'Visualize'}
                        variant="primary"
                        disabled={loading || !inputValue.trim() ? true : undefined}
                        onClick={handleSubmit as unknown as React.MouseEventHandler}
                    />
                </form>

                {/* Filter: hide inherited rules */}
                <label className="table-selector__filter">
                    <input
                        type="checkbox"
                        className="table-selector__filter-check"
                        checked={hideInherited}
                        onChange={onToggleHideInherited}
                    />
                    <span className="table-selector__filter-label">Hide inherited</span>
                </label>
            </div>

            {/* Error alert */}
            {error && (
                <div className="table-selector__alert">
                    <now-alert
                        status="critical"
                        content={error}
                        closeable={true}
                        onClick={onDismissError as unknown as React.MouseEventHandler}
                    />
                </div>
            )}

            {/* Recent table chips */}
            {recentTables.length > 0 && (
                <div className="table-selector__recents">
                    <span className="table-selector__recents-label">Recent:</span>
                    {recentTables.map(table => (
                        <button
                            key={table}
                            className="table-selector__chip"
                            onClick={() => handleChipClick(table)}
                            disabled={loading}
                            type="button"
                        >
                            {table}
                        </button>
                    ))}
                </div>
            )}

            {/* Loading overlay */}
            {loading && (
                <div className="table-selector__loading" aria-live="polite" aria-label="Loading business rules">
                    <now-loader flavor="primary" size="md" />
                    <span className="table-selector__loading-text">Fetching business rules…</span>
                </div>
            )}
        </div>
    )
}
