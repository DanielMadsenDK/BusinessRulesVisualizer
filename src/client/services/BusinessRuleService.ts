/** Shape of a single Business Rule record from sys_script */
export interface BusinessRule {
    sys_id: string
    name: string
    /** 'before' | 'after' | 'async' | 'display' */
    when: 'before' | 'after' | 'async' | 'display'
    order: number
    priority: number
    active: boolean
    action_insert: boolean
    action_update: boolean
    action_delete: boolean
    action_query: boolean
    abort_action: boolean
    filter_condition: string
    condition: string
    description: string
    /**
     * Name of the ancestor table this rule is defined on, or null if the rule
     * belongs directly to the queried table.
     */
    inherited_from: string | null
}

const SCRIPT_INCLUDE = 'x_1118332_brv.BusinessRuleService'

function callGlideAjax(method: string, params: Record<string, string> = {}): Promise<string> {
    return new Promise((resolve, reject) => {
        const ga = new GlideAjax(SCRIPT_INCLUDE)
        ga.addParam('sysparm_name', method)
        for (const [key, value] of Object.entries(params)) {
            ga.addParam(key, value)
        }
        ga.getXMLAnswer((response: string) => {
            if (response === null || response === undefined) {
                reject(new Error(`No response from ${method}`))
            } else {
                resolve(response)
            }
        })
    })
}

/** Fetch all business rules for a given table name */
export async function getBusinessRulesForTable(tableName: string): Promise<BusinessRule[]> {
    const raw = await callGlideAjax('getBusinessRulesForTable', { sysparm_table: tableName })
    const parsed = JSON.parse(raw)
    if (parsed.error) throw new Error(parsed.error)
    return parsed as BusinessRule[]
}

/** Fetch the list of distinct table names that have at least one business rule */
export async function getAvailableTables(): Promise<string[]> {
    const raw = await callGlideAjax('getAvailableTables')
    return JSON.parse(raw) as string[]
}

/** Fetch recently viewed tables for the current user (from sys_user_preference) */
export async function getRecentTables(): Promise<string[]> {
    const raw = await callGlideAjax('getRecentTables')
    return JSON.parse(raw) as string[]
}

/** Persist a table name in the current user's recent-tables preference */
export async function saveTablePreference(tableName: string): Promise<void> {
    await callGlideAjax('saveTablePreference', { sysparm_table: tableName })
}

export interface BusinessRuleScript {
    /** Full script body (ServiceNow JavaScript) */
    script: string
}

/**
 * Fetch the script body for a single business rule on demand.
 * Separated from getBusinessRulesForTable to keep the list payload small.
 */
export async function getScriptForRule(sysId: string): Promise<BusinessRuleScript> {
    const raw = await callGlideAjax('getScriptForRule', { sysparm_sys_id: sysId })
    const parsed = JSON.parse(raw)
    if (parsed.error) throw new Error(parsed.error)
    return parsed as BusinessRuleScript
}
