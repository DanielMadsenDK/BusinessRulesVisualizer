import '@servicenow/sdk/global'
import { ApplicationMenu, Record } from '@servicenow/sdk/core'

export const menu = ApplicationMenu({
    $id: Now.ID['app.menu'],
    title: 'Business Rules Visualizer',
    hint: 'Visualize and analyze ServiceNow Business Rules',
})

Record({
    $id: Now.ID['module.visualizer'],
    table: 'sys_app_module',
    data: {
        title: 'Business Rule Flow',
        application: menu.$id,
        active: true,
        link_type: 'DIRECT',
        query: 'x_1118332_brv_visualizer.do',
        order: 100,
        hint: 'Visualize the execution flow of Business Rules for any ServiceNow table',
    },
})
