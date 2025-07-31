/**
 * =============================================
 * woonstadCaseTimeline.js
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Lightning Web Component to display a timeline of 
 * recent Cases for an Account. Fetches data via Apex, 
 * shows the 5 most recent Cases by default, and allows 
 * users to view more in a modal.
 */

import { LightningElement, api, track } from 'lwc';
import getCasesForAccount from '@salesforce/apex/WoonstadTimelineController.getCasesForAccount'; // Updated class name
import CaseIcon from '@salesforce/resourceUrl/CaseIcon';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class WoonstadCaseTimeline extends LightningElement {
    // RecordId of the Account (injected when placed on an Account page)
    @api recordId;

    // Stores the first 5 Cases for quick view
    @track cases = [];

    // Stores the full list of Cases
    @track allCases = [];

    // Controls modal visibility for "View More"
    @track showModal = false;

    // Case icon (static resource)
    @track iconUrl = CaseIcon;

    // Controls display of "Show More" link if > 5 cases exist
    @track showMoreLink = false;

    // Datatable column definitions
    columns = [
        { label: 'Zaaknummer', fieldName: 'CaseNumber' },
        { label: 'Onderwerp', fieldName: 'Subject' },
        { label: 'Status', fieldName: 'Status' },
        { 
            label: 'Datum aangemaakt', 
            fieldName: 'CreatedDate', 
            type: 'date', 
            typeAttributes: { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            } 
        }
    ];

    /**
     * Runs when the component is inserted into the DOM.
     * Fetches Case data for the current Account.
     */
    connectedCallback() {
        if (this.recordId) {
            getCasesForAccount({ accountId: this.recordId })
                .then(result => {
                    // Deep clone result to avoid proxy issues
                    const plainResult = JSON.parse(JSON.stringify(result));

                    // Sort cases by CreatedDate (newest first)
                    const sortedCases = plainResult.sort(
                        (a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate)
                    );

                    // Prepare the first 5 Cases for display with formatted date
                    this.cases = sortedCases.slice(0, 5).map(cs => ({
                        Id: cs.Id,
                        CaseNumber: cs.CaseNumber,
                        Subject: cs.Subject,
                        Status: cs.Status,
                        CreatedDate: cs.CreatedDate,
                        formattedDate: new Intl.DateTimeFormat('nl-NL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }).format(new Date(cs.CreatedDate))
                    }));

                    // Store all Cases for modal view
                    this.allCases = plainResult;

                    // Show "Meer weergeven" link if more than 5 Cases exist
                    this.showMoreLink = plainResult.length > 5;
                })
                .catch(error => {
                    // Show error message if Apex call fails
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Fout bij laden zaken',
                            message: error.body?.message || error.message,
                            variant: 'error'
                        })
                    );
                });
        }
    }

    /**
     * Opens the clicked Case in a new browser tab.
     */
    handleSubjectClick(event) {
        const caseId = event.target.dataset.id;
        window.open(`/lightning/r/Case/${caseId}/view`, '_blank');
    }

    /**
     * Opens the modal with the full Case list.
     */
    openModal() {
        this.showModal = true;
    }

    /**
     * Closes the modal.
     */
    closeModal() {
        this.showModal = false;
    }
}