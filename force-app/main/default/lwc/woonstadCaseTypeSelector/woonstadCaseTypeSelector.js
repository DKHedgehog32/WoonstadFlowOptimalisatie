/**
 * =============================================
 * WoonstadCaseTypeSelector.js
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Lightning Web Component controller for rendering 
 * a Case.Type picklist. Fetches picklist values based 
 * on the provided RecordTypeId and exposes the selected 
 * value back to Salesforce Flow.
 */

import { LightningElement, api, track, wire } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import TYPE_FIELD from '@salesforce/schema/Case.Type';

export default class WoonstadCaseTypeSelector extends LightningElement {
    // Record Type Id provided by Flow or parent component
    @api recordTypeId;

    // Holds all picklist options retrieved from Salesforce
    @track picklistOptions = [];

    // Internal storage for the selected value
    @track _selectedValue;

    /**
     * Public getter/setter for the selected value.
     * This makes the value accessible to Flow.
     */
    @api
    get selectedValue() {
        return this._selectedValue;
    }
    set selectedValue(value) {
        this._selectedValue = value;
    }

    /**
     * Wire adapter to fetch Case.Type picklist values 
     * for the given record type.
     */
    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: TYPE_FIELD })
    wiredPicklist({ error, data }) {
        if (data) {
            // Map Salesforce picklist entries into label/value pairs
            this.picklistOptions = data.values.map(option => ({
                label: option.label,
                value: option.value
            }));

            // Special case: auto-select "Name Plate" for a specific RecordType
            if (this.recordTypeId === '012Ts000000xbLNIAY') {
                const hasNamePlate = this.picklistOptions.some(opt => opt.value === 'Name Plate');
                if (hasNamePlate) {
                    this._selectedValue = 'Name Plate';
                } else {
                    console.warn('Name Plate is not a valid option for this record type');
                }
            }
            // If no selection yet, set the Salesforce default value if available
            else if (!this._selectedValue && data.defaultValue) {
                this._selectedValue = data.defaultValue.value;
            }
        } else if (error) {
            console.error('Error fetching Case.Type values:', error);
        }
    }

    /**
     * Handles user selection from the combobox.
     * Updates the tracked selected value.
     */
    handleChange(event) {
        this._selectedValue = event.detail.value;
    }
}