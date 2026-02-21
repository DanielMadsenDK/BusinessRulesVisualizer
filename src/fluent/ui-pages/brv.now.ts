import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import brvPage from '../../client/index.html'

UiPage({
    $id: Now.ID['brv-page'],
    endpoint: 'x_1118332_brv_visualizer.do',
    description: 'Business Rules Visualizer',
    category: 'general',
    html: brvPage,
    direct: true,
})
