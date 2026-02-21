var BusinessRuleService = Class.create();
BusinessRuleService.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {

    /**
     * Returns all business rules for a given table (collection field).
     * Fields returned: sys_id, name, when, order, priority, active,
     *   action_insert, action_update, action_delete, action_query,
     *   filter_condition, condition, description, abort_action
     */
    getBusinessRulesForTable: function () {
        var tableName = this.getParameter('sysparm_table');
        if (!tableName) {
            return JSON.stringify({ error: 'Missing sysparm_table parameter' });
        }

        var rules = [];
        var gr = new GlideRecord('sys_script');
        gr.addQuery('collection', tableName);
        gr.orderBy('when');
        gr.orderBy('order');
        gr.query();

        while (gr.next()) {
            rules.push({
                sys_id:          gr.getValue('sys_id'),
                name:            gr.getValue('name'),
                when:            gr.getValue('when'),
                order:           parseInt(gr.getValue('order'), 10) || 100,
                priority:        parseInt(gr.getValue('priority'), 10) || 100,
                active:          gr.getValue('active') === '1' || gr.getValue('active') === 'true',
                action_insert:   gr.getValue('action_insert') === '1' || gr.getValue('action_insert') === 'true',
                action_update:   gr.getValue('action_update') === '1' || gr.getValue('action_update') === 'true',
                action_delete:   gr.getValue('action_delete') === '1' || gr.getValue('action_delete') === 'true',
                action_query:    gr.getValue('action_query') === '1' || gr.getValue('action_query') === 'true',
                abort_action:    gr.getValue('abort_action') === '1' || gr.getValue('abort_action') === 'true',
                filter_condition: gr.getValue('filter_condition') || '',
                condition:       gr.getValue('condition') || '',
                description:     gr.getValue('description') || ''
            });
        }

        return JSON.stringify(rules);
    },

    /**
     * Returns the distinct table names (collection values) that have at least
     * one business rule — used to power the autocomplete/suggestions in the UI.
     */
    getAvailableTables: function () {
        var tables = [];
        var seen = {};
        var gr = new GlideRecord('sys_script');
        gr.addActiveQuery();
        gr.orderBy('collection');
        gr.query();

        while (gr.next()) {
            var col = gr.getValue('collection');
            if (col && !seen[col]) {
                seen[col] = true;
                tables.push(col);
            }
        }

        return JSON.stringify(tables);
    },

    /**
     * Returns the current user's recently viewed tables, stored as a JSON
     * array in sys_user_preference under the key 'x_1118332_brv.recent_tables'.
     */
    getRecentTables: function () {
        var pref = gs.getUser().getPreference('x_1118332_brv.recent_tables');
        if (!pref) {
            return JSON.stringify([]);
        }
        try {
            return pref; // already a JSON string
        } catch (e) {
            return JSON.stringify([]);
        }
    },

    /**
     * Adds a table name to the front of the user's recent-tables preference
     * (max 10 entries, no duplicates).
     * Param: sysparm_table — the table name to add.
     */
    /**
     * Returns the script body and extended metadata for a single rule by sys_id.
     * Called on-demand when the user opens the detail panel for a specific rule.
     * Param: sysparm_sys_id — the sys_id of the sys_script record.
     */
    getScriptForRule: function () {
        var sysId = this.getParameter('sysparm_sys_id');
        if (!sysId) {
            return JSON.stringify({ error: 'Missing sysparm_sys_id parameter' });
        }

        var gr = new GlideRecord('sys_script');
        if (!gr.get(sysId)) {
            return JSON.stringify({ error: 'Record not found: ' + sysId });
        }

        return JSON.stringify({
            script: gr.getValue('script') || ''
        });
    },

    saveTablePreference: function () {
        var tableName = this.getParameter('sysparm_table');
        if (!tableName) {
            return JSON.stringify({ success: false, error: 'Missing sysparm_table' });
        }

        var existing = [];
        var pref = gs.getUser().getPreference('x_1118332_brv.recent_tables');
        if (pref) {
            try {
                existing = JSON.parse(pref);
            } catch (e) {
                existing = [];
            }
        }

        // Remove the table if already present, then prepend
        existing = existing.filter(function (t) { return t !== tableName; });
        existing.unshift(tableName);

        // Keep max 10 entries
        if (existing.length > 10) {
            existing = existing.slice(0, 10);
        }

        gs.getUser().savePreference('x_1118332_brv.recent_tables', JSON.stringify(existing));
        return JSON.stringify({ success: true });
    },

    type: 'BusinessRuleService'
});
