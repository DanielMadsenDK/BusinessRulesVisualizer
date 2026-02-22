import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
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

    // Close on Escape
    useEffect(() => {
        if (!rule) return
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [rule, onClose])

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
        <div
            className={`detail-panel${isOpen ? ' detail-panel--open' : ''}`}
            role="complementary"
            aria-label="Business Rule Details"
        >
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="detail-panel__header">
                <div className="detail-panel__header-left">
                    {rule && phaseStyle && (
                        <span
                            className="detail-panel__phase-badge"
                            style={{ background: phaseStyle.bg, color: phaseStyle.text }}
                        >
                            {rule.when}
                        </span>
                    )}
                    <span className="detail-panel__title" title={rule?.name ?? ''}>
                        {rule?.name ?? ''}
                    </span>
                </div>
                <button className="detail-panel__close" onClick={onClose} aria-label="Close panel">
                    ✕
                </button>
            </div>

            {/* ── Body (only rendered when a rule is selected) ──── */}
            {rule && (
                <div className="detail-panel__body">

                    {/* Metadata row */}
                    <div className="detail-panel__meta-row">
                        <span className="detail-panel__meta-pill">
                            <span className="detail-panel__meta-label">Order</span>
                            <span className="detail-panel__meta-value">#{rule.order}</span>
                        </span>
                        <span className="detail-panel__meta-pill">
                            <span className="detail-panel__meta-label">Priority</span>
                            <span className="detail-panel__meta-value">#{rule.priority}</span>
                        </span>
                        {rule.inherited_from && (
                            <span className="detail-panel__meta-pill detail-panel__meta-pill--inherited">
                                <span className="detail-panel__meta-label">Inherited from</span>
                                <span className="detail-panel__meta-value">{rule.inherited_from}</span>
                            </span>
                        )}
                        <span className={`detail-panel__status-badge${rule.active ? ' detail-panel__status-badge--active' : ' detail-panel__status-badge--inactive'}`}>
                            {rule.active ? 'Active' : 'Inactive'}
                        </span>
                        {rule.abort_action && (
                            <span className="detail-panel__abort-badge">⚠ Aborts transaction</span>
                        )}
                    </div>

                    {/* Triggers on */}
                    <div className="detail-panel__section">
                        <div className="detail-panel__section-label">Triggers on</div>
                        <div className="detail-panel__ops-row">
                            {ops.map(op => (
                                <span
                                    key={op.label}
                                    className={`detail-panel__op-chip${op.active ? ' detail-panel__op-chip--active' : ''}`}
                                >
                                    {op.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    {rule.description && (
                        <div className="detail-panel__section">
                            <div className="detail-panel__section-label">Description</div>
                            <div className="detail-panel__prose">{rule.description}</div>
                        </div>
                    )}

                    {/* Condition (simple) */}
                    {rule.condition && (
                        <div className="detail-panel__section">
                            <div className="detail-panel__section-label">Condition</div>
                            <div className="detail-panel__inline-code">{rule.condition}</div>
                        </div>
                    )}

                    {/* Filter condition (raw encoded query string) */}
                    {rule.filter_condition && (
                        <div className="detail-panel__section">
                            <div className="detail-panel__section-label">Filter condition</div>
                            <div className="detail-panel__inline-code">{rule.filter_condition}</div>
                        </div>
                    )}

                    {/* Script */}
                    <div className="detail-panel__section detail-panel__section--script">
                        <div className="detail-panel__section-header">
                            <div className="detail-panel__section-label">Script</div>
                            {script && !scriptLoading && (
                                <button
                                    className={`detail-panel__copy-btn${copied ? ' detail-panel__copy-btn--copied' : ''}`}
                                    onClick={handleCopy}
                                    title="Copy script to clipboard"
                                >
                                    {copied ? '✓ Copied' : 'Copy'}
                                </button>
                            )}
                        </div>

                        {scriptLoading && (
                            <div className="detail-panel__script-status">
                                {/* @ts-ignore — NDS web component */}
                                <now-loader size="sm" />
                                <span>Loading…</span>
                            </div>
                        )}

                        {scriptError && !scriptLoading && (
                            <div className="detail-panel__script-status detail-panel__script-status--error">
                                {scriptError}
                            </div>
                        )}

                        {script !== null && !scriptLoading && !scriptError && (
                            script.trim() ? (
                                <Highlight theme={themes.vsDark} code={script} language="javascript">
                                    {({ style, tokens, getLineProps, getTokenProps }) => (
                                        <pre className="detail-panel__script" style={style}>
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
                                <div className="detail-panel__prose detail-panel__prose--muted">No script content.</div>
                            )
                        )}
                    </div>

                    {/* sys_id */}
                    <div className="detail-panel__sysid-row">
                        <span className="detail-panel__meta-label">sys_id</span>
                        <a
                            className="detail-panel__sysid-value detail-panel__sysid-link"
                            href={`${window.location.origin}/sys_script.do?sys_id=${rule.sys_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open record in ServiceNow"
                        >
                            {rule.sys_id}
                        </a>
                    </div>

                </div>
            )}
        </div>
    )
}
