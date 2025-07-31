/**
 * =============================================
 * WoonstadFlowQuickAction.js
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Lightning Web Component controller for a Quick Action.
 * 
 * Responsibilities:
 *  - Expose recordId from Salesforce Quick Action context.
 *  - Pass recordId into the Flow 
 *    "Screen_Flow_Create_Update_New_Case_V2".
 *  - Track lifecycle events for debugging.
 *  - Close the Quick Action modal once the Flow finishes.
 */

import { LightningElement, api } from 'lwc';

export default class WoonstadFlowQuickAction extends LightningElement {
    // Record Id injected automatically when Quick Action is placed on a Record Page
    @api recordId;

    /**
     * Lifecycle hook: Called when the component is inserted into the DOM.
     * Logs whether recordId is available.
     */
    connectedCallback() {
        if (this.recordId) {
            console.log('Quick Action launched. recordId:', this.recordId);
        } else {
            console.error('Quick Action launched without recordId. This Quick Action may not be tied to Account, Case, or Contact.');
        }
    }

    /**
     * Lifecycle hook: Called after every render of the component.
     * Confirms recordId is present after rendering.
     */
    renderedCallback() {
        console.log('Rendered. recordId:', this.recordId);
    }

    /**
     * Prepares the input variables for the Flow.
     * Returns an array mapping recordId to the Flow variable.
     */
    get flowInputs() {
        if (this.recordId) {
            console.log('Passing recordId into Flow:', this.recordId);
            return [
                {
                    name: 'recordId',
                    type: 'String',
                    value: this.recordId
                }
            ];
        }
        return []; // If no recordId, return an empty array
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