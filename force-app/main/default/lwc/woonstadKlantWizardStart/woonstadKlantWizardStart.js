/**
 * =============================================
 * WoonstadKlantWizardStart.js
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Start screen logic for the Woonstad Customer/Company Wizard.
 * - Provides search input for existing customers/companies.
 * - Includes actions for creating a new customer or company.
 * - Supports cancel and next navigation handlers.
 */

import { LightningElement, track } from 'lwc';
import LOGO from '@salesforce/resourceUrl/WSRLogo';

export default class WoonstadKlantWizardStart extends LightningElement {
    // Reactive variable bound to the search input field
    @track searchTerm = '';

    // Logo reference from static resource
    logoUrl = LOGO;

    /**
     * Updates searchTerm when user types in the search box.
     */
    handleSearchChange(event) {
        this.searchTerm = event.target.value;
    }

    /**
     * Handles search action.
     * (Currently logs, later integrate with Apex or Omnistudio call)
     */
    handleSearch() {
        console.log('Zoeken naar klant/bedrijf:', this.searchTerm);
    }

    /**
     * Triggered when the "Bedrijf aanmaken" option is selected.
     */
    handleCreateCompany() {
        console.log('Bedrijf aanmaken geselecteerd');
    }

    /**
     * Triggered when the "Klant aanmaken" option is selected.
     */
    handleCreateCustomer() {
        console.log('Klant aanmaken geselecteerd');
    }

    /**
     * Handles cancel action (return to previous screen or reset wizard).
     */
    handleCancel() {
        console.log('Annuleren');
    }

    /**
     * Proceeds to the next step in the wizard flow.
     */
    handleNext() {
        console.log('Volgende stap');
    }
}