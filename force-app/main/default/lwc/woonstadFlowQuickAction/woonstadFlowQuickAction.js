/**
 * =============================================
 * WoonstadFlowQuickAction.js
 * =============================================
 * Date: 2025-07-31
 * Description:
 * Legacy-style Lightning Web Component Quick Action.
 * Uses wired CurrentPageReference to fetch recordId early.
 * Ensures the Flow only loads once recordId is available.
 */

import { LightningElement, api, track, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';

export default class WoonstadFlowQuickAction extends LightningElement {
    // Backing field for recordId
    _recordId;

    // Track readiness of record context
    @track ready = false;

    /**
     * recordId setter: called when Salesforce injects the recordId.
     */
    @api
    set recordId(value) {
        if (value) {
            this._recordId = value;
            this.ready = true;
            console.log('recordId set via setter:', value);
        }
    }

    /**
     * Getter for recordId.
     */
    get recordId() {
        return this._recordId;
    }

    /**
     * Wired page reference: fallback to extract recordId
     * if not already set by Salesforce injection.
     */
    @wire(CurrentPageReference)
    wiredPageRef(pageRef) {
        if (pageRef && pageRef.state && pageRef.state.recordId && !this._recordId) {
            this._recordId = pageRef.state.recordId;
            this.ready = true;
            console.log('recordId retrieved via CurrentPageReference:', this._recordId);
        }
    }

    /**
     * Getter: Provides Flow input variables.
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
     * Handles Flow status changes and closes the modal when finished.
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