/**
 * =============================================
 * WoonstadFlowSupplier.js
 * =============================================
 * Date: 2025-08-05
 * Last Changed: 2025-08-05
 * Description:
 * Lightning Web Component that toggles between 
 * displaying Supplier data (via Apex) and 
 * Account Shipping Address data (via Flow inputs).
 * - If showAccountData = true → requires Shipping fields.
 * - Includes Flow validation and inline error display.
 */

import { LightningElement, api, wire, track } from 'lwc';
import getFirstSupplier from '@salesforce/apex/RealEstateSupplierFlowController.getFirstSupplier';

export default class WoonstadFlowSupplier extends LightningElement {
    // ========== Inputs from Flow ==========
    @api accountId;            // Used for supplier lookup
    @api showAccountData;      // Boolean: true = show account shipping, false = show supplier

    // Account Shipping data (required when showAccountData = true)
    @api shippingStreet;
    @api shippingPostalCode;
    @api shippingCity;

    // ========== Supplier Data (from Apex) ==========
    @api klantNaam;       // Account name
    @api eigenaar;        // Contract party name
    @api supplierName;    // Supplier name
    @api supplierEmail;   // Supplier email

    // ========== UI State ==========
    @track noSupplierFound = false;   // True if no supplier is available
    @track errorMessage = '';         // Error message to show under shipping address

    /**
     * Wire to fetch supplier data only when we need supplier info
     */
    @wire(getFirstSupplier, { accountId: '$accountId' })
    wiredSupplier({ error, data }) {
        if (!this.showAccountData) { // skip if we are showing account data
            if (data) {
                // Map data from Apex response
                this.klantNaam = data.klantNaam;
                this.eigenaar = data.eigenaar;
                this.supplierName = data.supplierName;
                this.supplierEmail = data.supplierEmail;

                // Supplier must exist and have klantNaam
                this.noSupplierFound = !(this.supplierName && this.klantNaam);
            } else if (error) {
                console.error('Error from Apex:', JSON.stringify(error));
                this.noSupplierFound = true;
            }
        }
    }

    /**
     * Flow validation method:
     * Called automatically when Flow attempts to go to the next screen.
     * Prevents navigation if account data is shown but required fields are missing.
     */
    @api
    validate() {
        if (this.showAccountData) {
            if (!this.shippingStreet || !this.shippingPostalCode || !this.shippingCity) {
                this.errorMessage = 'Alle adresvelden zijn verplicht wanneer accountgegevens worden weergegeven.';
                return {
                    isValid: false,
                    errorMessage: this.errorMessage
                };
            }
        }
        this.errorMessage = ''; // clear previous error if valid
        return { isValid: true };
    }
}