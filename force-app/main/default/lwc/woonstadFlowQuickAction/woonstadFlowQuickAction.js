/**
 * =============================================
 * WoonstadFlowQuickAction.js
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Lightning Web Component that acts as a Quick Action
 * wrapper for launching a Flow. 
 * - Passes the current recordId to the Flow.
 * - Listens for Flow status changes.
 * - Closes the Quick Action modal when the Flow finishes.
 */

import { LightningElement, api } from 'lwc';

export default class WoonstadFlowQuickAction extends LightningElement {
    // Record Id of the context record (injected by Salesforce Quick Action)
    @api recordId;

    /**
     * Lifecycle hook: Called when the component is inserted into the DOM.
     */
    connectedCallback() {
        console.log('Quick Action launched. recordId:', this.recordId);
    }

    /**
     * Prepares input variables for the Flow.
     * Returns an array of Flow input objects containing recordId.
     */
    get flowInputs() {
        console.log('Passing recordId into Flow:', this.recordId);
        if (this.recordId) {
            return [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this.recordId
                }
            ];
        }
        console.error('No recordId found. This Quick Action may not be tied to an Account.');
        return [];
    }

    /**
     * Handles Flow status changes.
     * Closes the Quick Action modal once the Flow finishes.
     */
    handleStatusChange(event) {
        console.log('Flow status changed:', event.detail.status);
        if (event.detail.status === 'FINISHED' || event.detail.status === 'FINISHED_SCREEN') {
            console.log('Flow finished, closing Quick Action modal.');
            this.dispatchEvent(new CustomEvent('close'));
        }
    }
}