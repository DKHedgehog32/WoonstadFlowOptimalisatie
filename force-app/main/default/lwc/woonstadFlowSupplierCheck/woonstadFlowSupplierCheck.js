/**
 * =============================================
 * WoonstadFlowSupplierCheck.js
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Lightning Web Component used in Salesforce Flows 
 * to allow users to confirm and (if necessary) 
 * override supplier information for a Case.
 *
 * Features:
 * - Retrieves supplier details from Apex controller.
 * - Provides a dropdown to change supplier.
 * - Allows user to edit the nameplate text.
 * - Outputs supplier details and final nameplate 
 *   text back into the Flow.
 */

import { LightningElement, api, track } from 'lwc';
import getFirstSupplier from '@salesforce/apex/RealEstateSupplierFlowController.getFirstSupplier';

export default class WoonstadFlowSupplierCheck extends LightningElement {
    // ===== Flow Variables =====
    @api recordId;               // Input: Account Id from Flow
    @api selectedSupplierName;   // Output: Supplier Name chosen
    @api selectedSupplierEmail;  // Output: Supplier Email chosen
    @api naamplaatjeInput;       // Input: Initial nameplate text from Flow
    @api naamplaatjeOutput;      // Output: Final confirmed nameplate text

    // ===== Internal State =====
    @track supplierOptions = []; // Dropdown supplier options
    @track selectedSupplier;     // Currently selected supplier
    @track klantNaam;            // Account (customer) name
    @track eigenaar;             // Contract party owner
    @track fullStreet;           // Street address
    @track postalCode;           // Postal code
    @track city;                 // City

    /**
     * Lifecycle hook: Load supplier data as soon as
     * the component is added to the DOM.
     */
    connectedCallback() {
        this.loadData();
    }

    /**
     * Calls Apex to retrieve supplier and address data.
     * Prepares dropdown options and sets initial values.
     */
    loadData() {
        getFirstSupplier({ accountId: this.recordId })
            .then(result => {
                // Map response from Apex to tracked properties
                this.klantNaam = result.klantNaam;
                this.eigenaar = result.eigenaar;
                this.fullStreet = result.fullStreet;
                this.postalCode = result.postalCode;
                this.city = result.city;

                // Predefined supplier options (static list)
                this.supplierOptions = [
                    { label: "Keller's IJzerhandel B.V.", value: "Keller's IJzerhandel B.V.", email: "denniskristoffers@icloud.com" },
                    { label: "Het Zuider Sleutelhuis B.V.", value: "Het Zuider Sleutelhuis B.V.", email: "denniskristoffers@gmail.com" },
                    { label: "IJzerhandel Overschie", value: "IJzerhandel Overschie", email: "denniskristoffers@icloud.com" }
                ];

                // Default to the supplier returned by Apex (if any)
                if (result.supplierName) {
                    this.selectedSupplier = result.supplierName;
                    this.selectedSupplierName = result.supplierName;
                    this.selectedSupplierEmail = result.supplierEmail;
                }

                // Set initial nameplate text if provided from Flow
                if (this.naamplaatjeInput) {
                    this.naamplaatjeOutput = this.naamplaatjeInput;
                }
            })
            .catch(error => {
                console.error('Error loading supplier data:', error);
            });
    }

    /**
     * Handles changes when the user selects a new supplier.
     * Updates both name and email outputs for Flow.
     */
    handleSupplierChange(event) {
        this.selectedSupplier = event.detail.value;
        const supplier = this.supplierOptions.find(
            supp => supp.value === this.selectedSupplier
        );
        if (supplier) {
            this.selectedSupplierName = supplier.label;
            this.selectedSupplierEmail = supplier.email;
        }
    }

    /**
     * Handles updates to the nameplate text input.
     * Keeps Flow output in sync with user edits.
     */
    handleNaamplaatjeChange(event) {
        this.naamplaatjeInput = event.detail.value;
        this.naamplaatjeOutput = this.naamplaatjeInput;
    }
}