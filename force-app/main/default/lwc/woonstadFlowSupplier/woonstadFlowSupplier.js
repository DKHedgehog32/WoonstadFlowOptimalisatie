/**
 * =============================================
 * WoonstadFlowSupplier.js
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Lightning Web Component for retrieving supplier 
 * information in a Flow based on an Account Id.
 * - Calls Apex RealEstateSupplierFlowController.getFirstSupplier.
 * - Outputs KlantNaam, Eigenaar, SupplierName, and SupplierEmail 
 *   for use in Flow.
 * - Flags noSupplierFound when no supplier is available.
 */

import { LightningElement, api, wire, track } from 'lwc';
import getFirstSupplier from '@salesforce/apex/RealEstateSupplierFlowController.getFirstSupplier';

export default class WoonstadFlowSupplier extends LightningElement {
    // Input provided by Flow
    @api accountId;

    // Outputs for Flow
    @api klantNaam;      // Account Name
    @api eigenaar;       // Contract party name
    @api supplierName;   // Determined supplier name
    @api supplierEmail;  // Determined supplier email

    // Flag for conditional handling in Flow
    @track noSupplierFound = false;

    /**
     * Wire method to call Apex and retrieve supplier info
     * based on the provided Account Id.
     */
    @wire(getFirstSupplier, { accountId: '$accountId' })
    wiredSupplier({ error, data }) {
        console.log('WoonstadFlowSupplier called with accountId:', this.accountId);

        if (data) {
            console.log('Data received from Apex:', JSON.stringify(data));

            // Map Apex response to Flow variables
            this.klantNaam = data.klantNaam;
            this.eigenaar = data.eigenaar;
            this.supplierName = data.supplierName;
            this.supplierEmail = data.supplierEmail;

            // Flag if supplier or klantNaam is missing
            this.noSupplierFound = !(this.supplierName && this.klantNaam);

            // Debug output
            console.log('Klant Naam:', this.klantNaam);
            console.log('Eigenaar:', this.eigenaar);
            console.log('Supplier:', this.supplierName);
            console.log('Email:', this.supplierEmail);
        } else if (error) {
            console.error('Error from Apex:', JSON.stringify(error));
            this.noSupplierFound = true;
        }
    }
}