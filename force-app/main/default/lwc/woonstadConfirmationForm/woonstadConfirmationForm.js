/**
 * =============================================
 * woonstadConfirmationForm.js
 * =============================================
 * Date: 2025-08-06
 * Last Changed: 2025-08-06
 * Description:
 * Confirmation form for Flow inputs combined with
 * Apex RealEstateSupplierFlowController results.
 * Includes red warning when Naamplaatje is missing.
 * ============================================= */

import { LightningElement, api, wire, track } from 'lwc';
import getFirstSupplier from '@salesforce/apex/RealEstateSupplierFlowController.getFirstSupplier';

export default class WoonstadConfirmationForm extends LightningElement {
    // Flow Inputs
    @api recordId;
    @api flowInputNamePlate;
    @api flowInputName;
    @api flowInputReason;
    @api flowInputSupplierName;

    // Apex Outputs
    @track fullStreet;
    @track postalCode;
    @track city;
    @track eigenaar;

    // Wire Apex
    @wire(getFirstSupplier, { accountId: '$recordId' })
    wiredSupplier({ error, data }) {
        if (data) {
            console.log('✅ Apex returned data:', JSON.stringify(data, null, 2));
            this.fullStreet = data.fullStreet;
            this.postalCode = data.postalCode;
            this.city = data.city;
            this.eigenaar = data.eigenaar;
        } else if (error) {
            console.error('❌ Error retrieving supplier data:', JSON.stringify(error, null, 2));
        }
    }

    // Insert formatted address into DOM
    renderedCallback() {
        const container = this.template.querySelector('[data-id="addressContainer"]');
        if (container) {
            container.innerHTML = this.displayAddress;
        }
    }

    // Check if Naamplaatje is missing
    get isNamePlateMissing() {
        return !this.flowInputNamePlate;
    }

    get displayNamePlate() {
        return this.flowInputNamePlate;
    }

    get displayReason() {
        return this.flowInputReason ? this.flowInputReason : '...';
    }

    get displayAddress() {
        if (this.fullStreet || this.postalCode || this.city) {
            return `${this.fullStreet || ''}<br/>${this.postalCode || ''} ${this.city || ''}`;
        }
        return '...';
    }
}