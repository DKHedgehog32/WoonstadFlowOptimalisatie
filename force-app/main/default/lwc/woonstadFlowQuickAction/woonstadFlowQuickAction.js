/**
 * =============================================
 * WoonstadFlowQuickAction.js
 * =============================================
 * Date: 2025-07-31
 * Description:
 * Legacy-style Lightning Web Component for a Quick Action.
 * Ensures recordId is captured via setter and passed reliably to the Flow.
 * 
 * Key Features:
 * - Uses @api getter/setter for recordId to detect asynchronous injection.
 * - Tracks readiness via a boolean flag.
 * - Provides Flow input variables only when recordId is available.
 * - Handles Flow status changes and closes the modal when finished.
 */

import { LightningElement, api, track } from 'lwc';

export default class WoonstadFlowQuickAction extends LightningElement {
    // Backing field for recordId
    _recordId;

    // Flag to track readiness
    @track ready = false;

    /**
     * recordId setter: called when Salesforce injects the recordId.
     */
    @api
    set recordId(value) {
        this._recordId = value;
        if (value) {
            console.log('recordId set via setter:', value);
            this.ready = true;
        } else {
            console.warn('recordId setter received undefined.');
        }
    }

    /**
     * recordId getter: returns the backing recordId.
     */
    get recordId() {
        return this._recordId;
    }

    /**
     * Lifecycle hook: Called when the component is inserted into the DOM.
     */
    connectedCallback() {
        console.log('Quick Action connected. recordId:', this._recordId);
    }

    /**
     * Lifecycle hook: Called after each render. 
     * Double-checks if recordId is available after render.
     */
    renderedCallback() {
        if (!this.ready && this._recordId) {
            console.log('RecordId became available after render:', this._recordId);
            this.ready = true;
        }
    }

    /**
     * Getter: Provides input variables for the Flow.
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
        console.warn('Flow input unavailable: recordId not ready.');
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