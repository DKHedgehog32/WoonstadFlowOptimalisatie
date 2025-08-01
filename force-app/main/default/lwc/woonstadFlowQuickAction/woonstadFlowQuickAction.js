/**
 * =============================================
 * WoonstadFlowQuickAction.js
 * =============================================
 * Date: 2025-08-01
 * Last Changed: 2025-08-01
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

    /**
     * Backing field for the current record Id.
     * Set either by Salesforce injection or via pageRef fallback.
     */
    _recordId;

    /**
     * Tracks whether the component has a valid recordId
     * and is ready to render the Flow.
     */
    @track ready = false;

    /**
     * Static resource for the Woonstad Rotterdam logo.
     */
    logoUrl = LOGO;

    // ============================================
    // ========== RecordId Handling ===============
    // ============================================

    /**
     * Setter for recordId.
     * Triggered when Salesforce injects recordId into the component.
     * Ensures that the Flow only renders when recordId is available.
     *
     * @param {String} value - The record Id from the Quick Action context
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
     * @returns {String} - The current record Id if available
     */
    get recordId() {
        return this._recordId;
    }

    /**
     * Wired CurrentPageReference.
     * Provides a fallback mechanism for retrieving recordId
     * when Salesforce does not inject it automatically.
     *
     * @param {Object} pageRef - The current page reference from LWC wire service
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
     * Getter for Flow input variables.
     * Returns an array of key-value pairs to be passed into the Flow.
     *
     * @returns {Array} - Input variables for the Flow
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
     * Handler for Flow status changes.
     * Automatically closes the modal once the Flow completes.
     *
     * @param {Event} event - The Flow status change event
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
     * Handler for manual modal close events.
     * Triggered when the user clicks the modal close button.
     */
    handleClose() {
        console.log('Close button triggered on Quick Action panel.');
        this.closeAction();
    }

    /**
     * Dispatches a close event.
     * Signals Salesforce to close the Quick Action modal.
     */
    closeAction() {
        this.dispatchEvent(new CustomEvent('close'));
    }
}