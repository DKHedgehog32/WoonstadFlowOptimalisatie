/**
 * =============================================
 * WoonstadFlowQuickAction.js
 * =============================================
 * Date: 2025-08-01
 * Last Changed: 2025-08-01
 * Description:
 * Legacy-style Quick Action for launching a Flow.
 * Passes recordId to the Flow and closes modal 
 * when the Flow completes.
 */

import { LightningElement, api } from 'lwc';
import LOGO from '@salesforce/resourceUrl/WSRLogo';

export default class WoonstadFlowQuickAction extends LightningElement {
    // Record Id provided by Salesforce Quick Action
    @api recordId;

    // Static resource for logo
    logoUrl = LOGO;

    connectedCallback() {
        console.log('Quick Action launched. recordId:', this.recordId);
    }

    renderedCallback() {
        console.log('Rendered. recordId:', this.recordId);
    }

    /**
     * Getter for Flow input variables
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
        console.warn('Flow input unavailable: recordId not set yet.');
        return [];
    }

    /**
     * Handle Flow status changes
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