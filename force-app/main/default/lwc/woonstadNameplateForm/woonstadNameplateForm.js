/**
 * =============================================
 * woonstadNameplateForm.js
 * =============================================
 * Date: 2025-08-06
 * Last Changed: 2025-08-06
 * Description:
 * Naamplaatje form for Flow screens.
 * - Maps Flow inputOnly variables (xxxIn) into outputs (xxx)
 * - Ensures prefills are shown when navigating Back in Flow
 * - Supplier dropdown with safe defaults
 * - DEBUG logging to trace prefills and state
 * =============================================
 */

import { LightningElement, api, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import NAME_FIELD from '@salesforce/schema/Account.Name';

const FIELDS = [NAME_FIELD];

export default class WoonstadNameplateForm extends LightningElement {
    // Flow Input (prefill variables)
    @api recordId;
    @api nameplateNameIn;
    @api reasonIn;
    @api supplierNameIn;
    @api supplierEmailIn;
    @api supplierNoteIn;

    // Flow Output (already deployed variables)
    @api nameplateName;
    @api reason;
    @api supplierName;
    @api supplierEmail;
    @api supplierNote;
    @api invalidVar;

    @track accountName;
    @track showToast = false;
    @track toastMessage = '';
    @track highlightSupplierInput = false;
    @track supplierOptions = [];
    initialized = false;

    reasonOptions = [
        { label: 'Vernield / gestolen', value: 'Vernield / gestolen' },
        { label: 'Nieuwe woning', value: 'Nieuwe woning' },
        { label: 'Scheiding', value: 'Scheiding' }
    ];

    noSupplierOption = { label: "Geen leverancier gevonden", value: "Geen leverancier gevonden", email: null };

    connectedCallback() {
        console.log('[DEBUG] woonstadNameplateForm connectedCallback fired.');

        this.supplierOptions = [
            { label: "Keller's IJzerhandel B.V.", value: "Keller's IJzerhandel B.V.", email: "denniskristoffers@icloud.com" },
            { label: "Het Zuider Sleutelhuis B.V.", value: "Het Zuider Sleutelhuis B.V.", email: "denniskristoffers@gmail.com" },
            { label: "IJzerhandel Overschie", value: "IJzerhandel Overschie", email: "denniskristoffers@icloud.com" },
            { label: "Weijntjes Hang- En Sluitwerk", value: "Weijntjes Hang- En Sluitwerk", email: "dennis.kristoffers@cobracrm.nl" }
        ];
    }

    renderedCallback() {
        if (!this.initialized) {
            console.log('[DEBUG] renderedCallback: applying Flow prefills');

            if (this.nameplateNameIn) {
                this.nameplateName = this.nameplateNameIn;
                this.dispatchEvent(new FlowAttributeChangeEvent('nameplateName', this.nameplateName));
                console.log('[DEBUG] Prefill applied: nameplateName =', this.nameplateName);
            }
            if (this.reasonIn) {
                this.reason = this.reasonIn;
                this.dispatchEvent(new FlowAttributeChangeEvent('reason', this.reason));
                console.log('[DEBUG] Prefill applied: reason =', this.reason);
            }
            if (this.supplierNameIn) {
                this.supplierName = this.supplierNameIn;
                this.dispatchEvent(new FlowAttributeChangeEvent('supplierName', this.supplierName));
                console.log('[DEBUG] Prefill applied: supplierName =', this.supplierName);
            }
            if (this.supplierEmailIn) {
                this.supplierEmail = this.supplierEmailIn;
                this.dispatchEvent(new FlowAttributeChangeEvent('supplierEmail', this.supplierEmail));
                console.log('[DEBUG] Prefill applied: supplierEmail =', this.supplierEmail);
            }
            if (this.supplierNoteIn) {
                this.supplierNote = this.supplierNoteIn;
                this.dispatchEvent(new FlowAttributeChangeEvent('supplierNote', this.supplierNote));
                console.log('[DEBUG] Prefill applied: supplierNote =', this.supplierNote);
            }

            // Supplier validation
            if (!this.supplierName || this.supplierName === this.noSupplierOption.value) {
                this.setInvalidVar(true, 'no supplier selected');
            } else {
                this.setInvalidVar(false, 'supplier valid');
            }

            this.initialized = true;
        }
    }

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredAccount({ data }) {
        if (data && !this.nameplateName) {
            this.accountName = data.fields.Name.value;
            console.log('[DEBUG] Account name loaded:', this.accountName);
        }
    }

    handleNameChange(event) {
        this.nameplateName = event.target.value.trim();
        this.dispatchEvent(new FlowAttributeChangeEvent('nameplateName', this.nameplateName));
        console.log('[DEBUG] Nameplate updated:', this.nameplateName);
    }

    handleSuggestionClick() {
        if (!this.nameplateName || this.nameplateName.trim() === '') {
            this.nameplateName = this.accountName;
            this.dispatchEvent(new FlowAttributeChangeEvent('nameplateName', this.nameplateName));
            console.log('[DEBUG] Suggestion applied:', this.nameplateName);
        }
    }

    handleReasonChange(event) {
        this.reason = event.detail.value;
        this.dispatchEvent(new FlowAttributeChangeEvent('reason', this.reason));
        console.log('[DEBUG] Reason updated:', this.reason);
    }

    handleSupplierChange(event) {
        this.supplierName = event.detail.value;
        const selected = this.supplierOptions.find(s => s.value === this.supplierName);
        this.supplierEmail = selected ? selected.email : null;

        this.dispatchEvent(new FlowAttributeChangeEvent('supplierName', this.supplierName));
        this.dispatchEvent(new FlowAttributeChangeEvent('supplierEmail', this.supplierEmail));

        if (this.supplierName !== this.noSupplierOption.value) {
            this.highlightSupplierInput = false;
            this.setInvalidVar(false, 'supplier selected');
        } else {
            this.highlightSupplierInput = true;
            this.setInvalidVar(true, 'geen leverancier gevonden');
        }
    }

    handleNoteChange(event) {
        this.supplierNote = event.target.value.trim();
        this.dispatchEvent(new FlowAttributeChangeEvent('supplierNote', this.supplierNote));
        console.log('[DEBUG] Supplier note updated:', this.supplierNote);
    }

    @api
    validate() {
        console.log('[DEBUG] validate() called. invalidVar =', this.invalidVar);
        if (this.invalidVar === true) {
            this.showCustomToast('Leverancier ontbreekt.');
            return { isValid: false };
        }
        return { isValid: true };
    }

    showCustomToast(message) {
        this.toastMessage = message;
        this.showToast = true;
        console.log('[DEBUG] Toast shown:', message);

        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            this.showToast = false;
        }, 4000);
    }

    setInvalidVar(value, reason) {
        this.invalidVar = value;
        this.dispatchEvent(new FlowAttributeChangeEvent('invalidVar', this.invalidVar));
        console.log(`[DEBUG] invalidVar set to ${value} (${reason})`);
    }

    get supplierInputClass() {
        return this.highlightSupplierInput ? 'form-input input-error' : 'form-input';
    }

    get nameInputClass() {
        return 'form-input';
    }
}