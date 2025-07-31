/**
 * =============================================
 * WoonstadFlowQuickAction.js
 * =============================================
 * Date: 2025-07-31
 * Description:
 * Legacy-style Lightning Web Component for a Quick Action.
 * Ensures recordId is passed reliably into the Flow.
 */

import { LightningElement, api, track } from 'lwc';

export default class WoonstadFlowQuickAction extends LightningElement {
    @api recordId; // Provided by Salesforce when used as a Record Action
    @track ready = false; // Flag to track when recordId is available

    /**
     * Called when component is inserted into the DOM.
     */
    connectedCallback() {
        console.log('Quick Action launched. recordId:', this.recordId);

        // If recordId is not set yet, wait for renderedCallback
        if (this.recordId) {
            this.ready = true;
        }
    }

    /**
     * Called after render — ensures recordId is captured.
     */
    renderedCallback() {
        if (!this.ready && this.recordId) {
            console.log('RecordId became available after render:', this.recordId);
            this.ready = true;
        }
    }

    /**
     * Provides input variables for the Flow.
     */
    get flowInputs() {
        if (this.ready && this.recordId) {
            console.log('Passing recordId into Flow:', this.recordId);
            return [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this.recordId
                }
            ];
        }
        console.warn('No recordId available yet for Flow input.');
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