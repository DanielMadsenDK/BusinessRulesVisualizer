// handles importing scss as modules
declare module '*.scss' {
    const content: string
    export default content
}

// ServiceNow globals injected by <sdk:now-ux-globals>
declare global {
    interface Window {
        /** CSRF token — must be sent as X-UserToken on REST requests */
        g_ck: string
    }

    /** GlideAjax client-side class provided by ServiceNow */
    class GlideAjax {
        constructor(scriptIncludeName: string)
        addParam(name: string, value: string): void
        getXMLAnswer(callback: (response: string) => void): void
        getXML(callback: (response: XMLHttpRequest) => void): void
    }
}

// ServiceNow Now Design System web components
declare namespace JSX {
    interface IntrinsicElements {
        'now-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
            label?: string
            variant?: 'primary' | 'secondary' | 'tertiary' | 'icon'
            size?: 'sm' | 'md' | 'lg'
            disabled?: boolean
            icon?: string
            'icon-position'?: 'start' | 'end'
            tooltipContent?: string
        }, HTMLElement>
        'now-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
            icon?: string
            size?: 'sm' | 'md' | 'lg'
        }, HTMLElement>
        'now-loader': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
            flavor?: 'primary' | 'secondary'
            size?: 'sm' | 'md' | 'lg'
        }, HTMLElement>
        'now-alert': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
            status?: 'info' | 'positive' | 'warning' | 'critical'
            content?: string
            heading?: string
            closeable?: boolean
        }, HTMLElement>
    }
}

export {}
