/**
 * =============================================
 * WoonstadFlowQuickAction.js
 * =============================================
 * Date: 2025-07-31
 * Description:
 * Legacy-style Lightning Web Component for a Quick Action.
 * Uses conditional rendering so the Flow only starts once
 * recordId is available, preventing undefined errors.
 */

import { LightningElement, api, track } from 'lwc';

export default class WoonstadFlowQuickAction extends LightningElement {
    // Backing field for recordId
    _recordId;

    // Track readiness of the record context
    @track ready = false;

    /**
     * Setter for recordId: called when Salesforce injects the recordId.
     * Marks the component as ready when a valid value is received.
     */
    @api
    set recordId(value) {
        this._recordId = value;
        if (value) {
            this.ready = true;
            console.log('recordId set via setter:', value);
        } else {
            console.warn('recordId setter received undefined.');
        }
    }

    /**
     * Getter for recordId: returns the backing field.
     */
    get recordId() {
        return this._recordId;
    }

    /**
     * Provides input variables for the Flow.
     * Only returns a value when recordId is ready.
     */
    get flowInputs() {
        if (this.ready && this._recordId) {
            console.log('Passing recordId into Flow:', this._recordId);
            return [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this._recordId
                }
            ];
        }
        return [];
    }

    /**
     * Handles Flow status changes and closes the Quick Action modal when finished.
     */
    handleStatusChange(event) {
        const status = event.detail.status;
        console.log('Flow status changed:', status);

        if (status === 'FINISHED' || status === 'FINISHED_SCREEN') {
            console.log('Flow finished, closing Quick Action modal.');
            this.dispatchEvent(new CustomEvent('close'));
        }
    }
}