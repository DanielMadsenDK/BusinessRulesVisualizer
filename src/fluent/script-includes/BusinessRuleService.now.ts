import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

export const businessRuleService = ScriptInclude({
    $id: Now.ID['si.business_rule_service'],
    name: 'BusinessRuleService',
    apiName: 'x_1118332_brv.BusinessRuleService',
    script: Now.include('./BusinessRuleService.server.js'),
    description: 'Provides GlideAjax methods for querying business rules and managing user table preferences for the Business Rules Visualizer.',
    callerAccess: 'tracking',
    clientCallable: true,
    mobileCallable: true,
    sandboxCallable: true,
    accessibleFrom: 'public',
    active: true,
})
