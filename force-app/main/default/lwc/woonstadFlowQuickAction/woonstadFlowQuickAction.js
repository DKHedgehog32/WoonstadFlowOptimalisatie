/**
 * =============================================
 * WoonstadFlowQuickAction.js
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Legacy-style Lightning Web Component Quick Action.
 * Uses wired CurrentPageReference to fetch recordId early.
 * Ensures the Flow only loads once recordId is available.
 * Includes auto-sizing via lightning-quick-action-panel.
 */

import { LightningElement, api, track, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import LOGO from '@salesforce/resourceUrl/WSRLogo';

export default class WoonstadFlowQuickAction extends LightningElement {
    // ============================================
    // ========== Properties ======================
    // ============================================

    // Backing field for recordId
    _recordId;

    // Track readiness of record context
    @track ready = false;

    // Static resource: Woonstad Rotterdam Logo
    logoUrl = LOGO;

    // ============================================
    // ========== RecordId Handling ===============
    // ============================================

    /**
     * recordId setter: called when Salesforce injects the recordId.
     * This ensures we have the record context before rendering Flow.
     */
    @api
    set recordId(value) {
        if (value) {
            this._recordId = value;
            this.ready = true;
            console.log('recordId set via setter:', value);
        } else {
            console.warn('recordId setter received undefined.');
        }
    }

    /**
     * Getter for recordId.
     * Returns the backing field if set.
     */
    get recordId() {
        return this._recordId;
    }

    /**
     * Wired page reference: fallback to extract recordId
     * if not already set by Salesforce injection.
     * Ensures the Quick Action works even when context
     * injection is delayed or missing.
     */
    @wire(CurrentPageReference)
    wiredPageRef(pageRef) {
        if (pageRef && pageRef.state && pageRef.state.recordId && !this._recordId) {
            this._recordId = pageRef.state.recordId;
            this.ready = true;
            console.log('recordId retrieved via CurrentPageReference:', this._recordId);
        }
    }

    // ============================================
    // ========== Flow Handling ===================
    // ============================================

    /**
     * Getter: Provides Flow input variables.
     * Prepares an array with the recordId for the Flow.
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
        console.warn('Flow input unavailable: recordId not set yet.');
        return [];
    }

    /**
     * Handles Flow status changes.
     * When the Flow finishes, closes the Quick Action modal.
     */
    handleStatusChange(event) {
        const status = event.detail.status;
        console.log('Flow status changed:', status);

        if (status === 'FINISHED' || status === 'FINISHED_SCREEN') {
            console.log('Flow finished, closing Quick Action modal.');
            this.closeAction();
        }
    }

    // ============================================
    // ========== Modal Handling ==================
    // ============================================

    /**
     * Handler for manual close (user clicks close button).
     */
    handleClose() {
        console.log('Close button triggered on Quick Action panel.');
        this.closeAction();
    }

    /**
     * Dispatches the close event to tell Salesforce to close the modal.
     */
    closeAction() {
        this.dispatchEvent(new CustomEvent('close'));
    }
}