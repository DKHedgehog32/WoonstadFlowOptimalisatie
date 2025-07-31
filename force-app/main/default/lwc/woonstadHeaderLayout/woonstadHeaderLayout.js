/**
 * =============================================
 * WoonstadHeaderLayout.js
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Custom LWC for displaying Woonstad-branded 
 * record header layout. 
 * - Displays Account details (Preferred Communication,
 *   Preferred Phone, Email).
 * - Provides quick actions (edit, share, delete, etc.).
 * - Allows launching a Flow in a modal to create a new Case.
 */

import { LightningElement, api, wire, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import LOGO from '@salesforce/resourceUrl/WSRLogo';

// Fields to retrieve from Account
const FIELDS = [
    'Account.Name',
    'Account.Preferred_Communication_Channel__pc',
    'Account.Preferred_Phone__pc',
    'Account.PersonEmail'
];

export default class WoonstadHeaderLayout extends NavigationMixin(LightningElement) {
    // Record Id injected by Salesforce (context record)
    @api recordId;

    // Logo for Woonstad branding
    logoUrl = LOGO;

    // Default label (will be overridden by Account.Name)
    objectLabel = 'Person Account';

    // Tracked record details
    @track recordData = {
        PreferredCommunication: '—',
        PreferredPhone: '—',
        Email: '—'
    };

    // Control visibility of Flow modal
    @track showFlowModal = false;

    // Modal-specific title
    modalTitle = 'Nieuwe Zaak Aanmaken';

    /**
     * Computed property for mailto link.
     */
    get emailHref() {
        return this.recordData.Email && this.recordData.Email !== '—'
            ? `mailto:${this.recordData.Email}`
            : null;
    }

    /**
     * Wire adapter: retrieves Account data.
     */
    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord({ error, data }) {
        if (data) {
            this.recordData = {
                PreferredCommunication: data.fields.Preferred_Communication_Channel__pc?.value || '—',
                PreferredPhone: data.fields.Preferred_Phone__pc?.value || '—',
                Email: data.fields.PersonEmail?.value || '—'
            };
            this.objectLabel = data.fields.Name?.value || 'Person Account';
        } else if (error) {
            console.error('Error loading record data:', JSON.stringify(error));
        }
    }

    // ========================
    // Flow Modal Handling
    // ========================

    /**
     * Opens the modal to create a new Case via Flow.
     */
    handleNieuweZaak() {
        this.showFlowModal = true;
    }

    /**
     * Closes the new Case Flow modal.
     */
    closeNieuweZaakModal() {
        this.showFlowModal = false;
    }

    /**
     * Handles Flow lifecycle events; closes modal when finished.
     */
    handleFlowStatusChange(event) {
        if (event.detail.status === 'FINISHED' || event.detail.status === 'FINISHED_SCREEN') {
            this.showFlowModal = false;
        }
    }

    // ========================
    // Navigation Actions
    // ========================

    /**
     * Opens the edit page for the current record.
     */
    handleEdit() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: this.recordId, actionName: 'edit' }
        });
    }

    /**
     * Opens the share page for the current record.
     */
    handleSharing() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: this.recordId, actionName: 'share' }
        });
    }

    /**
     * Opens the sharing hierarchy for the current record.
     */
    handleSharingHierarchy() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Account',
                relationshipApiName: 'Sharing'
            }
        });
    }

    /**
     * Handles menu actions dynamically (delete, print, recordType, owner).
     */
    handleMenuAction(event) {
        const action = event.detail.value;
        switch (action) {
            case 'delete':
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: { recordId: this.recordId, actionName: 'delete' }
                });
                break;
            case 'print':
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: { recordId: this.recordId, actionName: 'view' },
                    state: { printable: '1' }
                });
                break;
            case 'recordType':
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: { recordId: this.recordId, actionName: 'edit' }
                });
                break;
            case 'owner':
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: { recordId: this.recordId, actionName: 'changeowner' }
                });
                break;
        }
    }
}